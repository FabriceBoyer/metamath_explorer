import { Fragment } from "react";
import { Link } from "react-router-dom";
import { useMetamathStore } from "@/store/metamath-store";

const INLINE_RE = /~\s+([!-#%-~?]+)|`([^`]*)`|\[([A-Za-z][A-Za-z0-9]*)\]/g;

function toParagraphs(raw: string): string[] {
  return raw
    .split(/\n[ \t]*\n/)
    .map((p) => p.replace(/\n[ \t]*/g, " ").trim())
    .filter(Boolean);
}

function renderInline(
  text: string,
  statements: Record<string, unknown> | undefined,
) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  INLINE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = INLINE_RE.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
    }

    const [, refLabel, mathExpr, biblioRef] = match;
    if (refLabel !== undefined) {
      const exists = statements ? Boolean(statements[refLabel]) : true;
      nodes.push(
        exists ? (
          <Link
            key={key++}
            to={`/browse/${encodeURIComponent(refLabel)}`}
            className="rounded px-0.5 font-mono text-[0.92em] text-primary hover:underline"
          >
            {refLabel}
          </Link>
        ) : (
          <span key={key++} className="font-mono text-[0.92em]">
            {refLabel}
          </span>
        ),
      );
    } else if (mathExpr !== undefined) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-muted px-1 py-0.5 font-math text-[0.92em]"
        >
          {mathExpr.trim()}
        </code>,
      );
    } else if (biblioRef !== undefined) {
      nodes.push(
        <cite key={key++} className="text-muted-foreground not-italic">
          [{biblioRef}]
        </cite>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return nodes;
}

export function CommentText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const statements = useMetamathStore((s) => s.index?.statements);
  const paragraphs = toParagraphs(text);

  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className="mb-2 leading-relaxed last:mb-0">
          {renderInline(p, statements)}
        </p>
      ))}
    </div>
  );
}
