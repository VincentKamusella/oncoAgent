"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Send,
  FileText,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import type { TreatmentOption } from "@/lib/types";
import { TreatmentTimeline } from "@/components/plan/treatment-timeline";
import { cn } from "@/lib/utils";

const INTENT_TONE: Record<
  TreatmentOption["intent"],
  { bg: string; fg: string; label: string }
> = {
  curative: { bg: "bg-violet-100", fg: "text-violet-700", label: "Curative" },
  palliative: { bg: "bg-rose-100", fg: "text-rose-700", label: "Palliative" },
  trial: { bg: "bg-amber-100", fg: "text-amber-800", label: "Trial" },
  watch: { bg: "bg-slate-100", fg: "text-slate-700", label: "Watch" },
};

function meanRank(o: TreatmentOption): number {
  if (o.rankings.length === 0) return 99;
  const total = o.rankings.reduce((s, r) => s + r.rank, 0);
  return total / o.rankings.length;
}

function meanConfidence(o: TreatmentOption): number {
  if (o.rankings.length === 0) return 0;
  const total = o.rankings.reduce((s, r) => s + r.confidence, 0);
  return total / o.rankings.length;
}

export function rankOptions(options: TreatmentOption[]): TreatmentOption[] {
  return [...options].sort((a, b) => {
    const ra = meanRank(a);
    const rb = meanRank(b);
    if (ra !== rb) return ra - rb;
    return meanConfidence(b) - meanConfidence(a);
  });
}

