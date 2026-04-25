"use client";

import { differenceInCalendarDays, format } from "date-fns";
import {
  Pill,
  Zap,
  Scissors,
  ShieldCheck,
  Heart,
  Eye,
  Check,
  CircleDot,
  Clock,
} from "lucide-react";
import { useState } from "react";
import type { TreatmentPhase, PhaseType, PhaseStatus } from "@/lib/types";
import { FactMono } from "@/components/ui/fact-mono";
import { StatusPill } from "@/components/ui/status-pill";

const TYPE_ICON: Record<PhaseType, React.ReactNode> = {
  chemo: <Pill className="h-3.5 w-3.5" />,
  radiation: <Zap className="h-3.5 w-3.5" />,
  surgery: <Scissors className="h-3.5 w-3.5" />,
  immunotherapy: <ShieldCheck className="h-3.5 w-3.5" />,
  targeted: <Heart className="h-3.5 w-3.5" />,
  hormonal: <Heart className="h-3.5 w-3.5" />,
  observation: <Eye className="h-3.5 w-3.5" />,
};

const TYPE_COLOR: Record<
  PhaseType,
  { bg: string; ring: string; fg: string; track: string }
> = {
  chemo: { bg: "#f1f3f7", ring: "#cfd5df", fg: "#3a4252", track: "#0f1f4d" },
  radiation: { bg: "#f1f3f7", ring: "#cfd5df", fg: "#3a4252", track: "#0f1f4d" },
  surgery: { bg: "#f1f3f7", ring: "#cfd5df", fg: "#3a4252", track: "#0f1f4d" },
  immunotherapy: { bg: "#f1f3f7", ring: "#cfd5df", fg: "#3a4252", track: "#0f1f4d" },
  targeted: { bg: "#f1f3f7", ring: "#cfd5df", fg: "#3a4252", track: "#0f1f4d" },
  hormonal: { bg: "#f1f3f7", ring: "#cfd5df", fg: "#3a4252", track: "#0f1f4d" },
  observation: { bg: "#f1f3f7", ring: "#cfd5df", fg: "#3a4252", track: "#0f1f4d" },
};

const STATUS_TONE: Record<PhaseStatus, "active" | "info" | "muted" | "warn"> = {
  done: "active",
  "in-progress": "info",
  planned: "muted",
  skipped: "warn",
};

const STATUS_ICON: Record<PhaseStatus, React.ReactNode> = {
  done: <Check className="h-3 w-3" />,
  "in-progress": <CircleDot className="h-3 w-3" />,
  planned: <Clock className="h-3 w-3" />,
  skipped: <Eye className="h-3 w-3" />,
};

const TODAY = new Date("2026-04-25T12:00:00Z");

const MIN_TIMELINE_WIDTH = 900;
const PHASE_BUTTON_WIDTH = 200;

