"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import type NVL from "@neo4j-nvl/base";
import type { Fact, Patient, SourceRef } from "@/lib/types";

const InteractiveNvlWrapper = dynamic(
  () => import("@neo4j-nvl/react").then((mod) => mod.InteractiveNvlWrapper),
  {
    ssr: false,
    loading: () => <div className="h-full w-full" />,
  }
);

type GroupKey = Fact["group"];

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
};

const GROUP_LABELS: Record<GroupKey, string> = {
  demographics: "Demographics",
  diagnosis: "Diagnosis",
  staging: "Staging",
  medication: "Medication",
  imaging: "Imaging",
  lab: "Lab",
  history: "History",
  genomics: "Genomics",
};

const GROUP_COLOR = "#475569";
const FACT_COLOR = "#94A3B8";
const PATIENT_COLOR = "#0f1f4d";
const SOURCE_COLOR = "#CBD5E1";

function buildGraph(
  patient: Patient,
  facts: Fact[]
): { nodes: GraphNode[]; rels: GraphRel[] } {
  const nodes: GraphNode[] = [];
  const rels: GraphRel[] = [];

  const patientId = `patient-${patient.id}`;
  nodes.push({
    id: patientId,
    caption: patient.cancerLabel || patient.name,
    size: 60,
    color: PATIENT_COLOR,
    captionAlign: "center",
    captionSize: 1.4,
  });

  const groupsPresent = new Set<GroupKey>(facts.map((f) => f.group));
  for (const group of groupsPresent) {
    const groupId = `group-${group}`;
    nodes.push({
      id: groupId,
      caption: GROUP_LABELS[group],
      size: 40,
      color: GROUP_COLOR,
      captionAlign: "center",
      captionSize: 1.1,
    });
    rels.push({
      id: `rel-${patientId}-${groupId}`,
      from: patientId,
      to: groupId,
      caption: "HAS",
    });
  }

  for (const fact of facts) {
    const factId = `fact-${fact.id}`;
    const groupId = `group-${fact.group}`;
    nodes.push({
      id: factId,
      caption: fact.label,
      size: 18 + Math.round((fact.confidence ?? 0) * 18),
      color: FACT_COLOR,
      captionAlign: "bottom",
    });
    rels.push({
      id: `rel-${groupId}-${factId}`,
      from: groupId,
      to: factId,
      caption: "CONTAINS",
    });
  }

  const sourceMap = new Map<string, SourceRef>();
  for (const fact of facts) {
    sourceMap.set(fact.source.id, fact.source);
  }
  for (const source of sourceMap.values()) {
    nodes.push({
      id: `source-${source.id}`,
      caption: source.label,
      size: 24,
      color: SOURCE_COLOR,
      captionAlign: "bottom",
    });
  }
  for (const fact of facts) {
    rels.push({
      id: `rel-fact-${fact.id}-source-${fact.source.id}`,
      from: `fact-${fact.id}`,
      to: `source-${fact.source.id}`,
      caption: "FROM",
    });
  }

  return { nodes, rels };
}

export function FactsGraph({
  patient,
  facts,
}: {
  patient: Patient;
  facts: Fact[];
}) {
  const { nodes, rels } = useMemo(
    () => buildGraph(patient, facts),
    [patient, facts]
  );

  const nvlRef = useRef<NVL | null>(null);
  const didFitRef = useRef(false);

  useEffect(() => {
    didFitRef.current = false;
  }, [nodes, rels]);

  if (facts.length === 0) {
    return (
      <div className="grid h-[460px] w-full place-items-center text-[12.5px] italic text-muted-foreground">
        No facts to graph yet.
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
            console.log("[FactsGraph] node click", node);
          },
          onRelationshipClick: (rel) => {
            console.log("[FactsGraph] relationship click", rel);
          },
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
