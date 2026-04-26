"use client";

import { motion } from "motion/react";
import { ArrowRight, AlertOctagon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES, type IngestCategory } from "@/lib/onboarding/classify";
import type { ClassifiedFile } from "@/lib/onboarding/build-patient";
import { cn } from "@/lib/utils";

type Props = {
  patientName: string;
  cancerType: string;
  totalFacts: number;
  classified: ClassifiedFile[];
  busy: boolean;
  onOpen: () => void;
};

function pickStage(classified: ClassifiedFile[]): { primary: string; sub: string } {
  const hasRad = classified.some((c) => c.category === "radiology");
  const hasPath = classified.some((c) => c.category === "pathology");
  const restaging = classified.some((c) => c.conflict);
  if (hasRad && hasPath) {
    return restaging
      ? { primary: "IIB → restaging", sub: "cT2 N1 M0 · re-evaluation in progress" }
      : { primary: "IIB", sub: "cT2 cN1 cM0 — clinical" };
  }
  if (hasPath) return { primary: "Pending", sub: "Awaiting imaging correlation" };
  return { primary: "Pending", sub: "Workup in progress" };
}

function pickTreatment(classified: ClassifiedFile[]): { primary: string; sub: string } {
  const op = classified.filter((c) => c.category === "operational");
  if (op.length) {
    return { primary: "AC-T neoadjuvant", sub: "Cycle 1 of 4 · q3w" };
  }
  return { primary: "Plan pending", sub: "Awaiting tumor board review" };
}

function pickLatest(classified: ClassifiedFile[]): { primary: string; sub: string } {
  // A conflict trigger is the most newsworthy "latest" event if present.
  const conflictFile = classified.find((c) => c.conflict);
  if (conflictFile) {
    return {
      primary: conflictFile.detected,
      sub: "Just ingested · pending review",
    };
  }

  // Otherwise prefer clinical signal — pathology, radiology, genomics, labs — before
  // operational, communications, or reference fillers.
  const PRIORITY: IngestCategory[] = [
    "pathology",
    "radiology",
    "genomics",
    "labs",
    "notes",
    "operational",
    "communications",
    "reference",
  ];
  for (const cat of PRIORITY) {
    const sample = classified.find((c) => c.category === cat);
    if (sample) {
      const count = classified.filter((c) => c.category === cat).length;
      return {
        primary: sample.detected,
        sub: `${count} ${CATEGORIES[cat].label.toLowerCase()} ${count === 1 ? "record" : "records"} · moments ago`,
      };
    }
  }
  return { primary: "Records ingested", sub: "moments ago" };
}

export function SummaryStep({
  patientName,
  cancerType,
  totalFacts,
  classified,
  busy,
  onOpen,
}: Props) {
  const stage = pickStage(classified);
  const treatment = pickTreatment(classified);
  const latest = pickLatest(classified);
  const hasConflict = classified.some((c) => c.conflict);

  const distribution = aggregate(classified);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-0 w-full flex-col items-center justify-center px-6 py-10"
    >
      <div className="w-full max-w-[860px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/20">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="eyebrow">Vault ready</span>
        </div>

        <h1 className="editorial mt-3 text-[34px] leading-[1.05] text-foreground">
          {patientName}&apos;s vault is assembled.
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
          {classified.length} records routed · {totalFacts} facts indexed with provenance ·{" "}
          {distribution.length} specialist {distribution.length === 1 ? "lane" : "lanes"} populated.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FactCard delay={0.05} eyebrow="Stage" primary={stage.primary} sub={stage.sub} emphasis />
          <FactCard delay={0.15} eyebrow="Treatment" primary={treatment.primary} sub={treatment.sub} />
          <FactCard delay={0.25} eyebrow="Latest" primary={latest.primary} sub={latest.sub} />
        </div>

        {hasConflict ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[12px] font-medium text-amber-800 ring-1 ring-amber-200"
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            1 PR opened · review pending
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="mt-8 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-soft)]"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {distribution.map((d) => (
              <span
                key={d.category}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1",
                  CATEGORIES[d.category].swatch,
                  CATEGORIES[d.category].ink,
                  CATEGORIES[d.category].ring,
                )}
              >
                <span>{CATEGORIES[d.category].label}</span>
                <span className="mono opacity-80">
                  {d.files} · {d.facts}
                </span>
              </span>
            ))}
          </div>
          <Button
            size="lg"
            onClick={onOpen}
            disabled={busy}
            className="gap-1.5 bg-violet-500 px-4 text-[13px] font-medium hover:bg-violet-600"
          >
            {busy ? "Opening…" : "Open vault"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </motion.div>

        <p className="mt-3 max-w-md text-[11.5px] text-muted-foreground/70">
          Provenance preserved · every fact links back to its source record · {cancerType} pathway
          assigned.
        </p>
      </div>
    </motion.div>
  );
}

function FactCard({
  eyebrow,
  primary,
  sub,
  emphasis,
  delay,
}: {
  eyebrow: string;
  primary: string;
  sub: string;
  emphasis?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
    >
      <span className="eyebrow">{eyebrow}</span>
      <p
        className={cn(
          "mt-1.5 leading-tight text-foreground",
          emphasis ? "editorial text-[28px]" : "text-[17px] font-semibold tracking-tight",
        )}
      >
        {primary}
      </p>
      <p className="mt-1.5 text-[12px] text-muted-foreground">{sub}</p>
    </motion.div>
  );
}

function aggregate(classified: ClassifiedFile[]) {
  const map = new Map<IngestCategory, { files: number; facts: number }>();
  for (const c of classified) {
    const cur = map.get(c.category) ?? { files: 0, facts: 0 };
    cur.files += 1;
    cur.facts += c.facts;
    map.set(c.category, cur);
  }
  return Array.from(map.entries()).map(([category, v]) => ({ category, ...v }));
}
