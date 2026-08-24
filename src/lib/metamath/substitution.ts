import type { StatementMeta, VerifiedProofStep } from "./types";

export interface SubstitutedToken {
  token: string;
  /** Set when this token originates from substituting a template
   * variable — used to color-match the variable, its concrete value, and
   * every place it appears in the resulting expression. */
  varName?: string;
}

export interface VarSubstitution {
  varName: string;
  expression: string[];
  fromStep: number;
}

export interface HypMatch {
  hypLabel: string;
  /** The hypothesis's own generic form, with its variables annotated so
   * it can be rendered with the same colors as the main template. */
  genericTokens: SubstitutedToken[];
  concreteExpression: string[];
  fromStep: number;
}

export interface StepSubstitution {
  statement: StatementMeta;
  varSubs: VarSubstitution[];
  hypMatches: HypMatch[];
  templateTokens: SubstitutedToken[];
  resultTokens: SubstitutedToken[];
}

function substituteTokens(
  template: string[],
  subs: Map<string, string[]>,
): SubstitutedToken[] {
  const out: SubstitutedToken[] = [];
  for (const tok of template) {
    const sub = subs.get(tok);
    if (sub) {
      for (const t of sub) out.push({ token: t, varName: tok });
    } else {
      out.push({ token: tok });
    }
  }
  return out;
}

/**
 * Reconstructs, for a single "apply an axiom/theorem" proof step, exactly
 * which concrete sub-expression got substituted for each of the
 * statement's mandatory variables, and which hypotheses were matched by
 * which earlier steps — purely from data already in the index (no engine
 * call needed): `args` are indices into `steps` recording which prior
 * step produced each argument, in the same [floating vars..., hyps...]
 * order the vendored engine's `Stack.assert()` uses.
 *
 * Returns null for steps that aren't a statement application (a bare
 * hypothesis/floating push, or an unknown label) — nothing to visualize.
 */
export function computeStepSubstitution(
  step: VerifiedProofStep,
  steps: VerifiedProofStep[],
  statements: Record<string, StatementMeta>,
): StepSubstitution | null {
  if (typeof step.ref !== "string" || step.args.length === 0) return null;
  const statement = statements[step.ref];
  if (!statement) return null;

  const argIndices = step.args.filter(
    (a): a is number => typeof a === "number",
  );
  const { mandatoryFloating, hypotheses } = statement;

  const varSubs: VarSubstitution[] = mandatoryFloating.map((h, i) => {
    const fromStep = argIndices[i];
    return {
      varName: h.expression[0],
      expression: steps[fromStep]?.expression ?? [],
      fromStep,
    };
  });

  const substitutionMap = new Map(
    varSubs.map((v) => [v.varName, v.expression]),
  );

  const hypMatches: HypMatch[] = hypotheses.map((h, i) => {
    const fromStep = argIndices[mandatoryFloating.length + i];
    return {
      hypLabel: h.label,
      genericTokens: substituteTokens(h.expression, substitutionMap),
      concreteExpression: steps[fromStep]?.expression ?? [],
      fromStep,
    };
  });

  return {
    statement,
    varSubs,
    hypMatches,
    templateTokens: statement.expression.map((token) => ({ token })),
    resultTokens: substituteTokens(statement.expression, substitutionMap),
  };
}

const VAR_COLOR_PALETTE = [
  "blue",
  "amber",
  "emerald",
  "fuchsia",
  "rose",
  "cyan",
] as const;

export type VarColor = (typeof VAR_COLOR_PALETTE)[number];

/** Assigns a stable color to each distinct variable name, in order of
 * first appearance, cycling the palette if there are more variables than
 * colors (rare — most axioms have 1-3). */
export function assignVarColors(varNames: string[]): Map<string, VarColor> {
  const map = new Map<string, VarColor>();
  let i = 0;
  for (const name of varNames) {
    if (!map.has(name)) {
      map.set(name, VAR_COLOR_PALETTE[i % VAR_COLOR_PALETTE.length]);
      i++;
    }
  }
  return map;
}
