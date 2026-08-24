import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MathFormula } from "@/components/metamath/MathFormula";
import { PlaybackControls } from "@/components/metamath/proof-player/PlaybackControls";
import { ProofStackPanel } from "@/components/metamath/proof-player/ProofStackPanel";
import { computeToyProof } from "@/lib/metamath/toy-example";
import { replayStacks } from "@/lib/metamath/proof-playback";

export function ToyProofStepper() {
  const { t } = useTranslation();
  const proof = useMemo(() => computeToyProof(), []);
  const stacks = useMemo(() => replayStacks(proof.steps), [proof]);

  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const total = proof.steps.length;
  const atEnd = stepIndex >= total;

  const next = useCallback(() => {
    setStepIndex((i) => Math.min(total, i + 1));
  }, [total]);
  const prev = () => setStepIndex((i) => Math.max(0, i - 1));
  const reset = () => {
    setStepIndex(0);
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(next, 700);
    return () => clearTimeout(id);
  }, [playing, atEnd, next]);

  const stack = stacks[stepIndex];
  const currentStep = stepIndex > 0 ? proof.steps[stepIndex - 1] : null;

  return (
    <Card>
      <CardContent className="pt-5">
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

        <div className="mb-4 min-h-14 rounded-md border border-dashed border-border bg-muted/40 p-3">
          {currentStep ? (
            <p className="text-sm">
              <span className="font-mono font-semibold text-primary">
                {currentStep.ref}
              </span>{" "}
              <span className="text-muted-foreground">
                {currentStep.args.length > 0
                  ? t("howItWorks.stepperPops", {
                      count: currentStep.args.length,
                    })
                  : t("howItWorks.stepperPushes")}
              </span>{" "}
              <MathFormula
                typecode={currentStep.typecode}
                tokens={currentStep.expression}
              />
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("howItWorks.stepperEmpty")}
            </p>
          )}
        </div>

        <ProofStackPanel
          title={t("howItWorks.stepperStack")}
          emptyLabel={t("howItWorks.stepperEmpty")}
          stack={stack}
        />

        {atEnd && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-md bg-success/10 px-3 py-2 text-sm text-success"
          >
            {t("howItWorks.stepperDone")}
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
}
