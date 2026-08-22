import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MathFormulaProps {
  typecode?: string;
  tokens: string[];
  className?: string;
  /** When true, each token links to its browse page (used for syntax
   * constants that are themselves defined statements — off by default
   * since most tokens are plain symbols, not labels). */
  linkTokens?: boolean;
}

export function MathFormula({
  typecode,
  tokens,
  className,
  linkTokens = false,
}: MathFormulaProps) {
  return (
    <span className={cn("font-math text-[0.95em]", className)}>
      {typecode && (
        <span className="mr-1.5 select-none text-muted-foreground">
          {typecode}
        </span>
      )}
      {tokens.map((tok, i) =>
        linkTokens ? (
          <Link
            key={i}
            to={`/browse/${encodeURIComponent(tok)}`}
            className="mr-1.5 last:mr-0 rounded px-0.5 hover:bg-accent hover:text-accent-foreground"
          >
            {tok}
          </Link>
        ) : (
          <span key={i} className="mr-1.5 last:mr-0">
            {tok}
          </span>
        ),
      )}
    </span>
  );
}
