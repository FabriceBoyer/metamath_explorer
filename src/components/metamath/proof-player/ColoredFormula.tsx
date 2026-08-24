import { cn } from "@/lib/utils";
import type { SubstitutedToken } from "@/lib/metamath/substitution";
import type { VarColor } from "@/lib/metamath/substitution";
import { VAR_COLOR_CLASSES } from "./varColors";

interface ColoredFormulaProps {
  typecode?: string;
  tokens: SubstitutedToken[];
  colorMap: Map<string, VarColor>;
  className?: string;
}

/** Like MathFormula, but tokens that came from substituting a template
 * variable are tinted with that variable's color, so the same hue traces
 * a value from "chip" through the result wherever it appears. */
export function ColoredFormula({
  typecode,
  tokens,
  colorMap,
  className,
}: ColoredFormulaProps) {
  return (
    <span className={cn("font-math text-[0.95em]", className)}>
      {typecode && (
        <span className="mr-1.5 select-none text-muted-foreground">
          {typecode}
        </span>
      )}
      {tokens.map((t, i) => {
        const color = t.varName ? colorMap.get(t.varName) : undefined;
        return (
          <span
            key={i}
            className={cn(
              "mr-1.5 last:mr-0 rounded px-0.5",
              color && VAR_COLOR_CLASSES[color].chip,
            )}
          >
            {t.token}
          </span>
        );
      })}
    </span>
  );
}
