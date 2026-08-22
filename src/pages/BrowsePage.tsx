import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronRight, FolderTree } from "lucide-react";
import { useMetamathStore } from "@/store/metamath-store";
import { LoadingPanel } from "@/components/metamath/LoadingPanel";
import { SectionTree } from "@/components/metamath/SectionTree";
import { StatementCard } from "@/components/metamath/StatementCard";
import { Input } from "@/components/ui/input";
import type { SectionNode } from "@/lib/metamath/types";

function findPath(
  nodes: SectionNode[],
  id: string,
  trail: SectionNode[] = [],
): SectionNode[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === id) return nextTrail;
    const found = findPath(node.children, id, nextTrail);
    if (found) return found;
  }
  return null;
}

export default function BrowsePage() {
  const { t } = useTranslation();
  const index = useMetamathStore((s) => s.index);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selectedPath = useMemo(
    () => (index && selectedId ? findPath(index.sections, selectedId) : null),
    [index, selectedId],
  );
  const selectedNode = selectedPath?.at(-1) ?? null;

  const searchResults = useMemo(() => {
    if (!index || query.trim().length < 2) return null;
    const q = query.trim().toLowerCase();
    const results = [];
    for (const label of index.labelOrder) {
      if (results.length >= 60) break;
      if (label.toLowerCase().includes(q)) {
        results.push(index.statements[label]);
      }
    }
    return results;
  }, [index, query]);

  if (!index) {
    return <LoadingPanel />;
  }

  const directStatements =
    selectedNode?.labels.map((l) => index.statements[l]).filter(Boolean) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t("browse.title")}</h1>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.searchPlaceholder")}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-border bg-card p-2 md:max-h-[75vh] md:overflow-y-auto">
          <p className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FolderTree className="size-3.5" />
            {t("browse.toc")}
          </p>
          <SectionTree
            sections={index.sections}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>

        <div>
          {searchResults ? (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                {t("browse.searchResults")} ({searchResults.length})
              </h2>
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("browse.noResults")}
                </p>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {searchResults.map((s) => (
                    <StatementCard key={s.label} statement={s} />
                  ))}
                </div>
              )}
            </div>
          ) : selectedNode ? (
            <div>
              <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {selectedPath?.map((n, i) => (
                  <span key={n.id} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="size-3" />}
                    <button
                      className="hover:text-foreground hover:underline"
                      onClick={() => setSelectedId(n.id)}
                    >
                      {n.title}
                    </button>
                  </span>
                ))}
              </nav>
              <h2 className="mb-1 text-xl font-semibold">
                {selectedNode.title}
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                {t("browse.statementsIn", { count: directStatements.length })}
              </p>

              {selectedNode.children.length > 0 && (
                <div className="mb-6 grid gap-2 sm:grid-cols-2">
                  {selectedNode.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedId(child.id)}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium hover:border-primary/40 hover:bg-muted/40"
                    >
                      {child.title}
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-2.5 sm:grid-cols-2">
                {directStatements.map((s) => (
                  <StatementCard key={s.label} statement={s} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              <FolderTree className="size-8" />
              <p>{t("browse.toc")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
