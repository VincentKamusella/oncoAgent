"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { Network } from "lucide-react";
import { getPatient } from "@/lib/mock-data/patients";
import { guidelinesFor } from "@/lib/mock-data/guidelines";
import { GuidelinesFlow } from "@/components/guidelines/guidelines-flow";
import { RulePanel } from "@/components/guidelines/rule-panel";
import type { GuidelinesNode } from "@/lib/types";

export default function GuidelinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const patient = getPatient(id);
  const graph = guidelinesFor(id);
  if (!patient || !graph) notFound();

  const [selected, setSelected] = useState<GuidelinesNode | null>(
    graph.nodes.find((n) => n.factKey === "staging.clinical") ?? null
  );

  const matchingFacts = selected?.factKey
    ? patient.facts.filter((f) => f.key === selected.factKey)
    : [];

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5">
      <header>
        <div className="flex items-center gap-2">
          <Network className="h-3.5 w-3.5 text-violet-600" />
          <span className="mono text-[11px] uppercase tracking-[0.16em] text-violet-600">
            Guidelines
          </span>
        </div>
        <h2 className="mt-1 text-[22px] font-semibold tracking-tight">
          {graph.title}
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          The agent matched {patient.name.split(" ")[0]}&apos;s records against this pathway. The
          highlighted route is the patient&apos;s actual trajectory; dimmed branches were not selected.
        </p>
        <div className="mt-2 mono text-[11px] text-muted-foreground">
          source · {graph.source}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <GuidelinesFlow
          graph={graph}
          selectedId={selected?.id}
          onSelect={setSelected}
        />
        <RulePanel node={selected} matchingFacts={matchingFacts} />
      </div>
    </div>
  );
}
