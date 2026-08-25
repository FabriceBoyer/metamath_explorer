import { parse } from "@/vendor/metamath-js/descent";
import { MM } from "@/vendor/metamath-js/engine";
import {
  extractComments,
  findLabelStatementPositions,
  extractDocAnnotations,
  buildNewlineIndex,
  offsetToLine,
} from "./comments";
import { buildSectionTree } from "./sections";
import { classifyKind } from "./classify";
import type {
  MetamathIndex,
  MetamathIndexMeta,
  ProofInfo,
  StatementToken,
} from "./types";

type RawStatement =
  | ["$c" | "$v" | "$d", string[]]
  | [string, "$f", string, string]
  | [string, "$e", string, string[]]
  | [string, "$a", string, string[]]
  | [string, "$p", string, string[], string, unknown]
  | "push"
  | "pop";

/**
 * First pass: a plain (no scope-tracking) parse of the whole file. This
 * alone is enough to browse, search and draw the dependency graph — it
 * takes ~2s for the full set.mm on a modern machine, vs. ~1 minute for the
 * full scope-aware pass (see {@link enrichIndexWithEngine}), because it
 * skips Metamath's mandatory-hypothesis frame computation entirely.
 */
export function buildFastIndex(
  src: string,
  meta: Omit<
    MetamathIndexMeta,
    "statementCount" | "theoremCount" | "axiomCount"
  >,
): MetamathIndex {
  const comments = extractComments(src);
  const labelPositions = findLabelStatementPositions(src, comments);
  const { descriptionByLabel, headings } = extractDocAnnotations(
    src,
    labelPositions,
    comments,
  );
  const newlineOffsets = buildNewlineIndex(src);
  const { sections, sectionPathByLabel } = buildSectionTree(
    headings,
    labelPositions,
    newlineOffsets,
  );

  const lineByLabel = new Map<string, number>();
  for (const pos of labelPositions) {
    lineByLabel.set(pos.label, offsetToLine(newlineOffsets, pos.start));
  }

  const index: MetamathIndex = {
    meta: { ...meta, statementCount: 0, theoremCount: 0, axiomCount: 0 },
    constants: [],
    variables: [],
    labelOrder: [],
    statements: {},
    sections,
  };

  let theoremCount = 0;
  let axiomCount = 0;

  parse(src, {
    feed(stmt: RawStatement) {
      if (stmt === "push" || stmt === "pop") return;
      const first = stmt[0];

      if (first === "$c") {
        index.constants.push(...(stmt[1] as string[]));
        return;
      }
      if (first === "$v") {
        index.variables.push(...(stmt[1] as string[]));
        return;
      }
      if (first === "$d") return;

      const token = stmt[1] as StatementToken;
      const label = first;
      const typecode = stmt[2] as string;

      const expression =
        token === "$f" ? [stmt[3] as string] : (stmt[3] as string[]);
      const kind = classifyKind(token, typecode, label);

      let proof: ProofInfo | undefined;
      if (token === "$p") {
        theoremCount++;
        const rawProof = stmt[5] as unknown;
        const isCompressed = Array.isArray(rawProof) && rawProof[0] === "(";
        if (isCompressed) {
          const external = (rawProof as [string, string[], string, string])[1];
          proof = {
            compressed: true,
            steps: [],
            dependencies: Array.from(new Set(external)),
          };
        } else {
          const flat = rawProof as string[];
          proof = {
            compressed: false,
            steps: flat,
            dependencies: Array.from(new Set(flat)),
          };
        }
      } else if (token === "$a" && typecode === "|-") {
        axiomCount++;
      }

      index.statements[label] = {
        label,
        token,
        kind,
        typecode,
        expression,
        mandatoryFloating: [],
        hypotheses: [],
        distinctVars: [],
        proof,
        comment: descriptionByLabel.get(label),
        line: lineByLabel.get(label) ?? 0,
        sectionPath: sectionPathByLabel.get(label) ?? [],
      };
      index.labelOrder.push(label);
    },
  });

  index.meta.statementCount = index.labelOrder.length;
  index.meta.theoremCount = theoremCount;
  index.meta.axiomCount = axiomCount;

  return index;
}

type FEntry = [string, string, string]; // [typecode, varName, label]
type EEntry = [string[], string, string]; // [expression, typecode, label]
type DvEntry = [string, string];
type Assertion = [
  DvEntry[],
  FEntry[],
  EEntry[],
  [string, string[]],
  unknown,
  unknown,
];

