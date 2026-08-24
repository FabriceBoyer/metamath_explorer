import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useMetamathStore } from "@/store/metamath-store";
import { replayStacks } from "@/lib/metamath/proof-playback";
import {
  computeStepSubstitution,
  assignVarColors,
} from "@/lib/metamath/substitution";
import type { StatementMeta, VerifiedProofStep } from "@/lib/metamath/types";
import { PlaybackControls } from "./PlaybackControls";
import { CurrentStepDetail } from "./CurrentStepDetail";
import { ProofStackPanel } from "./ProofStackPanel";

const AUTOPLAY_DELAY_MS = 1600;
const EMPTY_STATEMENTS: Record<string, StatementMeta> = {};

export function ProofPlayer({ steps }: { steps: VerifiedProofStep[] }) {
  const { t } = useTranslation();
  const statements =
    useMetamathStore((s) => s.index?.statements) ?? EMPTY_STATEMENTS;
  const stacks = useMemo(() => replayStacks(steps), [steps]);

  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const total = steps.length;
  const atEnd = stepIndex >= total;

  const next = useCallback(() => {
    setStepIndex((i) => Math.min(total, i + 1));
  }, [total]);
  const prev = () => setStepIndex((i) => Math.max(0, i - 1));
  const reset = () => {
    setStepIndex(0);
    setPlaying(false);
  };
  const jumpToStep = (n: number) => {
    setPlaying(false);
    setStepIndex(Math.min(total, Math.max(0, n)));
  };

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(next, AUTOPLAY_DELAY_MS);
    return () => clearTimeout(id);
  }, [playing, atEnd, next]);

  const stack = stacks[stepIndex];
  const currentStep = stepIndex > 0 ? steps[stepIndex - 1] : null;

  // Color the just-pushed stack entry with the same variable hues shown in
  // the substitution detail above it, so the connection between "what got
  // substituted" and "what's now sitting on the stack" is visible even
  // after the step completes.
  const topAnnotation = useMemo(() => {
    if (!currentStep) return undefined;
    const sub = computeStepSubstitution(currentStep, steps, statements);
    if (!sub) return undefined;
    return {
      tokens: sub.resultTokens,
      colorMap: assignVarColors(sub.varSubs.map((v) => v.varName)),
    };
  }, [currentStep, steps, statements]);

  return (
    <div>
      <PlaybackControls
        stepIndex={stepIndex}
        playing={playing}
        atEnd={atEnd}
        onReset={reset}
        onPrev={prev}
        onNext={next}
        onTogglePlay={() => setPlaying((p) => !p)}
        labels={{
          reset: t("howItWorks.stepperReset"),
          prev: t("howItWorks.stepperPrev"),
          next: t("howItWorks.stepperNext"),
          play: t("howItWorks.stepperPlay"),
          pause: t("howItWorks.stepperPause"),
          stepOf: t("howItWorks.stepperStepOf", {
            current: stepIndex,
            total,
          }),
        }}
      />

      <div className="mb-4">
        {currentStep ? (
          <CurrentStepDetail
            step={currentStep}
            stepNumber={stepIndex}
            steps={steps}
            statements={statements}
            onJumpToStep={jumpToStep}
          />
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            {t("howItWorks.stepperEmpty")}
          </div>
        )}
      </div>

      <ProofStackPanel
        title={t("howItWorks.stepperStack")}
        emptyLabel={t("howItWorks.stepperEmpty")}
        stack={stack}
        topAnnotation={topAnnotation}
      />

      {atEnd && stepIndex > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 rounded-md bg-success/10 px-3 py-2 text-sm text-success"
        >
          {t("player.done")}
        </motion.p>
      )}
    </div>
  );
}
