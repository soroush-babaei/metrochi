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

function validateStationsExist(from: string, to: string) {
    const set = new Set(allStations.map((s) => s.name));
    assert(set.has(from), `Start station not found: ${from}`);
    assert(set.has(to), `End station not found: ${to}`);
}

function validateCase(c: QACase) {
    console.log(`\n=== CASE: ${c.name} ===`);
    console.log(`Mode: ${c.mode}`);
    console.log(`Input: from='${c.from}' to='${c.to}'`);

    validateStationsExist(c.from, c.to);

    const result = metroGraph.findRoute(c.from, c.to, c.mode);
    console.log("Generated route:", result);

    assert(result !== null, `Expected a route, got null for ${c.name}`);

    assert(result!.path.length === result!.lines.length, "path/lines length mismatch");
    assert(result!.steps.length === result!.path.length, "steps/path length mismatch");
    assert(result!.station_count === result!.path.length, "station_count mismatch");

    if (c.from === c.to) {
        assert(result!.station_count === 1, "station_count should be 1 when from==to");
        assert(result!.estimated_time === 0, "estimated_time should be 0 when from==to");
        assert(result!.transfer_count === 0, "transfer_count should be 0 when from==to");
        assert(result!.transfers.length === 0, "No transfers when from==to");
    }
}

function pickStations() {
    const names = allStations.map((s) => s.name).sort((a, b) => a.localeCompare(b, "fa"));
    const step = Math.max(1, Math.floor(names.length / 10));
    const out: string[] = [];
    for (let i = 0; i < names.length && out.length < 12; i += step) out.push(names[i]);
    return out;
}

export function run() {
    const picks = pickStations();
    assert(picks.length >= 5, "Not enough stations to run QA cases");

    const cases: QACase[] = [
        { name: "Start == Destination", from: picks[0], to: picks[0], mode: "fastest" },
        { name: "Reverse direction", from: picks[1], to: picks[2], mode: "fastest" },
        { name: "Reverse direction (least transfers)", from: picks[2], to: picks[1], mode: "least_transfers" },
        { name: "Different stations (fastest)", from: picks[3], to: picks[4], mode: "fastest" },
        { name: "Different stations (least transfers)", from: picks[4], to: picks[3], mode: "least_transfers" },
    ];

    const n = picks.length;
    for (let i = 0; i < Math.min(4, n - 1); i++) {
        cases.push({
            name: `Stress pair ${i + 1}`,
            from: picks[i],
            to: picks[n - 1 - i],
            mode: i % 2 === 0 ? "fastest" : "least_transfers",
        });
    }

    for (const c of cases) validateCase(c);
    console.log("\nAll node-based QA cases passed (basic invariants).\n");
}

// CLI entry
if (import.meta.url && process.env.METRO_QA === "1") {
    run();
}