/** A snapshot of `mm.frames.stack` (the array of still-open `Frame`
 * objects) at the exact moment a `$p` statement was fed to the engine —
 * see {@link processWithScopeSnapshots} for why this needs capturing. */
type FrameStack = unknown[];

/**
 * Equivalent to the vendored `process()` (see vendor/metamath-js
 * descent.js) — same push/feed/pop dispatch loop, copied rather than
 * reused only because `process()` doesn't expose a hook, and we need one:
 * `Stack.lookupD()`, called deep inside `verify()` to check disjoint-
 * variable substitutions, reads the *current* `mm.frames.stack`. By the
 * time the whole file has been fed, every `${ … $}` block has been popped
 * back off that stack, so a theorem whose disjoint-variable requirement
 * was declared in its own (now long-closed) enclosing block can no
 * longer find it — `verify()` then throws "Undeclared disjoint variable"
 * even though the proof is perfectly valid. Capturing the live frame
 * stack right when each `$p` is defined, and temporarily restoring it
 * before verifying that theorem later (see the worker's `verifyLabel`),
 * fixes this without touching the vendored scope/verification logic.
 */
function processWithScopeSnapshots(src: string): {
  mm: MM;
  dvScopeByLabel: Map<string, FrameStack>;
} {
  const mm = new MM();
  mm.push();
  const dvScopeByLabel = new Map<string, FrameStack>();

  parse(src, {
    feed(statement: unknown) {
      if (statement === "push") {
        mm.push();
      } else if (statement === "pop") {
        mm.pop();
      } else {
        mm.feed([statement]);
        const stmt = statement as unknown[];
        if (stmt[1] === "$p") {
          const label = stmt[0] as string;
          const frames = mm.frames as unknown as { stack: FrameStack };
          dvScopeByLabel.set(label, frames.stack.slice());
        }
      }
    },
  });

  return { mm, dvScopeByLabel };
}

/**
 * Second pass: runs the vendored engine's full scope/frame tracking,
 * which is what lets Metamath know exactly which floating and essential
 * hypotheses are mandatory for each axiom/theorem. This is the expensive
 * part (`Stack.assert()` — see vendor/metamath-js NOTICE.md) and is only
 * needed to display hypotheses and to verify proofs, so it runs after the
 * fast index is already browsable.
 *
 * Mutates `index` in place and returns the live engine instance (plus the
 * per-theorem scope snapshots described above) so the caller can answer
 * on-demand proof-verification requests without re-parsing.
 */
export function enrichIndexWithEngine(
  src: string,
  index: MetamathIndex,
): { mm: MM; dvScopeByLabel: Map<string, FrameStack> } {
  const { mm, dvScopeByLabel } = processWithScopeSnapshots(src);
  const labels = mm.labels as Record<string, unknown[]>;

  for (const label of index.labelOrder) {
    const stmt = index.statements[label];
    const entry = labels[label] as unknown[] | undefined;
    if (!stmt || !entry) continue;
    if (stmt.token !== "$a" && stmt.token !== "$p") continue;

    const assertion = entry[1] as Assertion;
    const [dvs, f, e] = assertion;

    stmt.mandatoryFloating = f.map(([typecode, varName, flabel]) => ({
      label: flabel,
      typecode,
      expression: [varName],
    }));
    stmt.hypotheses = e.map(([expression, typecode, elabel]) => ({
      label: elabel,
      typecode,
      expression,
    }));
    stmt.distinctVars = dvs;

    if (stmt.token === "$p" && stmt.proof) {
      const rawProof = entry[3] as
        | string[]
        | ([string, string[], string, string] & {
            decompress?: () => Array<string | number>;
          });
      const isCompressed = Array.isArray(rawProof) && rawProof[0] === "(";

      if (
        isCompressed &&
        typeof (rawProof as { decompress?: unknown }).decompress === "function"
      ) {
        stmt.proof.steps = (
          rawProof as { decompress: () => Array<string | number> }
        ).decompress();
      } else if (!isCompressed) {
        const ownLabels = new Set([
          ...stmt.mandatoryFloating.map((h) => h.label),
          ...stmt.hypotheses.map((h) => h.label),
        ]);
        stmt.proof.dependencies = Array.from(
          new Set(
            (stmt.proof.steps as string[]).filter((s) => !ownLabels.has(s)),
          ),
        );
      }
    }
  }

  return { mm, dvScopeByLabel };
}
