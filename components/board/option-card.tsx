"use client";

import { Sparkles, CheckCircle2, Send, TrendingUp, CalendarRange } from "lucide-react";
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
  const tone = INTENT_TONE[option.intent];
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

      <header className="flex items-start gap-3">
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
      </Section>

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
        icon={<CalendarRange className="h-3 w-3 text-violet-500" />}
        title="Plan timeline"
      >
        <TreatmentTimeline phases={option.phases} />
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
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
