"use client";

import { useMemo, useState, useEffect } from "react";
import dagre from "@dagrejs/dagre";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  ReactFlowProvider,
} from "@xyflow/react";
import { Diamond, Pill, Target } from "lucide-react";
import type { GuidelinesGraph, GuidelinesNode } from "@/lib/types";
import { cn } from "@/lib/utils";

const NODE_W = 220;
const NODE_H = 78;

type FlowNodeData = {
  label: string;
  detail?: string;
  kind: GuidelinesNode["kind"];
  patientPath: boolean;
  factKey?: string;
  selected: boolean;
  onSelect: () => void;
};

function GuidelineNodeView({ data }: NodeProps<Node<FlowNodeData>>) {
  const Icon =
    data.kind === "decision" ? Diamond : data.kind === "treatment" ? Pill : Target;

  const palette = data.patientPath
    ? {
        bg: "#FFFFFF",
        ring: "#7C5BF7",
        ringWidth: 2,
        chipBg: "#F5F3FF",
        chipFg: "#5A39C9",
      }
    : {
        bg: "#FFFFFF",
        ring: "#EEF0F4",
        ringWidth: 1,
        chipBg: "#F4F4F6",
        chipFg: "#5A5F6A",
      };
  const opacity = data.patientPath ? 1 : 0.55;

  return (
    <div
      onClick={data.onSelect}
      className={cn(
        "group relative flex w-[220px] cursor-pointer items-start gap-2.5 rounded-2xl px-3.5 py-3 shadow-[var(--shadow-soft)] transition-all",
        data.selected && "ring-2 ring-violet-300"
      )}
      style={{
        background: palette.bg,
        border: `${palette.ringWidth}px solid ${palette.ring}`,
        opacity,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
      <div
        className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md"
        style={{ background: palette.chipBg, color: palette.chipFg }}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold leading-snug text-foreground whitespace-pre-line">
          {data.label}
        </div>
        {data.patientPath && data.kind === "decision" && (
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 mono text-[9.5px] font-semibold uppercase tracking-wider text-violet-700">
            patient path
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
    </div>
  );
}

const NODE_TYPES = { guideline: GuidelineNodeView };

function layout(graph: GuidelinesGraph) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 30, ranksep: 70, marginx: 24, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));
  graph.nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  graph.edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return graph.nodes.map((n) => {
    const node = g.node(n.id);
    return { ...n, x: node.x - NODE_W / 2, y: node.y - NODE_H / 2 };
  });
}

export function GuidelinesFlow({
  graph,
  onSelect,
  selectedId,
}: {
  graph: GuidelinesGraph;
  onSelect: (n: GuidelinesNode | null) => void;
  selectedId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const positioned = useMemo(() => layout(graph), [graph]);

  const nodes: Node<FlowNodeData>[] = useMemo(
    () =>
      positioned.map((n) => ({
        id: n.id,
        type: "guideline",
        position: { x: n.x, y: n.y },
        draggable: false,
        connectable: false,
        selectable: true,
        data: {
          label: n.label,
          detail: n.detail,
          kind: n.kind,
          patientPath: !!n.patientPath,
          factKey: n.factKey,
          selected: selectedId === n.id,
          onSelect: () => onSelect(n),
        },
      })),
    [positioned, selectedId, onSelect]
  );

  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep",
        animated: !!e.patientPath,
        style: e.patientPath
          ? { stroke: "#7C5BF7", strokeWidth: 2 }
          : { stroke: "#D1D5DB", strokeWidth: 1.25 },
        labelStyle: {
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          fill: e.patientPath ? "#5A39C9" : "#5A5F6A",
        },
        labelBgStyle: { fill: e.patientPath ? "#F5F3FF" : "#FFFFFF" },
        labelBgPadding: [4, 6] as [number, number],
        labelBgBorderRadius: 6,
        markerEnd: undefined,
      })),
    [graph]
  );

  if (!mounted) return <div className="h-[560px]" />;

  return (
    <div className="h-[560px] w-full overflow-hidden rounded-2xl border border-border bg-card">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.3}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#E6E2F5" gap={22} size={1.4} />
          <Controls
            position="bottom-right"
            showInteractive={false}
            className="!shadow-[var(--shadow-soft)] !border !border-border !bg-card !rounded-md overflow-hidden"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
