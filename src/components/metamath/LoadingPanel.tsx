import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useMetamathStore } from "@/store/metamath-store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const TIPS_KEYS = [
  "step1Title",
  "step3Title",
  "step5Title",
  "verifierTitle",
] as const;

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function LoadingPanel() {
  const { t } = useTranslation();
  const { phase, error, receivedBytes, totalBytes, load, clearCache } =
    useMetamathStore();
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setTipIndex((i) => (i + 1) % TIPS_KEYS.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase === "idle") load();
  }, [phase, load]);

  if (phase === "error") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <AlertTriangle className="size-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{t("loading.error")}</p>
        <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs">
          {error}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => load()}>{t("loading.retry")}</Button>
          <Button variant="outline" onClick={() => clearCache()}>
            {t("loading.reset")}
          </Button>
        </div>
      </div>
    );
  }

  const progressPct =
    phase === "fetching" && totalBytes
      ? Math.min(99, (receivedBytes / totalBytes) * 100)
      : phase === "parsing"
        ? 100
        : phase === "indexing"
          ? 100
          : phase === "linking"
            ? 100
            : 0;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-24 text-center">
      <Loader2 className="size-10 animate-spin text-primary" />
      <div>
        <h2 className="text-lg font-semibold">{t("loading.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {phase === "fetching"
            ? totalBytes
              ? t("loading.fetchProgress", {
                  received: formatBytes(receivedBytes),
                  total: formatBytes(totalBytes),
                })
              : t("loading.fetching")
            : phase === "parsing"
              ? t("loading.parsing")
              : phase === "indexing"
                ? t("loading.indexing")
                : t("loading.linking")}
        </p>
      </div>
      <Progress value={progressPct} className="w-full" />
      <p className="text-xs text-muted-foreground">
        {t("loading.firstVisitNote")}
      </p>
      <p className="min-h-8 text-xs text-primary transition-opacity">
        {t(`howItWorks.${TIPS_KEYS[tipIndex]}`)}
      </p>
    </div>
  );
}
