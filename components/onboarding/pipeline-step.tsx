"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY_ORDER,
  classify,
  isPotentialConflict,
  type Classification,
  type IngestCategory,
} from "@/lib/onboarding/classify";
import { factCount } from "@/lib/onboarding/extract";
import type { ClassifiedFile } from "@/lib/onboarding/build-patient";
import { ConvergeGraph, type GraphSeed } from "./converge-graph";
import { cn } from "@/lib/utils";
import type { DroppedFile } from "./dropzone-step";

const VAULT_BUILD_MS = 6500;

type Props = {
  files: DroppedFile[];
  patientName: string;
  patientInitials: string;
  onComplete: (result: { totalFacts: number; classified: ClassifiedFile[] }) => void;
};

type EnrichedFile = {
  id: string;
  file: DroppedFile;
  cls: Classification;
  facts: number;
  conflict: boolean;
};

export function PipelineStep({ files, patientName, patientInitials, onComplete }: Props) {
  const [done, setDone] = useState(false);
  const [size, setSize] = useState({ w: 1200, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  const enriched: EnrichedFile[] = useMemo(
    () =>
      files.map((f) => {
        const cls = classify(f);
        return {
          id: f.id,
          file: f,
          cls,
          facts: factCount(f, cls.category),
          conflict: isPotentialConflict(f.name),
        };
      }),
    [files],
  );

  const totalFacts = useMemo(
    () => enriched.reduce((acc, f) => acc + f.facts, 0),
    [enriched],
  );

  const graphSeeds: GraphSeed[] = useMemo(() => {
    const tally = new Map<IngestCategory, number>();
    for (const e of enriched) {
      tally.set(e.cls.category, (tally.get(e.cls.category) ?? 0) + e.facts);
    }
    return CATEGORY_ORDER
      .filter((c) => (tally.get(c) ?? 0) > 0)
      .map((category) => ({ category, count: tally.get(category)! }));
  }, [enriched]);

  useEffect(() => {
    const measure = () => {
      const r = containerRef.current?.getBoundingClientRect();
      if (r) setSize({ w: Math.max(800, r.width), h: Math.max(420, r.height) });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), VAULT_BUILD_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!done) return;
    const classified: ClassifiedFile[] = enriched.map((e) => ({
      fileName: e.file.name,
      category: e.cls.category,
      detected: e.cls.detected,
      facts: e.facts,
      conflict: e.conflict,
    }));
    onComplete({ totalFacts, classified });
    // onComplete is a parent callback; we want one fire per `done` flip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-full min-h-0 w-full flex-col gap-4 px-6 py-6"
    >
      <Header
        title={done ? "Vault assembled." : "Ingesting records."}
        files={enriched.length}
        facts={totalFacts}
      />

      <div
        ref={containerRef}
        className="relative flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]"
      >
        <motion.div
          key="graph"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <ConvergeGraph
            width={size.w}
            height={size.h}
            seeds={graphSeeds}
            centerLabel={patientName}
            centerInitials={patientInitials}
          />
        </motion.div>

        <div className="pointer-events-none absolute right-4 top-3 z-20">
          <div className="rounded-full bg-background/85 px-3 py-1 text-[12px] font-medium text-muted-foreground shadow-[var(--shadow-soft)] ring-1 ring-border backdrop-blur">
            {done ? "Vault assembled." : "Building the vault…"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Header({
  title,
  files,
  facts,
}: {
  title: string;
  files: number;
  facts: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span className="eyebrow">New patient · Step 3 of 3</span>
        <h1 className="editorial mt-1.5 text-[26px] leading-tight text-foreground">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Stat label="Records" value={files} />
        <Stat label="Facts" value={facts} accent />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-end">
      <span className="eyebrow">{label}</span>
      <span
        className={cn(
          "mono mt-0.5 text-[22px] font-semibold tabular-nums",
          accent ? "text-violet-500" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
