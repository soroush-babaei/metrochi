// Direct TypeScript port of metro_graph.py.
// Preserves Dijkstra logic, transfer costs, branch handling, and path compression.

import data from "@/data/tehran_metro.json";

export const STATION_COST = 1;
export const TRANSFER_COST = 100;
export const TRANSFER_TIME_MIN = 4;
export const STATION_TIME_MIN = 2;

export type Mode = "fastest" | "least_transfers";

export interface LineInfo {
  id: number;
  name: string;
  name_fa: string;
  color: string;
}

export interface StationInfo {
  name: string;
  lines: number[];
  is_transfer: boolean;
  under_construction: boolean;
}

export interface RouteStep {
  station: string;
  line_id: number;
  line_name: string;
  line_color: string;
  is_transfer: boolean;
  under_construction: boolean;
  /** e.g. سمت تجریش / کهریزک (derived from line terminals) */
  direction_name?: string;
}

export interface RouteResult {
  path: string[];
  lines: number[];
  transfers: string[];
  station_count: number;
  estimated_time: number;
  transfer_count: number;
  steps: RouteStep[];
  mode: Mode;
}

interface NodeKey {
  station: string;
  line: number;
}
const key = (n: NodeKey) => `${n.line}|${n.station}`;

// Min-heap
class MinHeap<T> {
  private a: { p: number; v: T; seq: number }[] = [];
  private s = 0;
  push(p: number, v: T) {
    this.a.push({ p, v, seq: this.s++ });
    this.up(this.a.length - 1);
  }
  pop(): { p: number; v: T } | undefined {
    if (!this.a.length) return;
    const top = this.a[0];
    const last = this.a.pop()!;
    if (this.a.length) {
      this.a[0] = last;
      this.down(0);
    }
    return { p: top.p, v: top.v };
  }
  get size() {
    return this.a.length;
  }
  private up(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.cmp(i, p) < 0) {
        [this.a[i], this.a[p]] = [this.a[p], this.a[i]];
        i = p;
      } else break;
    }
  }
  private down(i: number) {
    const n = this.a.length;
    for (;;) {
      const l = 2 * i + 1,
        r = l + 1;
      let m = i;
      if (l < n && this.cmp(l, m) < 0) m = l;
      if (r < n && this.cmp(r, m) < 0) m = r;
      if (m !== i) {
        [this.a[i], this.a[m]] = [this.a[m], this.a[i]];
        i = m;
      } else break;
    }
  }
  private cmp(i: number, j: number) {
    return this.a[i].p - this.a[j].p || this.a[i].seq - this.a[j].seq;
  }
}

class MetroGraph {
  lines = new Map<number, LineInfo>();
  lineColors = new Map<number, string>();
  lineNames = new Map<number, string>();
  stations = new Map<string, Set<number>>();
  underConstruction = new Set<string>();
  adjacency = new Map<string, Array<{ to: NodeKey; cost: number }>>();

  private lineStations = new Map<number, string[]>();
  private lineFirstLast = new Map<number, { first: string; last: string }>();
  private stationIndexByLine = new Map<number, Map<string, number>>();

  constructor() {
    const d = data as {
      lines: LineInfo[];
      stations: Record<string, string[]>;
      transfers: { station: string; lines: number[] }[];
      under_construction: string[];
      branches: Record<string, string[]>;
    };

    for (const line of d.lines) {
      this.lines.set(line.id, line);
      this.lineColors.set(line.id, line.color);
      this.lineNames.set(line.id, line.name_fa);
    }

    this.underConstruction = new Set(d.under_construction ?? []);

    const addStation = (name: string, lid: number) => {
      if (!this.stations.has(name)) this.stations.set(name, new Set());
      this.stations.get(name)!.add(lid);
    };
    const addEdge = (a: NodeKey, b: NodeKey, cost: number) => {
      const ka = key(a);
      if (!this.adjacency.has(ka)) this.adjacency.set(ka, []);
      this.adjacency.get(ka)!.push({ to: b, cost });
    };

    for (const [lidStr, stations] of Object.entries(d.stations)) {
      const lid = parseInt(lidStr, 10);
      this.lineStations.set(lid, stations);
      if (stations.length)
        this.lineFirstLast.set(lid, {
          first: stations[0],
          last: stations[stations.length - 1],
        });
      const idx = new Map<string, number>();
      stations.forEach((s, i) => idx.set(s, i));
      this.stationIndexByLine.set(lid, idx);

      for (const s of stations) addStation(s, lid);
      for (let i = 0; i < stations.length - 1; i++) {
        const a = { station: stations[i], line: lid };
        const b = { station: stations[i + 1], line: lid };
        addEdge(a, b, STATION_COST);
        addEdge(b, a, STATION_COST);
      }
    }

    for (const [branchKey, branchStations] of Object.entries(
      d.branches ?? {},
    )) {
      const lid = parseInt(branchKey.replace(/\D/g, ""), 10);
      for (const s of branchStations) addStation(s, lid);
      for (let i = 0; i < branchStations.length - 1; i++) {
        const a = { station: branchStations[i], line: lid };
        const b = { station: branchStations[i + 1], line: lid };
        addEdge(a, b, STATION_COST);
        addEdge(b, a, STATION_COST);
      }
    }

    // Transfer edges between lines at shared stations
    for (const [station, linesSet] of this.stations.entries()) {
      if (linesSet.size > 1) {
        const ls = [...linesSet];
        for (let i = 0; i < ls.length; i++) {
          for (let j = i + 1; j < ls.length; j++) {
            addEdge({ station, line: ls[i] }, { station, line: ls[j] }, 0);
            addEdge({ station, line: ls[j] }, { station, line: ls[i] }, 0);
          }
        }
      }
    }
  }

