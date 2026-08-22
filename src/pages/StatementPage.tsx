import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  Network,
  Loader2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useMetamathStore } from "@/store/metamath-store";
import { LoadingPanel } from "@/components/metamath/LoadingPanel";
import { KindBadge } from "@/components/metamath/KindBadge";
import { MathFormula } from "@/components/metamath/MathFormula";
import { CommentText } from "@/components/metamath/CommentText";
import { ProofStepsTable } from "@/components/metamath/ProofStepsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUsageIndex } from "@/lib/metamath/usage-index";

export default function StatementPage() {
  const { t } = useTranslation();
  const { label = "" } = useParams();
  const index = useMetamathStore((s) => s.index);
  const enriched = useMetamathStore((s) => s.enriched);
  const verify = useMetamathStore((s) => s.verify);
  const verifyResults = useMetamathStore((s) => s.verifyResults);
  const pendingVerifications = useMetamathStore((s) => s.pendingVerifications);

  const statement = index?.statements[label];
  const usage = useMemo(() => (index ? getUsageIndex(index) : {}), [index]);
  const usedBy = usage[label] ?? [];
  const verifyResult = verifyResults[label];
  const isVerifying = pendingVerifications.has(label);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [label]);

  if (!index) return <LoadingPanel />;

  if (!statement) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">
          {t("statement.notFound", { label })}
        </p>
        <Button asChild className="mt-4">
          <Link to="/browse">{t("common.back")}</Link>
        </Button>
      </div>
    );
  }

  const isProvable = statement.token === "$p";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {statement.sectionPath.length > 0 && (
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {statement.sectionPath.map((title, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" />}
              {title}
            </span>
          ))}
        </nav>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-bold">{statement.label}</h1>
        <KindBadge kind={statement.kind} />
        <Button asChild variant="outline" size="sm" className="ml-auto">
          <Link to={`/graph/${encodeURIComponent(statement.label)}`}>
            <Network /> {t("statement.viewGraph")}
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("statement.assertion")}
          </h2>
          <MathFormula
            typecode={statement.typecode}
            tokens={statement.expression}
            className="text-base"
          />
        </CardContent>
      </Card>

      {statement.comment && (
        <Card className="mb-6">
          <CardContent className="pt-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("statement.description")}
            </h2>
            <CommentText text={statement.comment} className="text-sm" />
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("statement.hypotheses")}
            </h2>
            {!enriched ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />{" "}
                {t("common.loading")}
              </p>
            ) : statement.mandatoryFloating.length === 0 &&
              statement.hypotheses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("statement.noHypotheses")}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {[...statement.mandatoryFloating, ...statement.hypotheses].map(
                  (h) => (
                    <li
                      key={h.label}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Link
                        to={`/browse/${encodeURIComponent(h.label)}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {h.label}
                      </Link>
                      <MathFormula
                        typecode={h.typecode}
                        tokens={h.expression}
                      />
                    </li>
                  ),
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("statement.distinctVars")}
            </h2>
            {!enriched ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />{" "}
                {t("common.loading")}
              </p>
            ) : statement.distinctVars.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("statement.noDistinctVars")}
              </p>
            ) : (
              <p className="font-mono text-sm">
                {statement.distinctVars.map(([a, b], i) => (
                  <span key={i} className="mr-3">
                    {a} , {b}
                  </span>
                ))}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {usedBy.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("statement.usedByCount", { count: usedBy.length })}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {usedBy.slice(0, 40).map((u) => (
                <Link
                  key={u}
                  to={`/browse/${encodeURIComponent(u)}`}
                  className="rounded-full border border-border px-2 py-0.5 font-mono text-xs hover:border-primary/40 hover:text-primary"
                >
                  {u}
                </Link>
              ))}
              {usedBy.length > 40 && (
                <span className="px-2 py-0.5 text-xs text-muted-foreground">
                  {t("statement.usedByMore", { count: usedBy.length - 40 })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isProvable && (
        <Card>
          <CardContent className="pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("statement.proof")}
                {statement.proof &&
                  ` · ${t("statement.proofSteps", { count: statement.proof.steps.length || statement.proof.dependencies.length })}`}
              </h2>
              <Button
                size="sm"
                disabled={!enriched || isVerifying}
                onClick={() => verify(label)}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />{" "}
                    {t("statement.verifying")}
                  </>
                ) : (
                  t("statement.verify")
                )}
              </Button>
            </div>

            {statement.proof?.compressed && (
              <p className="mb-3 text-xs text-muted-foreground">
                {t("statement.compressedNote")}
              </p>
            )}

            {verifyResult && (
              <p
                className={
                  "mb-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm " +
                  (verifyResult.ok
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive")
                }
              >
                {verifyResult.ok ? (
                  <ShieldCheck className="size-4" />
                ) : (
                  <ShieldAlert className="size-4" />
                )}
                {verifyResult.ok
                  ? t("statement.verified")
                  : t("statement.verifyError", { message: verifyResult.error })}
              </p>
            )}

            {verifyResult?.ok && verifyResult.steps && (
              <ProofStepsTable steps={verifyResult.steps} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
