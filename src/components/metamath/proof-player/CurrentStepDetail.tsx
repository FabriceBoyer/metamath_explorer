import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { MathFormula } from "@/components/metamath/MathFormula";
import { ColoredFormula } from "./ColoredFormula";
import { VAR_COLOR_CLASSES } from "./varColors";
import {
  computeStepSubstitution,
  assignVarColors,
} from "@/lib/metamath/substitution";
import type { VerifiedProofStep } from "@/lib/metamath/types";
import type { StatementMeta } from "@/lib/metamath/types";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

interface CurrentStepDetailProps {
  step: VerifiedProofStep;
  stepNumber: number;
  steps: VerifiedProofStep[];
  statements: Record<string, StatementMeta>;
  onJumpToStep: (stepNumber: number) => void;
}

export function CurrentStepDetail({
  step,
  stepNumber,
  steps,
  statements,
  onJumpToStep,
}: CurrentStepDetailProps) {
  const { t } = useTranslation();
  const sub = computeStepSubstitution(step, steps, statements);

  if (!sub) {
    // A bare hypothesis / floating-variable push: nothing is substituted,
    // it just introduces a value onto the stack.
    return (
      <motion.div
        key={stepNumber}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-md border border-dashed border-border bg-muted/40 p-3"
      >
        <p className="text-sm">
          {typeof step.ref === "string" && statements[step.ref] ? (
            <Link
              to={`/browse/${encodeURIComponent(step.ref)}`}
              className="font-mono font-semibold text-primary hover:underline"
            >
              {step.ref}
            </Link>
          ) : (
            <span className="font-mono font-semibold text-primary">
              {step.ref}
            </span>
          )}{" "}
          <span className="text-muted-foreground">{t("player.pushes")}</span>{" "}
          <MathFormula typecode={step.typecode} tokens={step.expression} />
        </p>
      </motion.div>
    );
  }

  const { statement, varSubs, hypMatches, templateTokens, resultTokens } = sub;
  const colorMap = assignVarColors(varSubs.map((v) => v.varName));

  return (
    <motion.div
      key={stepNumber}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-md border border-border bg-muted/20 p-3 sm:p-4"
    >
      <p className="mb-3 text-sm text-muted-foreground">
        {t("player.applying")}{" "}
        <Link
          to={`/browse/${encodeURIComponent(statement.label)}`}
          className="font-mono font-semibold text-primary hover:underline"
        >
          {statement.label}
        </Link>
      </p>

      <div className="mb-3 rounded-md border border-dashed border-border bg-card p-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("player.template")}
        </p>
        <ColoredFormula
          typecode={statement.typecode}
          tokens={templateTokens}
          colorMap={colorMap}
        />
      </div>

      {varSubs.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mb-3 space-y-1.5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("player.substitutions")}
          </p>
          {varSubs.map((v) => (
            <motion.div
              key={v.varName}
              variants={item}
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${VAR_COLOR_CLASSES[colorMap.get(v.varName)!].chip}`}
              >
                {v.varName}
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <MathFormula tokens={v.expression} />
              <button
                type="button"
                onClick={() => onJumpToStep(v.fromStep + 1)}
                className="ml-auto shrink-0 font-mono text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                {t("player.fromStep", { n: v.fromStep + 1 })}
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {hypMatches.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mb-3 space-y-1.5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("player.hypotheses")}
          </p>
          {hypMatches.map((h) => (
            <motion.div
              key={h.hypLabel}
              variants={item}
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              <CheckCircle2 className="size-3.5 shrink-0 text-success" />
              <ColoredFormula tokens={h.genericTokens} colorMap={colorMap} />
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
              <MathFormula tokens={h.concreteExpression} />
              <button
                type="button"
                onClick={() => onJumpToStep(h.fromStep + 1)}
                className="ml-auto shrink-0 font-mono text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                {t("player.fromStep", { n: h.fromStep + 1 })}
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: (varSubs.length + hypMatches.length) * 0.14 + 0.15,
          duration: 0.3,
        }}
        className="rounded-md border border-primary/30 bg-primary/5 p-3"
      >
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("player.result")}
        </p>
        <ColoredFormula
          typecode={statement.typecode}
          tokens={resultTokens}
          colorMap={colorMap}
          className="text-base"
        />
      </motion.div>
    </motion.div>
  );
}
