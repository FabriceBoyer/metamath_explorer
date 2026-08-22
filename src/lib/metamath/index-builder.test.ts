import { describe, expect, it } from "vitest";
import { buildFastIndex, enrichIndexWithEngine } from "./index-builder";

const TOY_SOURCE = `
$c wff |- -> ( ) $.
$v ph ps ch $.
wph $f wff ph $.
wps $f wff ps $.
wch $f wff ch $.
wi $a wff ( ph -> ps ) $.
$( First axiom of propositional calculus. $)
ax-1 $a |- ( ph -> ( ps -> ph ) ) $.
ax-2 $a |- ( ( ph -> ( ps -> ch ) ) -> ( ( ph -> ps ) -> ( ph -> ch ) ) ) $.
\${
  min $e |- ph $.
  maj $e |- ( ph -> ps ) $.
  ax-mp $a |- ps $.
\$}
$( Identity theorem, proved from the axioms. $)
idALT $p |- ( ph -> ph ) $=
  ( wi ax-1 ax-2 ax-mp ) AAABZBZFAACAFABBGFBAFCAFADEE $.
`;

const meta = {
  sourceUrl: "test",
  fetchedAt: new Date(0).toISOString(),
  byteLength: TOY_SOURCE.length,
  sha256: "test",
};

describe("buildFastIndex", () => {
  it("indexes every labelled statement with its expression and comment", () => {
    const index = buildFastIndex(TOY_SOURCE, meta);

    expect(index.labelOrder).toEqual([
      "wph",
      "wps",
      "wch",
      "wi",
      "ax-1",
      "ax-2",
      "min",
      "maj",
      "ax-mp",
      "idALT",
    ]);
    expect(index.meta.theoremCount).toBe(1);
    expect(index.meta.axiomCount).toBe(3); // ax-1, ax-2, ax-mp (wi is syntax, not counted)
    expect(index.statements["ax-1"].comment).toBe(
      "First axiom of propositional calculus.",
    );
    expect(index.statements["wi"].kind).toBe("syntax");
    expect(index.statements["ax-1"].kind).toBe("axiom");
  });

  it("extracts external dependencies from a compressed proof without running the engine", () => {
    const index = buildFastIndex(TOY_SOURCE, meta);
    const proof = index.statements["idALT"].proof;
    expect(proof?.compressed).toBe(true);
    expect(new Set(proof?.dependencies)).toEqual(
      new Set(["wi", "ax-1", "ax-2", "ax-mp"]),
    );
    // Hypotheses aren't resolved until the engine enrichment pass.
    expect(index.statements["idALT"].hypotheses).toEqual([]);
  });
});

describe("enrichIndexWithEngine", () => {
  it("fills in mandatory hypotheses and lets the engine verify the proof", () => {
    const index = buildFastIndex(TOY_SOURCE, meta);
    const { mm } = enrichIndexWithEngine(TOY_SOURCE, index);

    expect(
      index.statements["ax-1"].mandatoryFloating.map((h) => h.label),
    ).toEqual(["wph", "wps"]);
    expect(index.statements["ax-mp"].hypotheses.map((h) => h.label)).toEqual([
      "min",
      "maj",
    ]);

    const labels = mm.labels as Record<string, unknown[]>;
    const resultFn = labels["idALT"][2] as (generate?: boolean) => unknown[];
    const steps = resultFn(false);
    expect(Array.isArray(steps)).toBe(true);
    expect((steps as unknown[]).length).toBeGreaterThan(0);
  });
});
