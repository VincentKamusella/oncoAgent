"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import type NVL from "@neo4j-nvl/base";
import type { AuraGraph as AuraGraphData } from "@/lib/neo4j/client";

const InteractiveNvlWrapper = dynamic(
  () => import("@neo4j-nvl/react").then((mod) => mod.InteractiveNvlWrapper),
  {
    ssr: false,
    loading: () => <div className="h-full w-full" />,
  },
);

type GraphNode = {
  id: string;
  caption: string;
  size: number;
  color: string;
  captionAlign: "top" | "bottom" | "center";
  captionSize?: number;
};

type GraphRel = {
  id: string;
  from: string;
  to: string;
  caption: string;
  color: string;
  width: number;
};

// Same monochromatic palette as facts-graph.tsx so the Aura graph
// blends with the rest of the vault — only size and edge weight vary.
const ANCHOR_COLOR = "#0f1f4d"; // Patient
const TIER1_COLOR = "#475569"; // case-defining (Diagnosis, Plan, Stage)
const TIER2_COLOR = "#94A3B8"; // substantive (Fact, Biomarker, Document, Alteration)
const TIER3_COLOR = "#CBD5E1"; // peripheral (everything else)

const TIER1_LABELS = new Set([
  "Diagnosis",
  "TreatmentPlan",
  "StageAssertion",
]);
const TIER2_LABELS = new Set([
  "Fact",
  "BiomarkerResult",
  "GenomicAlteration",
  "Document",
  "Email",
  "ClinicalReport",
  "IntakeForm",
  "Agenda",
  "PolicyDoc",
]);

function styleNode(labels: string[]): { color: string; size: number } {
  if (labels.includes("Patient")) return { color: ANCHOR_COLOR, size: 60 };
  if (labels.some((l) => TIER1_LABELS.has(l)))
    return { color: TIER1_COLOR, size: 38 };
  if (labels.some((l) => TIER2_LABELS.has(l)))
    return { color: TIER2_COLOR, size: 26 };
  return { color: TIER3_COLOR, size: 20 };
}

function styleRel(type: string): { color: string; width: number } {
  if (type === "CONTRADICTS" || type === "CONTRADICTS_FACT") {
    return { color: TIER1_COLOR, width: 4 };
  }
  if (type === "CASCADED_FROM") return { color: TIER2_COLOR, width: 3 };
  if (type === "SUPERSEDES") return { color: TIER2_COLOR, width: 2 };
  return { color: TIER3_COLOR, width: 1 };
}

function relCaption(type: string): string {
  return type.replace(/_/g, " ").toLowerCase();
}

function buildGraph(data: AuraGraphData): {
  nodes: GraphNode[];
  rels: GraphRel[];
} {
  const nodes: GraphNode[] = data.nodes.map((n) => {
    const { color, size } = styleNode(n.labels);
    return {
      id: n.id,
      caption: n.caption,
      size,
      color,
      captionAlign: n.labels.includes("Patient") ? "center" : "bottom",
      captionSize: n.labels.includes("Patient") ? 1.4 : 1.0,
    };
  });

  const rels: GraphRel[] = data.rels.map((r) => {
    const { color, width } = styleRel(r.type);
    return {
      id: r.id,
      from: r.from,
      to: r.to,
      caption: relCaption(r.type),
      color,
      width,
    };
  });

  return { nodes, rels };
}

export function AuraGraph({
  data,
  onNodeClick,
}: {
  data: AuraGraphData;
  onNodeClick?: (node: { labels: string[]; properties: Record<string, unknown> }) => void;
}) {
  const { nodes, rels } = useMemo(() => buildGraph(data), [data]);

  const nvlRef = useRef<NVL | null>(null);
  const didFitRef = useRef(false);

  useEffect(() => {
    didFitRef.current = false;
  }, [nodes, rels]);

  if (nodes.length === 0) {
    return (
      <div className="grid h-[460px] w-full place-items-center text-[12.5px] italic text-muted-foreground">
        No graph data for this patient yet.
      </div>
    );
  }

  return (
    <div className="h-[460px] w-full">
      <InteractiveNvlWrapper
        ref={nvlRef}
        nodes={nodes}
        rels={rels}
        nvlOptions={{
          allowDynamicMinZoom: true,
          disableTelemetry: true,
        }}
        nvlCallbacks={{
          onLayoutDone: () => {
            if (didFitRef.current) return;
            const nvl = nvlRef.current;
            if (!nvl) return;
            nvl.fit(nodes.map((n) => n.id));
            didFitRef.current = true;
          },
        }}
        mouseEventCallbacks={{
          onPan: true,
          onZoom: true,
          onDrag: true,
          onHover: true,
          onNodeClick: (node) => {
            console.log("[AuraGraph] node click", node);
            if (onNodeClick && node?.id) {
              const original = data.nodes.find((n) => n.id === node.id);
              if (original) {
                onNodeClick({ labels: original.labels, properties: original.properties });
              }
            }
          },
          onRelationshipClick: (rel) => {
            console.log("[AuraGraph] relationship click", rel);
          },
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