export function TreatmentTimeline({ phases }: { phases: TreatmentPhase[] }) {
  const [active, setActive] = useState<TreatmentPhase | null>(
    phases.find((p) => p.status === "in-progress") ?? phases[0] ?? null
  );

  if (phases.length === 0) return null;

  const dates = phases.flatMap((p) => [
    new Date(p.startDate),
    new Date(p.endDate ?? p.startDate),
  ]);
  const start = new Date(Math.min(...dates.map((d) => d.getTime())));
  const end = new Date(Math.max(...dates.map((d) => d.getTime())));
  const span = Math.max(differenceInCalendarDays(end, start), 30);
  const todayPct = clamp(
    (differenceInCalendarDays(TODAY, start) / span) * 100,
    0,
    100
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {format(start, "MMM yyyy")} → {format(end, "MMM yyyy")} · {phases.length} phases
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="block h-2 w-2 rounded-full bg-emerald-500" />
            Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="block h-2 w-2 rounded-full bg-violet-500" />
            In progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="block h-2 w-2 rounded-full bg-muted-foreground/40" />
            Planned
          </span>
        </div>
      </div>

      <div className="surface relative overflow-x-auto">
        <div
          className="relative px-6 py-8"
          style={{
            minWidth: Math.max(
              MIN_TIMELINE_WIDTH,
              phases.length * PHASE_BUTTON_WIDTH
            ),
          }}
        >
          <div className="relative h-[180px]">
            <div
              className="absolute top-0 bottom-0 z-10 flex flex-col items-center"
              style={{ left: `${todayPct}%` }}
            >
            <div className="mb-1 rounded-md bg-violet-500 px-1.5 py-0.5 mono text-[9.5px] font-semibold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(15,31,77,0.20)]">
              today
            </div>
            <div className="h-full w-px border-l border-dashed border-violet-400" />
          </div>

          {phases.map((p, i) => {
            const phaseStart = new Date(p.startDate);
            const phaseEnd = new Date(p.endDate ?? p.startDate);
            const left = clamp(
              (differenceInCalendarDays(phaseStart, start) / span) * 100,
              0,
              100
            );
            const width = Math.max(
              (differenceInCalendarDays(phaseEnd, phaseStart) / span) * 100,
              4
            );
            const color = TYPE_COLOR[p.type];
            const isActive = active?.id === p.id;
            const top = 30 + (i % 4) * 36;

            const opacityByStatus =
              p.status === "planned" ? 0.65 : p.status === "skipped" ? 0.4 : 1;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActive(p)}
                className={`group absolute flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-all ${
                  isActive
                    ? "ring-2 ring-violet-300 z-20 shadow-[0_8px_24px_rgba(15,31,77,0.14)]"
                    : "z-0 hover:ring-1 hover:ring-violet-200"
                }`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  top,
                  background: color.bg,
                  borderColor: color.ring,
                  color: color.fg,
                  opacity: opacityByStatus,
                  minWidth: 130,
                }}
              >
                <span
                  className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full"
                  style={{ background: color.track, color: "white" }}
                >
                  {p.status === "done" ? (
                    STATUS_ICON.done
                  ) : p.status === "in-progress" ? (
                    <CircleDot className="h-3 w-3 animate-pulse" />
                  ) : (
                    TYPE_ICON[p.type]
                  )}
                </span>
                <span className="truncate font-semibold">{p.name}</span>
                {p.cycles && (
                  <span className="mono text-[10px] opacity-70">
                    {p.cycles.completed}/{p.cycles.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative mt-4 flex items-center border-t border-dashed border-border pt-2">
          {[0, 25, 50, 75, 100].map((pct) => {
            const date = new Date(
              start.getTime() + (pct / 100) * (end.getTime() - start.getTime())
            );
            return (
              <div
                key={pct}
                className="absolute -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                <FactMono className="text-[10px] text-muted-foreground/80">
                  {format(date, "MMM d")}
                </FactMono>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {active && <PhaseDetail phase={active} />}
    </div>
  );
}

function PhaseDetail({ phase }: { phase: TreatmentPhase }) {
  const color = TYPE_COLOR[phase.type];
  const tone = STATUS_TONE[phase.status];

  return (
    <div className="surface flex flex-col gap-4 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="grid h-9 w-9 place-items-center rounded-xl"
            style={{ background: color.bg, color: color.fg }}
          >
            {TYPE_ICON[phase.type]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold tracking-tight">{phase.name}</h3>
              <StatusPill tone={tone}>
                {phase.status === "done"
                  ? "Completed"
                  : phase.status === "in-progress"
                  ? "In progress"
                  : phase.status === "planned"
                  ? "Planned"
                  : "Skipped"}
              </StatusPill>
            </div>
            {phase.regimen && (
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {phase.regimen}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <FactMono className="text-[11.5px] text-muted-foreground">
            {format(new Date(phase.startDate), "yyyy-MM-dd")}
            {phase.endDate ? ` → ${format(new Date(phase.endDate), "yyyy-MM-dd")}` : ""}
          </FactMono>
          {phase.cycles && (
            <div className="mt-0.5 mono text-[11px] text-muted-foreground">
              cycle {phase.cycles.completed} / {phase.cycles.total}
            </div>
          )}
        </div>
      </div>

      {phase.cycles && (
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full"
            style={{
              width: `${(phase.cycles.completed / phase.cycles.total) * 100}%`,
              background: color.track,
            }}
          />
        </div>
      )}

      {phase.rationale && (
        <div className="rounded-lg border border-violet-100 bg-violet-50/40 px-3 py-2 text-[12.5px] leading-snug text-foreground/80">
          <span className="mono mr-1.5 text-[10.5px] uppercase tracking-wider text-violet-700">
            Why
          </span>
          {phase.rationale}
        </div>
      )}
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
