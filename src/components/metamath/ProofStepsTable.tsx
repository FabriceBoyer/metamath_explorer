import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MathFormula } from "@/components/metamath/MathFormula";
import { Button } from "@/components/ui/button";
import { useMetamathStore } from "@/store/metamath-store";

export interface ProofStepRow {
  ref: string | number;
  typecode: string;
  expression: string[];
  args: Array<number | string>;
}

const PAGE_SIZE = 60;

export function ProofStepsTable({ steps }: { steps: ProofStepRow[] }) {
  const { t } = useTranslation();
  const statements = useMetamathStore((s) => s.index?.statements);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const shown = steps.slice(0, visible);

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">{t("statement.ref")}</th>
              <th className="px-3 py-2 font-medium">
                {t("statement.expression")}
              </th>
              <th className="px-3 py-2 font-medium">
                {t("statement.hypotheses")}
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((step, i) => {
              const isReal = typeof step.ref === "string";
              const exists = isReal && statements?.[step.ref as string];
              return (
                <tr
                  key={i}
                  id={`proof-step-${i + 1}`}
                  className="border-t border-border odd:bg-muted/20"
                >
                  <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-xs">
                    {exists ? (
                      <Link
                        to={`/browse/${encodeURIComponent(step.ref as string)}`}
                        className="text-primary hover:underline"
                      >
                        {step.ref}
                      </Link>
                    ) : (
                      String(step.ref)
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <MathFormula
                      typecode={step.typecode}
                      tokens={step.expression}
                    />
                  </td>
                  <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                    {step.args
                      .map((a) => (typeof a === "number" ? `#${a + 1}` : a))
                      .join(", ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {visible < steps.length && (
        <div className="mt-3 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            {t("common.showMore")} ({steps.length - visible})
          </Button>
        </div>
      )}
    </div>
  );
}
