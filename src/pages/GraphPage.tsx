import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ReactFlowProvider } from "@xyflow/react";
import { Network, Search } from "lucide-react";
import { useMetamathStore } from "@/store/metamath-store";
import { LoadingPanel } from "@/components/metamath/LoadingPanel";
import { GraphView } from "@/components/metamath/graph/GraphView";
import { Input } from "@/components/ui/input";

function Legend() {
  const { t } = useTranslation();
  const items: Array<[string, string]> = [
    ["bg-axiom", t("graph.legendAxiom")],
    ["bg-theorem", t("graph.legendTheorem")],
    ["bg-hypothesis", t("graph.legendHypothesis")],
  ];
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {items.map(([dot, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${dot}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

export default function GraphPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { label } = useParams();
  const index = useMetamathStore((s) => s.index);
  const [query, setQuery] = useState("");

  if (!index) return <LoadingPanel />;

  const focusLabel = label && index.statements[label] ? label : null;

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-6xl flex-col px-4 py-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("graph.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("graph.subtitle")}</p>
        </div>
        <form
          className="relative w-full sm:w-72"
          onSubmit={(e) => {
            e.preventDefault();
            if (index.statements[query])
              navigate(`/graph/${encodeURIComponent(query)}`);
          }}
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("graph.focusPlaceholder")}
            className="pl-8"
          />
        </form>
      </div>

      <Legend />

      <div className="mt-3 flex-1 overflow-hidden rounded-lg border border-border">
        {focusLabel ? (
          <ReactFlowProvider>
            <GraphView focusLabel={focusLabel} key={focusLabel} />
          </ReactFlowProvider>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center text-muted-foreground">
            <Network className="size-10" />
            <p className="max-w-sm text-sm">{t("graph.emptyState")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
