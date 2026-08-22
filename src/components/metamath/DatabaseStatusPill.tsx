import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useMetamathStore } from "@/store/metamath-store";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function DatabaseStatusPill() {
  const { t } = useTranslation();
  const { phase, enriched, receivedBytes, totalBytes } = useMetamathStore();

  if (phase === "ready" && enriched) {
    return (
      <Link
        to="/settings"
        className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success sm:inline-flex"
        title={t("loading.ready")}
      >
        <CheckCircle2 className="size-3.5" />
        {t("loading.ready")}
      </Link>
    );
  }

  if (phase === "error") {
    return (
      <Link
        to="/settings"
        className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
      >
        <AlertCircle className="size-3.5" />
        {t("common.error")}
      </Link>
    );
  }

  const label =
    phase === "fetching"
      ? totalBytes
        ? `${formatBytes(receivedBytes)} / ${formatBytes(totalBytes)}`
        : t("loading.fetching")
      : phase === "parsing"
        ? t("loading.parsing")
        : phase === "indexing"
          ? t("loading.indexing")
          : phase === "linking"
            ? t("loading.linking")
            : t("common.loading");

  return (
    <Link
      to="/settings"
      className={cn(
        "hidden items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex",
      )}
      title={label}
    >
      <Loader2 className="size-3.5 animate-spin" />
      <span className="max-w-40 truncate">{label}</span>
    </Link>
  );
}
