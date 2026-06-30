import { metroGraph, allStations } from "./graph";

type Mode = "fastest" | "least_transfers";

type QACase = {
  name: string;
  from: string;
  to: string;
  mode: Mode;
};

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function isValidPath(result: ReturnType<typeof metroGraph.findRoute>) {
  if (!result) return false;
  assert(
    result.path.length === result.lines.length,
    "path/lines length mismatch",
  );
  assert(
    result.steps.length === result.path.length,
    "steps/path length mismatch",
  );
  for (let i = 1; i < result.path.length; i++) {
    // continuity: station list must change only at single station step boundaries
    assert(
      result.path[i] !== undefined && result.path[i - 1] !== undefined,
      "missing station",
    );
  }
  return true;
}

function validateStationsExist(from: string, to: string) {
  const set = new Set(allStations.map((s) => s.name));
  assert(set.has(from), `Start station not found: ${from}`);
  assert(set.has(to), `End station not found: ${to}`);
}

function runCase(c: QACase) {
  console.log(`\n=== CASE: ${c.name} ===`);
  console.log(`Mode: ${c.mode}`);
  console.log(`Input: from='${c.from}' to='${c.to}'`);

  validateStationsExist(c.from, c.to);

  const result = metroGraph.findRoute(c.from, c.to, c.mode);
  console.log("Generated route:", result);

  assert(result !== null, `Expected a route, got null for ${c.name}`);
  assert(isValidPath(result), "Invalid route shape");

  // Edge case: identical stations
  if (c.from === c.to) {
    assert(
      result!.station_count === 1,
      "station_count should be 1 when from==to",
    );
    assert(
      result!.estimated_time === 0,
      "estimated_time should be 0 when from==to",
    );
    assert(result!.transfers.length === 0, "No transfers when from==to");
  }

  // Transfers consistency: any station where line changes should be in transfers list.
  // (This is weak but catches common compression bugs.)
  if (result!.path.length > 1) {
    const derived: string[] = [];
    for (let i = 1; i < result!.lines.length; i++) {
      if (result!.lines[i] !== result!.lines[i - 1])
        derived.push(result!.path[i]);
    }
    // result.transfers is derived from compressed sequence in graph.ts; require subset match.
    for (const t of derived) {
      assert(
        result!.transfers.includes(t),
        `Transfer mismatch: expected transfer at '${t}' but got [${result!.transfers.join(",")}]`,
      );
    }
  }
}

function pickSomeStations() {
  // Deterministic selection based on sorted station names.
  const names = allStations.map((s) => s.name).sort();
  // Fallbacks: pick 10 evenly spaced to ensure we test various lines/transfers.
  const out: string[] = [];
  const n = names.length;
  const step = Math.max(1, Math.floor(n / 10));
  for (let i = 0; i < n && out.length < 12; i += step) out.push(names[i]);
  return out;
}

export function main() {
  // Construct cases that include: same station, reverse direction, and likely transfer pairs.
  const picks = pickSomeStations();
  assert(picks.length >= 4, "Not enough stations to run QA cases");

  const cases: QACase[] = [
    {
      name: "Start == Destination",
      from: picks[0],
      to: picks[0],
      mode: "fastest",
    },
    {
      name: "Reverse direction",
      from: picks[1],
      to: picks[2],
      mode: "fastest",
    },
    {
      name: "Reverse direction (least transfers)",
      from: picks[2],
      to: picks[1],
      mode: "least_transfers",
    },
    {
      name: "Different stations (fastest)",
      from: picks[3],
      to: picks[4] ?? picks[0],
      mode: "fastest",
    },
    {
      name: "Different stations (least transfers)",
      from: picks[4] ?? picks[0],
      to: picks[3],
      mode: "least_transfers",
    },
  ];

  // Add a few more cases to increase transfer probability: pairs from different ends.
  const n = picks.length;
  for (let i = 0; i < Math.min(4, n - 1); i++) {
    cases.push({
      name: `Stress pair ${i + 1}`,
      from: picks[i],
      to: picks[n - 1 - i],
      mode: i % 2 === 0 ? "fastest" : "least_transfers",
    });
  }

  for (const c of cases) runCase(c);

  console.log("\nAll QA cases passed shape/invariants.");
}

// Run if executed directly with ts-node/bun.
if (require.main === module) {
  main();
}
