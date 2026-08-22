import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssertionKind } from "@/lib/metamath/types";

export interface StatementNodeData {
  label: string;
  kind: AssertionKind;
  expression: string[];
  focused: boolean;
  depsExpanded: boolean;
  usersExpanded: boolean;
  hasDeps: boolean;
  hasUsers: boolean;
  onExpandDeps: (label: string) => void;
  onExpandUsers: (label: string) => void;
  onOpen: (label: string) => void;
  [key: string]: unknown;
}

const KIND_DOT: Record<AssertionKind, string> = {
  axiom: "bg-axiom",
  definition: "bg-axiom",
  theorem: "bg-theorem",
  hypothesis: "bg-hypothesis",
  floating: "bg-hypothesis",
  syntax: "bg-syntax",
};

function StatementNodeImpl({ data }: { data: StatementNodeData }) {
  return (
    <div
      className={cn(
        "group relative w-52 rounded-lg border bg-card px-3 py-2 shadow-sm transition-shadow hover:shadow-md",
        data.focused
          ? "border-primary ring-2 ring-primary/30"
          : "border-border",
      )}
    >
      <Handle type="target" position={Position.Bottom} className="!opacity-0" />
      <Handle type="source" position={Position.Top} className="!opacity-0" />

      {data.hasDeps && (
        <button
          type="button"
          title="Show dependencies"
          onClick={(e) => {
            e.stopPropagation();
            data.onExpandDeps(data.label);
          }}
          className={cn(
            "absolute -top-2.5 left-1/2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-primary",
            data.depsExpanded && "text-primary",
          )}
        >
          <ArrowUp className="size-3" />
        </button>
      )}

      <button
        onClick={() => data.onOpen(data.label)}
        className="flex w-full items-center gap-1.5 text-left"
      >
        <span
          className={cn("size-2 shrink-0 rounded-full", KIND_DOT[data.kind])}
        />
        <span className="truncate font-mono text-sm font-semibold">
          {data.label}
        </span>
      </button>
      <p className="mt-1 truncate font-math text-xs text-muted-foreground">
        {data.expression.join(" ")}
      </p>

      {data.hasUsers && (
        <button
          type="button"
          title="Show dependents"
          onClick={(e) => {
            e.stopPropagation();
            data.onExpandUsers(data.label);
          }}
          className={cn(
            "absolute -bottom-2.5 left-1/2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-primary",
            data.usersExpanded && "text-primary",
          )}
        >
          <ArrowDown className="size-3" />
        </button>
      )}
    </div>
  );
}

export const StatementNode = memo(StatementNodeImpl);
