import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionNode } from "@/lib/metamath/types";

function countLabels(node: SectionNode): number {
  return (
    node.labels.length +
    node.children.reduce((sum, c) => sum + countLabels(c), 0)
  );
}

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: SectionNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <div
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
          isSelected && "bg-primary/10 text-primary font-medium",
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            className="flex size-4 shrink-0 items-center justify-center text-muted-foreground"
            aria-label={open ? "collapse" : "expand"}
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform",
                open && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span className="size-4 shrink-0" />
        )}
        <span className="truncate">{node.title}</span>
        <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground">
          {countLabels(node)}
        </span>
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SectionTree({
  sections,
  selectedId,
  onSelect,
}: {
  sections: SectionNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-0.5">
      {sections.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
