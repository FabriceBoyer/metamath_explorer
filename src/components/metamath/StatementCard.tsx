import { Link } from "react-router-dom";
import { KindBadge } from "@/components/metamath/KindBadge";
import { MathFormula } from "@/components/metamath/MathFormula";
import type { StatementMeta } from "@/lib/metamath/types";

export function StatementCard({ statement }: { statement: StatementMeta }) {
  const excerpt = statement.comment
    ?.split(/\n[ \t]*\n/)[0]
    ?.replace(/\s+/g, " ");

  return (
    <Link
      to={`/browse/${encodeURIComponent(statement.label)}`}
      className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-primary">
          {statement.label}
        </span>
        <KindBadge kind={statement.kind} />
      </div>
      <MathFormula
        typecode={statement.typecode}
        tokens={statement.expression}
        className="block truncate text-sm"
      />
      {excerpt && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {excerpt}
        </p>
      )}
    </Link>
  );
}
