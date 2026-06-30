const { metroGraph, allStations } = require("./graph");


function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

function validateStationsExist(from, to) {
    const set = new Set(allStations.map((s) => s.name));
    assert(set.has(from), `Start station not found: ${from}`);
    assert(set.has(to), `End station not found: ${to}`);
}

function isValidPath(result) {
    if (!result) return false;
    assert(result.path.length === result.lines.length, "path/lines length mismatch");
    assert(result.steps.length === result.path.length, "steps/path length mismatch");
    for (let i = 1; i < result.path.length; i++) {
        assert(result.path[i] != null && result.path[i - 1] != null, "missing station");
    }
    return true;
}

function pickSomeStations() {
    const names = allStations.map((s) => s.name).sort();
    const out = [];
    const n = names.length;
    const step = Math.max(1, Math.floor(n / 10));
    for (let i = 0; i < n && out.length < 12; i += step) out.push(names[i]);
    return out;
}

function runCase(c) {
    console.log(`\n=== CASE: ${c.name} ===`);
    console.log(`Mode: ${c.mode}`);
    console.log(`Input: from='${c.from}' to='${c.to}'`);

    validateStationsExist(c.from, c.to);
    const result = metroGraph.findRoute(c.from, c.to, c.mode);
    console.log("Generated route:", result);

    assert(result !== null, `Expected a route, got null for ${c.name}`);
    assert(isValidPath(result), "Invalid route shape");

    if (c.from === c.to) {
        assert(result.station_count === 1, "station_count should be 1 when from==to");
        assert(result.estimated_time === 0, "estimated_time should be 0 when from==to");
        assert(result.transfers.length === 0, "No transfers when from==to");
    }

    if (result.path.length > 1) {
        const derived = [];
        for (let i = 1; i < result.lines.length; i++) {
            if (result.lines[i] !== result.lines[i - 1]) derived.push(result.path[i]);
        }
        for (const t of derived) {
            assert(
                result.transfers.includes(t),
                `Transfer mismatch: expected transfer at '${t}' but got [${result.transfers.join(",")}]`
            );
        }
    }
}

function main() {
    const picks = pickSomeStations();
    assert(picks.length >= 4, "Not enough stations to run QA cases");

    const cases = [
        { name: "Start == Destination", from: picks[0], to: picks[0], mode: "fastest" },
        { name: "Reverse direction", from: picks[1], to: picks[2], mode: "fastest" },
        { name: "Reverse direction (least transfers)", from: picks[2], to: picks[1], mode: "least_transfers" },
        { name: "Different stations (fastest)", from: picks[3], to: picks[4] || picks[0], mode: "fastest" },
        { name: "Different stations (least transfers)", from: picks[4] || picks[0], to: picks[3], mode: "least_transfers" },
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

    for (const c of cases) runCase(c);
    console.log("\nAll QA cases passed shape/invariants.");
}

main();