export function OptionCard({
  option,
  index,
  isChosen,
  onChoose,
  onPreferred,
  onSendToPatient,
}: {
  option: TreatmentOption;
  index: number;
  isChosen?: boolean;
  onChoose?: (id: string) => void;
  onPreferred?: (id: string) => void;
  onSendToPatient?: (id: string) => void;
}) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  const tone = INTENT_TONE[option.intent];
  const score = (5 - meanRank(option)).toFixed(1);
  const confPct = Math.round(meanConfidence(option) * 100);
  const letter = String.fromCharCode(65 + index);

  return (
    <article
      className={cn(
        "surface relative flex flex-col gap-4 px-6 py-5",
        isChosen && "ring-2 ring-violet-300"
      )}
    >
      {isChosen && (
        <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full bg-violet-500 px-2.5 py-0.5 mono text-[10px] font-semibold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(124,91,247,0.35)]">
          <CheckCircle2 className="h-3 w-3" /> chosen
        </span>
      )}

      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-violet-500 mono text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(124,91,247,0.35)]">
            {letter}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                Option {letter} · {option.name}
              </h3>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 mono text-[10px] font-semibold uppercase tracking-wider",
                  tone.bg,
                  tone.fg
                )}
              >
                {tone.label}
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
              {option.shortLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Team score
          </span>
          <span className="mono text-[20px] font-semibold leading-none text-violet-700">
            ★ {score}
          </span>
          <span className="mono text-[10.5px] text-muted-foreground/80">
            confidence {confPct}%
          </span>
        </div>
      </header>

      <Section
        icon={<Sparkles className="h-3 w-3 text-violet-500" />}
        title="Why"
      >
        <ul className="flex flex-col gap-1">
          {option.rationale.map((r, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[13px] leading-snug text-foreground/85"
            >
              <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-violet-500" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setShowReasoning((v) => !v)}
          className="mt-1 flex items-center gap-0.5 text-[12px] font-medium text-violet-700 hover:underline"
        >
          {showReasoning ? "Hide reasoning" : "Show reasoning"}
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform",
              showReasoning && "rotate-90"
            )}
          />
        </button>
        {showReasoning && (
          <div className="mt-2 rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2 text-[12px] leading-snug text-foreground/85">
            <p className="mono mb-1 text-[10px] uppercase tracking-wider text-violet-700">
              Linked facts
            </p>
            <ul className="flex flex-col gap-0.5">
              {(option.rationaleFactIds ?? []).map((id) => (
                <li key={id} className="mono text-[11.5px] text-foreground/80">
                  {id}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Section
          icon={<TrendingUp className="h-3 w-3 text-emerald-600" />}
          title="Expected outcomes"
        >
          <ol className="flex flex-col gap-1.5">
            {option.outcomes.map((o, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-3 text-[12.5px]"
              >
                <span className="text-foreground/80">{o.label}</span>
                <span className="flex items-baseline gap-1.5 text-foreground">
                  <span className="font-medium">{o.value}</span>
                  {o.citation && (
                    <span className="mono text-[10px] text-muted-foreground/80">
                      [{o.citation}]
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          icon={<ShieldAlert className="h-3 w-3 text-rose-600" />}
          title="Toxicity / burden"
        >
          <ol className="flex flex-col gap-1.5">
            {option.toxicities.map((t, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-3 text-[12.5px]"
              >
                <span className="text-foreground/80">{t.category}</span>
                <span className="text-right text-foreground">{t.severity}</span>
              </li>
            ))}
          </ol>
          {option.burden && (
            <p className="mt-2 text-[11.5px] italic leading-snug text-muted-foreground">
              {option.burden}
            </p>
          )}
        </Section>
      </div>

      <Section
        icon={<FileText className="h-3 w-3 text-muted-foreground" />}
        title="Evidence"
      >
        <div className="flex flex-wrap gap-1.5">
          {option.evidence.map((e) => (
            <span
              key={e}
              className="rounded-md border border-border bg-card px-2 py-0.5 mono text-[10.5px] font-medium text-foreground/80"
            >
              {e}
            </span>
          ))}
        </div>
      </Section>

      <RankingTable rankings={option.rankings} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setShowPlan((v) => !v)}
          className="flex items-center gap-1 text-[12px] font-medium text-foreground/80 hover:text-foreground"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              showPlan && "rotate-180"
            )}
          />
          {showPlan ? "Hide plan timeline" : "Show plan timeline"}
        </button>
        <div className="flex items-center gap-2">
          {!isChosen && onPreferred && (
            <button
              type="button"
              onClick={() => onPreferred(option.id)}
              className="h-8 rounded-md border border-border bg-card px-3 text-[12px] font-medium text-foreground/80 transition-colors hover:bg-muted/60"
            >
              Mark preferred
            </button>
          )}
          {onSendToPatient && (
            <button
              type="button"
              onClick={() => onSendToPatient(option.id)}
              className="flex h-8 items-center gap-1.5 rounded-md bg-violet-500 px-3 text-[12px] font-medium text-white transition-colors hover:bg-violet-600"
            >
              <Send className="h-3 w-3" /> Send to patient
            </button>
          )}
          {onChoose && !isChosen && (
            <button
              type="button"
              onClick={() => onChoose(option.id)}
              className="flex h-8 items-center gap-1.5 rounded-md bg-emerald-500 px-3 text-[12px] font-medium text-white transition-colors hover:bg-emerald-600"
            >
              <CheckCircle2 className="h-3 w-3" /> Patient chose this
            </button>
          )}
        </div>
      </div>

      {showPlan && (
        <div className="border-t border-border pt-4">
          <TreatmentTimeline phases={option.phases} />
        </div>
      )}
    </article>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function RankingTable({ rankings }: { rankings: TreatmentOption["rankings"] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Clinician ranking
        </span>
        <span className="mono text-[10.5px] text-muted-foreground/80">
          1 = preferred
        </span>
      </div>
      <ol className="overflow-hidden rounded-lg border border-border">
        {rankings.map((r, i) => (
          <li
            key={r.specialist + i}
            className={cn(
              "grid grid-cols-[1fr_auto_120px] items-center gap-3 px-3 py-1.5 text-[12px]",
              i % 2 === 0 ? "bg-card" : "bg-muted/40"
            )}
          >
            <span className="flex flex-col leading-tight">
              <span className="font-medium text-foreground">{r.specialist}</span>
              <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {r.specialty}
              </span>
            </span>
            <span className="mono text-[11px] text-foreground">rank {r.rank}</span>
            <div className="flex items-center justify-end gap-1.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-violet-500"
                  style={{ width: `${r.confidence * 100}%` }}
                />
              </div>
              <span className="mono text-[10.5px] tabular-nums text-muted-foreground">
                {Math.round(r.confidence * 100)}%
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
