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

  it("restores a theorem's own scope so its disjoint-variable requirements are still visible when verified later", () => {
    // Regression test for a real bug: verifying a theorem long after the
    // whole file has been processed means every $ { $ } block has already
    // been popped off the engine's scope stack, so a $d requirement
    // declared only in the theorem's own (now-closed) block could no
    // longer be found — verify() would wrongly throw "Undeclared disjoint
    // variable" on a perfectly valid proof. `ax-dv` requires its two
    // mandatory variables to be disjoint; `thm` uses it with A/B, which
    // are only declared disjoint inside thm's own block.
    const DV_SOURCE = `
      $c wff |- -> ( ) $.
      $v ph ps A B $.
      wph $f wff ph $.
      wps $f wff ps $.
      wA $f wff A $.
      wB $f wff B $.
      \${
        $d ph ps $.
        ax-dv $a |- ( ph -> ps ) $.
      \$}
      \${
        $d A B $.
        thm $p |- ( A -> B ) $= wA wB ax-dv $.
      \$}
    `;
    const dvMeta = {
      sourceUrl: "test",
      fetchedAt: new Date(0).toISOString(),
      byteLength: DV_SOURCE.length,
      sha256: "test",
    };
    const dvIndex = buildFastIndex(DV_SOURCE, dvMeta);
    const { mm: dvMm, dvScopeByLabel } = enrichIndexWithEngine(
      DV_SOURCE,
      dvIndex,
    );
    const dvLabels = dvMm.labels as Record<string, unknown[]>;
    const frames = dvMm.frames as unknown as { stack: unknown[] };
    const resultFn = dvLabels["thm"][2] as (
      generate?: boolean,
      markers?: boolean,
    ) => unknown[];

    // Without restoring the snapshot (i.e. the pre-fix behavior), the
    // whole file has already been processed and thm's block is closed.
    expect(() => resultFn(false, false)).toThrow(/disjoint variable/i);

    // With the theorem's own scope restored, verification succeeds.
    const original = frames.stack;
    frames.stack = dvScopeByLabel.get("thm")!;
    try {
      const steps = resultFn(false, false);
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
    } finally {
      frames.stack = original;
    }
  });
});
