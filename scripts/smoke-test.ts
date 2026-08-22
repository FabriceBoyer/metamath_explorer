import { readFileSync } from "node:fs";
import {
  buildFastIndex,
  enrichIndexWithEngine,
} from "../src/lib/metamath/index-builder";

const path =
  "/tmp/claude-1000/-home-fabrice-boyer-dev-metamath-explorer/5306d740-1d96-4532-b232-115d6ee0725e/scratchpad/set.mm";
const src = readFileSync(path, "utf8");

const t0 = Date.now();
const index = buildFastIndex(src, {
  sourceUrl: "test",
  fetchedAt: new Date().toISOString(),
  byteLength: src.length,
  sha256: "test",
});
const t1 = Date.now();
console.log(`Fast pass: ${t1 - t0}ms`);
console.log("statementCount", index.meta.statementCount);
console.log("theoremCount", index.meta.theoremCount);
console.log("axiomCount", index.meta.axiomCount);
console.log("constants sample", index.constants.slice(0, 10));
console.log(
  "sections (top level)",
  index.sections.map((s) => s.title),
);
console.log("wn:", JSON.stringify(index.statements["wn"]));
console.log("ax-1:", JSON.stringify(index.statements["ax-1"]));
console.log(
  "2p2e4 exists?",
  Boolean(index.statements["2p2e4"]),
  index.statements["2p2e4"]
    ? {
        expression: index.statements["2p2e4"].expression,
        deps: index.statements["2p2e4"].proof?.dependencies,
        comment: index.statements["2p2e4"].comment?.slice(0, 120),
        section: index.statements["2p2e4"].sectionPath,
      }
    : null,
);

const t2 = Date.now();
const { mm } = enrichIndexWithEngine(src, index);
const t3 = Date.now();
console.log(`Enrich pass: ${t3 - t2}ms`);
console.log(
  "ax-1 enriched:",
  JSON.stringify({
    hyps: index.statements["ax-1"].hypotheses,
    floating: index.statements["ax-1"].mandatoryFloating,
    dvs: index.statements["ax-1"].distinctVars,
  }),
);
console.log(
  "2p2e4 enriched proof steps (first 5):",
  index.statements["2p2e4"]?.proof?.steps.slice(0, 5),
);

// on-demand verify smoke test
const resultFn = (mm.labels["2p2e4"] as unknown[])[2] as (
  generate?: boolean,
) => unknown;
const verifyStart = Date.now();
const steps = resultFn(false);
console.log(
  `Verify 2p2e4: ${Date.now() - verifyStart}ms, steps:`,
  Array.isArray(steps) ? steps.length : steps,
);
