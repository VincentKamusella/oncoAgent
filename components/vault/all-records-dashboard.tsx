"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Network } from "lucide-react";
import type {
  Fact,
  GuidelinesGraph,
  GuidelinesNode,
  Patient,
} from "@/lib/types";
import type { AuraGraph as AuraGraphData } from "@/lib/neo4j/client";
import { FactsGraph } from "./facts-graph";
import { AuraGraph } from "./aura-graph";
import { GuidelinesFlow } from "@/components/guidelines/guidelines-flow";
import { RulePanel } from "@/components/guidelines/rule-panel";

export function AllRecordsDashboard({
  patient,
  facts,
  guidelines,
}: {
  patient: Patient;
  facts: Fact[];
  guidelines: GuidelinesGraph | null;
}) {
  const stage = deriveStage(patient);
  const treatment = deriveTreatment(patient);
  const latest = deriveLatest(facts);

  const [aura, setAura] = useState<AuraGraphData | null | "loading">("loading");
  useEffect(() => {
    let cancelled = false;
    setAura("loading");
    fetch(`/api/patients/${encodeURIComponent(patient.id)}/graph`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 200) {
          const data = (await res.json()) as AuraGraphData;
          setAura(data.nodes.length > 0 ? data : null);
        } else {
          setAura(null);
        }
      })
      .catch(() => {
        if (!cancelled) setAura(null);
      });
    return () => {
      cancelled = true;
    };
  }, [patient.id]);

  const [selected, setSelected] = useState<GuidelinesNode | null>(
    () =>
      guidelines?.nodes.find((n) => n.factKey === "staging.clinical") ?? null
  );
  const matchingFacts = useMemo(
    () =>
      selected?.factKey
        ? patient.facts.filter((f) => f.key === selected.factKey)
        : [],
    [selected, patient.facts]
  );

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-6 py-6">
      <span className="mono text-[10.5px] uppercase tracking-[0.16em] text-violet-600">
        Vault
      </span>
      <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
        {patient.cancerLabel}
      </h2>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
        {patient.diagnosis}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-[640px]">
        <FactCard
          label="Stage"
          value={stage.value}
          sub={stage.sub}
          emphasis
        />
        <FactCard
          label="Treatment"
          value={treatment.value}
          sub={treatment.sub}
        />
        <FactCard
          label="Latest"
          value={latest.value}
          sub={latest.sub}
        />
      </div>

      {guidelines && (
        <div className="mt-10">
          <div className="flex items-center gap-2">
            <Network className="h-3.5 w-3.5 text-violet-600" />
            <span className="mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Guideline pathway
            </span>
          </div>
          <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">
            {guidelines.title}
          </h3>
          <div className="mono mt-1 text-[11px] text-muted-foreground">
            source · {guidelines.source}
          </div>

          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_360px]">
            <GuidelinesFlow
              graph={guidelines}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
            <RulePanel node={selected} matchingFacts={matchingFacts} />
          </div>
        </div>
      )}

      <div className="mt-10">
        <span className="mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Context graph
        </span>
        <div className="mt-3">
          {aura === "loading" ? (
            <div className="h-[460px] w-full" />
          ) : aura ? (
            <AuraGraph data={aura} />
          ) : (
            <FactsGraph patient={patient} facts={facts} />
          )}
        </div>
      </div>
    </section>
  );
}

function FactCard({
  label,
  value,
  sub,
  emphasis = false,
}: {
  label: string;
  value: string;
  sub: string | null;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 truncate font-semibold tracking-tight text-foreground ${
          emphasis ? "text-[28px] leading-none" : "text-[17px] leading-tight"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="mono mt-1 truncate text-[11px] text-muted-foreground">
          {sub}
        </div>
      )}
    </div>
  );
}

function deriveStage(patient: Patient): { value: string; sub: string | null } {
  const combined = `${patient.cancerLabel} ${patient.staging}`;
  const match = combined.match(/Stage\s+([IVABC0-9]+)/i);
  if (match) {
    const sub = patient.staging
      .replace(/\s*[—-]?\s*Stage\s+[IVABC0-9]+\s*/i, "")
      .trim();
    return { value: match[1], sub: sub || null };
  }
  const [core, ...rest] = patient.staging.split(/\s*[(—]\s*/);
  return {
    value: core.trim(),
    sub: rest.length > 0 ? `(${rest.join(" ").trim()}` : null,
  };
}

function deriveTreatment(
  patient: Patient
): { value: string; sub: string | null } {
  const current =
    patient.plan.find((p) => p.status === "in-progress") ??
    patient.plan.find((p) => p.status === "planned");
  if (!current) return { value: "—", sub: null };
  if (current.cycles) {
    return {
      value: `Cycle ${current.cycles.completed} / ${current.cycles.total}`,
      sub: current.name,
    };
  }
  return { value: current.name, sub: current.regimen ?? null };
}

function deriveLatest(facts: Fact[]): { value: string; sub: string | null } {
  let top: Fact | null = null;
  let topTs = -Infinity;
  let fallback: Fact | null = null;
  let fallbackTs = -Infinity;
  for (const f of facts) {
    const ts = new Date(f.updatedAt).getTime();
    if (ts > fallbackTs) {
      fallbackTs = ts;
      fallback = f;
    }
    if (f.group !== "demographics" && ts > topTs) {
      topTs = ts;
      top = f;
    }
  }
  const pick = top ?? fallback;
  if (!pick) return { value: "—", sub: null };
  return {
    value: pick.value,
    sub: `${pick.label} · ${formatDistanceToNowStrict(new Date(pick.updatedAt), { addSuffix: true })}`,
  };
}
