import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MathFormula } from "@/components/metamath/MathFormula";
import { computeToyProof } from "@/lib/metamath/toy-example";
import type { ToyStep } from "@/lib/metamath/toy-example";
import { cn } from "@/lib/utils";

interface StackItem {
  id: number;
  typecode: string;
  expression: string[];
  fromStep: number;
}

function replayStacks(steps: ToyStep[]): StackItem[][] {
  const stacks: StackItem[][] = [[]];
  let current: StackItem[] = [];
  let uid = 0;

  steps.forEach((step, i) => {
    const popCount = step.args.length;
    current = current.slice(0, current.length - popCount);
    current = [
      ...current,
      {
        id: uid++,
        typecode: step.typecode,
        expression: step.expression,
        fromStep: i,
      },
    ];
    stacks.push(current);
  });

  return stacks;
}

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={reset}
              aria-label={t("howItWorks.stepperReset")}
            >
              <RotateCcw />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              disabled={stepIndex === 0}
              aria-label={t("howItWorks.stepperPrev")}
            >
              <SkipBack />
            </Button>
            <Button
              size="icon"
              onClick={() => (atEnd ? reset() : setPlaying((p) => !p))}
              aria-label={
                playing
                  ? t("howItWorks.stepperPause")
                  : t("howItWorks.stepperPlay")
              }
            >
              {playing ? <Pause /> : <Play />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              disabled={atEnd}
              aria-label={t("howItWorks.stepperNext")}
            >
              <SkipForward />
            </Button>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {t("howItWorks.stepperStepOf", { current: stepIndex, total })}
          </span>
        </div>

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

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("howItWorks.stepperStack")}
          </h4>
          <div className="flex min-h-40 flex-col-reverse gap-1.5 rounded-md border border-border bg-card p-3">
            {stack.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("howItWorks.stepperEmpty")}
              </p>
            )}
            <AnimatePresence initial={false}>
              {stack.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm",
                    i === stack.length - 1
                      ? "border-primary/40 bg-primary/5"
                      : "border-border",
                  )}
                >
                  <MathFormula
                    typecode={item.typecode}
                    tokens={item.expression}
                  />
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    #{item.fromStep + 1}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

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