  getAllStations(): StationInfo[] {
    const out: StationInfo[] = [];
    const names = [...this.stations.keys()].sort((a, b) =>
      a.localeCompare(b, "fa"),
    );
    for (const name of names) {
      const ls = [...this.stations.get(name)!].sort((a, b) => a - b);
      out.push({
        name,
        lines: ls,
        is_transfer: ls.length > 1,
        under_construction: this.underConstruction.has(name),
      });
    }
    return out;
  }

  findRoute(
    start: string,
    end: string,
    mode: Mode = "fastest",
  ): RouteResult | null {
    if (!this.stations.has(start) || !this.stations.has(end)) return null;

    if (start === end) {
      const line = [...this.stations.get(start)!][0];
      return this.enrich(
        {
          path: [start],
          lines: [line],
          transfers: [],
          station_count: 1,
          estimated_time: 0,
          transfer_count: 0,
        },
        mode,
      );
    }

    const dist = new Map<string, number>();
    const prev = new Map<string, NodeKey>();
    const heap = new MinHeap<{ node: NodeKey; parent: NodeKey | null }>();

    for (const lid of this.stations.get(start)!) {
      const sn = { station: start, line: lid };
      heap.push(0, { node: sn, parent: null });
      dist.set(key(sn), 0);
    }

    let foundEnd: NodeKey | null = null;

    while (heap.size) {
      const top = heap.pop()!;
      const { p: cost, v } = top;
      const { node, parent } = v;
      const nk = key(node);

      if (prev.has(nk) && parent !== null) continue;
      if (parent !== null) prev.set(nk, parent);

      if (node.station === end) {
        foundEnd = node;
        break;
      }
      if (cost > (dist.get(nk) ?? Infinity)) continue;

      const adj = this.adjacency.get(nk) ?? [];
      for (const { to: neighbor, cost: edgeCost } of adj) {
        const isTransfer =
          neighbor.station === node.station && neighbor.line !== node.line;
        let stepCost: number;
        if (mode === "least_transfers") {
          stepCost = isTransfer ? TRANSFER_COST : STATION_COST;
        } else {
          stepCost = isTransfer ? 0 : edgeCost + STATION_COST;
        }
        const newCost = cost + stepCost;
        const tk = key(neighbor);
        if (newCost < (dist.get(tk) ?? Infinity)) {
          dist.set(tk, newCost);
          heap.push(newCost, { node: neighbor, parent: node });
        }
      }
    }

    if (!foundEnd) return null;

    // Reconstruct
    const pathNodes: NodeKey[] = [];
    let cur: NodeKey | undefined = foundEnd;
    while (cur) {
      pathNodes.push(cur);
      cur = prev.get(key(cur));
    }
    pathNodes.reverse();

    // Compress duplicates (transfer at same station)
    const compressed: NodeKey[] = [];
    for (const n of pathNodes) {
      if (
        !compressed.length ||
        compressed[compressed.length - 1].station !== n.station
      ) {
        compressed.push(n);
      } else {
        compressed[compressed.length - 1] = n;
      }
    }

    const stationNames = compressed.map((n) => n.station);
    const lineIds = compressed.map((n) => n.line);
    const transfers: string[] = [];
    for (let i = 1; i < compressed.length; i++) {
      if (compressed[i].line !== compressed[i - 1].line)
        transfers.push(compressed[i].station);
    }
    const stationCount = stationNames.length;
    const estimatedTime =
      (stationCount - 1) * STATION_TIME_MIN +
      transfers.length * TRANSFER_TIME_MIN;

    return this.enrich(
      {
        path: stationNames,
        lines: lineIds,
        transfers,
        station_count: stationCount,
        estimated_time: estimatedTime,
        transfer_count: transfers.length,
      },
      mode,
    );
  }

  private enrich(
    r: Omit<RouteResult, "steps" | "mode">,
    mode: Mode,
  ): RouteResult {
    const steps: RouteStep[] = r.path.map((station, i) => {
      const lid = r.lines[i];

      // Derive direction (terminal) from next station on same line.
      // If we move forward in the stations list => terminal is `last`, otherwise => `first`.
      let direction_name: string | undefined;
      const nextStation = r.path[i + 1];
      const nextLid = r.lines[i + 1];
      if (i < r.path.length - 1 && nextStation && nextLid === lid) {
        const idx = this.stationIndexByLine.get(lid);
        const firstLast = this.lineFirstLast.get(lid);
        if (idx && firstLast) {
          const curIdx = idx.get(station);
          const nextIdx = idx.get(nextStation);
          if (curIdx != null && nextIdx != null && nextIdx !== curIdx) {
            direction_name =
              nextIdx > curIdx ? firstLast.last : firstLast.first;
          }
        }
      }

      return {
        station,
        line_id: lid,
        line_name: this.lineNames.get(lid) ?? "",
        line_color: this.lineColors.get(lid) ?? "#888",
        is_transfer: r.transfers.includes(station),
        under_construction: this.underConstruction.has(station),
        direction_name,
      };
    });
    return { ...r, steps, mode };
  }
}

export const metroGraph = new MetroGraph();
export const allStations = metroGraph.getAllStations();
export const allLines = [...metroGraph.lines.values()];
