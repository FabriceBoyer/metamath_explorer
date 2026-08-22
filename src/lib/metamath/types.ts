/** A Metamath statement keyword. */
export type StatementToken = "$f" | "$e" | "$a" | "$p";

/**
 * Coarse semantic classification used for coloring/badges across the UI.
 * Derived heuristically from the statement's keyword, typecode and label
 * prefix (the `ax-` / `df-` conventions used throughout set.mm).
 */
export type AssertionKind =
  "syntax" | "axiom" | "definition" | "theorem" | "hypothesis" | "floating";

export interface HypothesisRef {
  label: string;
  typecode: string;
  expression: string[];
}

export interface ProofInfo {
  /** Whether the source proof used the compressed `( … ) AAB…` format. */
  compressed: boolean;
  /** Fully resolved step sequence: statement labels, and back-reference
   * markers as negative sentinel `-1` / non-negative marker indices, exactly
   * as produced by the vendored Decompressor (see vendor/metamath-js). */
  steps: Array<string | number>;
  /** Distinct external labels referenced anywhere in the proof — the edges
   * used to build the dependency graph. */
  dependencies: string[];
}

export interface StatementMeta {
  label: string;
  token: StatementToken;
  kind: AssertionKind;
  typecode: string;
  expression: string[];
  /** For $a/$p: mandatory floating hypotheses (variables) in scope, in order. */
  mandatoryFloating: HypothesisRef[];
  /** For $a/$p: mandatory essential hypotheses in scope, in order. */
  hypotheses: HypothesisRef[];
  /** For $a/$p: mandatory disjoint-variable pairs. */
  distinctVars: Array<[string, string]>;
  proof?: ProofInfo;
  /** Documentation comment immediately preceding the statement, if any. */
  comment?: string;
  /** 1-based line number in the source file. */
  line: number;
  /** Breadcrumb of enclosing section titles, root first. */
  sectionPath: string[];
}

export interface SectionNode {
  id: string;
  title: string;
  level: number;
  line: number;
  children: SectionNode[];
  /** Labels of statements that appear directly under this node, before any
   * child section starts. */
  labels: string[];
}

export interface MetamathIndexMeta {
  sourceUrl: string;
  fetchedAt: string;
  byteLength: number;
  sha256: string;
  statementCount: number;
  theoremCount: number;
  axiomCount: number;
}

export interface MetamathIndex {
  meta: MetamathIndexMeta;
  constants: string[];
  variables: string[];
  /** All $f/$e/$a/$p labels, in file order. */
  labelOrder: string[];
  statements: Record<string, StatementMeta>;
  sections: SectionNode[];
}

/** Reverse dependency map: label -> labels whose proof references it. */
export type UsageIndex = Record<string, string[]>;
