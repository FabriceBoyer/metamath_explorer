import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { AssertionKind } from "@/lib/metamath/types";

const VARIANT: Record<
  AssertionKind,
  "axiom" | "theorem" | "hypothesis" | "syntax"
> = {
  axiom: "axiom",
  definition: "axiom",
  theorem: "theorem",
  hypothesis: "hypothesis",
  floating: "hypothesis",
  syntax: "syntax",
};

const LABEL_KEY: Record<AssertionKind, string> = {
  axiom: "browse.kindAxiom",
  definition: "browse.kindDefinition",
  theorem: "browse.kindTheorem",
  hypothesis: "browse.kindHypothesis",
  floating: "browse.kindFloating",
  syntax: "browse.kindDefinition",
};

export function KindBadge({ kind }: { kind: AssertionKind }) {
  const { t } = useTranslation();
  return <Badge variant={VARIANT[kind]}>{t(LABEL_KEY[kind])}</Badge>;
}
