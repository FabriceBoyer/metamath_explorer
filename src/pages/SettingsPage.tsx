import { useTranslation } from "react-i18next";
import { RefreshCw, Trash2 } from "lucide-react";
import { useMetamathStore } from "@/store/metamath-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SET_MM_SOURCE_URL } from "@/lib/metamath/config";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2.5 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 font-mono sm:text-right">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { index, enriched, fromCache, phase, load, clearCache } =
    useMetamathStore();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("settings.subtitle")}
      </p>

      <Card className="mt-6">
        <CardContent className="pt-5">
          <Row
            label={t("settings.sourceUrl")}
            value={<span className="break-all">{SET_MM_SOURCE_URL}</span>}
          />
          <Row
            label={t("settings.cacheStatus")}
            value={
              index
                ? enriched
                  ? t("settings.cacheStatusReady", {
                      date: new Date(index.meta.fetchedAt).toLocaleString(),
                    })
                  : phase
                : t("settings.cacheStatusMissing")
            }
          />
          {index && (
            <>
              <Row
                label={t("settings.rawSize")}
                value={`${(index.meta.byteLength / (1024 * 1024)).toFixed(1)} MB`}
              />
              <Row
                label={t("settings.statementCount")}
                value={index.meta.statementCount.toLocaleString()}
              />
              <Row
                label={t("settings.theoremCount")}
                value={index.meta.theoremCount.toLocaleString()}
              />
              <Row
                label={t("settings.axiomCount")}
                value={index.meta.axiomCount.toLocaleString()}
              />
              <Row
                label="SHA-256"
                value={
                  <span className="text-xs">
                    {index.meta.sha256.slice(0, 16)}…
                  </span>
                }
              />
              <Row label="Cache" value={fromCache ? "hit" : "miss"} />
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => load(true)}>
          <RefreshCw /> {t("settings.refresh")}
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            if (window.confirm(t("settings.clearConfirm"))) clearCache();
          }}
        >
          <Trash2 /> {t("settings.clear")}
        </Button>
      </div>

      <Card className="mt-8">
        <CardContent className="pt-5">
          <h2 className="font-semibold">{t("settings.about")}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("settings.aboutBody")}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="pt-5">
          <h2 className="font-semibold">{t("settings.license")}</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <a
                className="text-primary hover:underline"
                href="https://github.com/metamath/set.mm/blob/develop/LICENSE.txt"
                target="_blank"
                rel="noreferrer"
              >
                set.mm
              </a>{" "}
              — public domain (CC0)
            </li>
            <li>
              <a
                className="text-primary hover:underline"
                href="https://github.com/google/metamath.js/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
              >
                google/metamath.js
              </a>{" "}
              — Apache License 2.0 (vendored parser/verifier)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
