import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import type { Node, Edge, NodeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMetamathStore } from "@/store/metamath-store";
import { getUsageIndex } from "@/lib/metamath/usage-index";
import { StatementNode } from "./StatementNode";
import type { StatementNodeData } from "./StatementNode";

const NODE_TYPES = { statement: StatementNode };
const V_GAP = 170;
const H_GAP = 210;
const MAX_EXPAND = 24;

type FlowNode = Node<StatementNodeData>;

export function GraphView({ focusLabel }: { focusLabel: string }) {
  const { t } = useTranslation();
  const index = useMetamathStore((s) => s.index);
  const navigate = useNavigate();
  const usage = useMemo(() => (index ? getUsageIndex(index) : {}), [index]);

  const [nodes, setNodes, onNodesChangeRaw] = useNodesState<FlowNode>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const [notice, setNotice] = useState<{ count: number; shown: number } | null>(
    null,
  );

  const makeNode = useCallback(
    (label: string, x: number, y: number): FlowNode | null => {
      if (!index) return null;
      const stmt = index.statements[label];
      if (!stmt) return null;
      return {
        id: label,
        type: "statement",
        position: { x, y },
        data: {
          label,
          kind: stmt.kind,
          expression: stmt.expression,
          focused: label === focusLabel,
          depsExpanded: false,
          usersExpanded: false,
          hasDeps: (stmt.proof?.dependencies.length ?? 0) > 0,
          hasUsers: (usage[label]?.length ?? 0) > 0,
          onExpandDeps: expandDeps,
          onExpandUsers: expandUsers,
          onOpen: (l: string) => navigate(`/browse/${encodeURIComponent(l)}`),
        },
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [index, usage, focusLabel],
  );

  const expandDeps = useCallback(
    (label: string) => {
      if (!index) return;
      const allDeps = index.statements[label]?.proof?.dependencies ?? [];
      if (allDeps.length > MAX_EXPAND)
        setNotice({ count: allDeps.length, shown: MAX_EXPAND });
      const deps = allDeps.slice(0, MAX_EXPAND);
      setNodes((prev) => {
        const existing = new Map(prev.map((n) => [n.id, n]));
        const base = existing.get(label)?.position ?? { x: 0, y: 0 };
        const newLabels = deps.filter((d) => !existing.has(d));
        const additions = newLabels
          .map((d, i) =>
            makeNode(
              d,
              base.x + (i - (newLabels.length - 1) / 2) * H_GAP,
              base.y - V_GAP,
            ),
          )
          .filter((n): n is FlowNode => n !== null);
        return [
          ...prev.map((n) =>
            n.id === label
              ? { ...n, data: { ...n.data, depsExpanded: true } }
              : n,
          ),
          ...additions,
        ];
      });
      setEdges((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const additions: Edge[] = deps
          .map((d) => ({
            id: `${label}->${d}`,
            source: label,
            target: d,
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            style: { stroke: "var(--color-border)" },
          }))
          .filter((e) => !existingIds.has(e.id));
        return [...prev, ...additions];
      });
    },
    [index, setNodes, setEdges, makeNode],
  );

  const expandUsers = useCallback(
    (label: string) => {
      if (!index) return;
      const allUsers = usage[label] ?? [];
      if (allUsers.length > MAX_EXPAND)
        setNotice({ count: allUsers.length, shown: MAX_EXPAND });
      const users = allUsers.slice(0, MAX_EXPAND);
      setNodes((prev) => {
        const existing = new Map(prev.map((n) => [n.id, n]));
        const base = existing.get(label)?.position ?? { x: 0, y: 0 };
        const newLabels = users.filter((u) => !existing.has(u));
        const additions = newLabels
          .map((u, i) =>
            makeNode(
              u,
              base.x + (i - (newLabels.length - 1) / 2) * H_GAP,
              base.y + V_GAP,
            ),
          )
          .filter((n): n is FlowNode => n !== null);
        return [
          ...prev.map((n) =>
            n.id === label
              ? { ...n, data: { ...n.data, usersExpanded: true } }
              : n,
          ),
          ...additions,
        ];
      });
      setEdges((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const additions: Edge[] = users
          .map((u) => ({
            id: `${u}->${label}`,
            source: u,
            target: label,
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            style: { stroke: "var(--color-border)" },
          }))
          .filter((e) => !existingIds.has(e.id));
        return [...prev, ...additions];
      });
    },
    [index, usage, setNodes, setEdges, makeNode],
  );

  useEffect(() => {
    const root = makeNode(focusLabel, 0, 0);
    setNodes(root ? [root] : []);
    setEdges([]);
    setNotice(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusLabel, index]);

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => onNodesChangeRaw(changes),
    [onNodesChangeRaw],
  );

  return (
    <div className="relative size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable className="!hidden !bg-card sm:!block" />
      </ReactFlow>
      {notice && (
        <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
          {t("graph.tooLarge", { count: notice.count, shown: notice.shown })}
        </div>
      )}
    </div>
  );
}
