import { process as engineProcess } from "@/vendor/metamath-js/descent";
import type { VerifiedProofStep } from "./types";

/**
 * A miniature, self-contained Metamath database: just enough of
 * propositional calculus (wi, ax-1, ax-2, ax-mp) to prove `ph -> ph`.
 *
 * The proof itself is not invented for this demo — it is the exact
 * compressed proof of `idALT` in the real set.mm (the classical textbook
 * derivation found in Margaris, Hamilton, Mendelson, etc.), decompressed
 * here by the same vendored engine used for the full database. Running it
 * live (rather than hardcoding the resulting steps) means the visitor is
 * watching the real verifier work, just on four statements instead of
 * 120,000.
 */
export const TOY_SOURCE = `
$c wff |- -> ( ) $.
$v ph ps ch $.
wph $f wff ph $.
wps $f wff ps $.
wch $f wff ch $.
wi $a wff ( ph -> ps ) $.
ax-1 $a |- ( ph -> ( ps -> ph ) ) $.
ax-2 $a |- ( ( ph -> ( ps -> ch ) ) -> ( ( ph -> ps ) -> ( ph -> ch ) ) ) $.
\${
  min $e |- ph $.
  maj $e |- ( ph -> ps ) $.
  ax-mp $a |- ps $.
\$}
idALT $p |- ( ph -> ph ) $=
  ( wi ax-1 ax-2 ax-mp ) AAABZBZFAACAFABBGFBAFCAFADEE $.
`;

export interface ToyProof {
  label: string;
  theorem: string[];
  steps: VerifiedProofStep[];
}

/** Runs the vendored engine on {@link TOY_SOURCE} and returns the fully
 * verified step-by-step stack trace for `idALT`. */
export function computeToyProof(): ToyProof {
  const mm = engineProcess(TOY_SOURCE);
  const labels = mm.labels as Record<string, unknown[]>;
  const entry = labels["idALT"];
  const resultFn = entry[2] as (
    generate?: boolean,
    markers?: boolean,
  ) => Array<[string | number, [string, string[]], Array<number | string>]>;
  const theorem = entry[4] as string[];
  // markers=false fully expands the compressed proof so every step is a
  // plain, self-contained stack operation — no back-reference bookkeeping
  // to explain in a first introduction to the format.
  const rawSteps = resultFn(false, false);

  return {
    label: "idALT",
    theorem,
    steps: rawSteps.map(([ref, [typecode, expression], args]) => ({
      ref,
      typecode,
      expression,
      args,
    })),
  };
}
