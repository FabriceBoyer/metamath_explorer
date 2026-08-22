import type { AssertionKind, StatementToken } from "./types";

/**
 * Heuristic classification used purely for UI coloring/badges. It follows
 * set.mm's own labelling convention (`ax-` for axioms, `df-` for
 * definitions) documented at
 * https://us.metamath.org/mpeuni/conventions.html — Metamath itself has no
 * such notion; `$a` and `$c`/`$p` are the only real distinctions.
 */
export function classifyKind(
  token: StatementToken,
  typecode: string,
  label: string,
): AssertionKind {
  if (token === "$f") return "floating";
  if (token === "$e") return "hypothesis";
  if (token === "$p") return "theorem";
  // $a
  if (typecode !== "|-") return "syntax";
  if (label.startsWith("ax-")) return "axiom";
  if (label.startsWith("df-")) return "definition";
  return "axiom";
}
