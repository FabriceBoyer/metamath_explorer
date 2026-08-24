import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MathFormula } from "@/components/metamath/MathFormula";
import { ColoredFormula } from "./ColoredFormula";
import type { StackItem } from "@/lib/metamath/proof-playback";
import type { SubstitutedToken, VarColor } from "@/lib/metamath/substitution";

interface ProofStackPanelProps {
  title: string;
  emptyLabel: string;
  stack: StackItem[];
  /** When set, the top (most recently pushed) item renders with its
   * substitution provenance colored in, instead of plain text — so the
   * value just produced carries the same colors shown in the
   * substitution view above it. */
  topAnnotation?: {
    tokens: SubstitutedToken[];
    colorMap: Map<string, VarColor>;
  };
}

export function ProofStackPanel({
  title,
  emptyLabel,
  stack,
  topAnnotation,
}: ProofStackPanelProps) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <div className="flex min-h-40 flex-col-reverse gap-1.5 rounded-md border border-border bg-card p-3">
        {stack.length === 0 && (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}
        {stack.map((item, i) => {
          const isTop = i === stack.length - 1;
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0, scale: isTop ? [1.04, 1] : 1 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm",
                isTop ? "border-primary/40 bg-primary/5" : "border-border",
              )}
            >
              {isTop && topAnnotation ? (
                <ColoredFormula
                  typecode={item.typecode}
                  tokens={topAnnotation.tokens}
                  colorMap={topAnnotation.colorMap}
                />
              ) : (
                <MathFormula
                  typecode={item.typecode}
                  tokens={item.expression}
                />
              )}
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                #{item.fromStep + 1}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
