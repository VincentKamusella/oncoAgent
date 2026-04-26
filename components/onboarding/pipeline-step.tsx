"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  classify,
  isPotentialConflict,
  type Classification,
  type IngestCategory,
} from "@/lib/onboarding/classify";
import { factCount } from "@/lib/onboarding/extract";
import { hash } from "@/lib/onboarding/util";
import type { ClassifiedFile } from "@/lib/onboarding/build-patient";
import { FileChip, type ChipState } from "./file-chip";
import { ConvergeGraph, type GraphSeed } from "./converge-graph";
import { cn } from "@/lib/utils";
import type { DroppedFile } from "./dropzone-step";

type Props = {
  files: DroppedFile[];
  patientName: string;
  patientInitials: string;
  onComplete: (result: { totalFacts: number; classified: ClassifiedFile[] }) => void;
};

type Beat = 0 | 1 | 2 | 3 | 4;
const BEAT_LABELS: Record<Beat, string> = {
  0: "Identifying records…",
  1: "Routing to specialists…",
  2: "Extracting facts and provenance…",
  3: "Building the vault…",
  4: "Vault assembled.",
};

const BEAT_DURATIONS: Record<Beat, number> = {
  0: 1100,
  1: 1700,
  2: 2400,
  3: 2600,
  4: 0,
};

const CHIP_W = 134;
const CHIP_H = 26;
const CHIP_GAP = 6;
const LANE_HEADER = 60;
const MAX_CHIPS_PER_LANE = 5;

type EnrichedFile = {
  id: string;
  file: DroppedFile;
  cls: Classification;
  facts: number;
  conflict: boolean;
};

export function PipelineStep({ files, patientName, patientInitials, onComplete }: Props) {
  const [beat, setBeat] = useState<Beat>(0);
  const [counter, setCounter] = useState(0);
  const [size, setSize] = useState({ w: 1200, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Classify files once.
  const enriched: EnrichedFile[] = useMemo(() => {
    return files.map((f) => {
      const cls = classify(f);
      return {
        id: f.id,
        file: f,
        cls,
        facts: factCount(f, cls.category),
        conflict: isPotentialConflict(f.name),
      };
    });
  }, [files]);

  const totalFacts = useMemo(() => enriched.reduce((acc, f) => acc + f.facts, 0), [enriched]);

  // Group classified files by category, preserving order.
  const byCategory = useMemo(() => {
    const map = new Map<IngestCategory, EnrichedFile[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const e of enriched) map.get(e.cls.category)!.push(e);
    return map;
  }, [enriched]);

  const visibleCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => (byCategory.get(c) ?? []).length > 0),
    [byCategory],
  );

  const graphSeeds: GraphSeed[] = useMemo(
    () =>
      visibleCategories.map((c) => ({
        category: c,
        count: enriched.filter((e) => e.cls.category === c).reduce((acc, e) => acc + e.facts, 0),
      })),
    [visibleCategories, enriched],
  );

  // Measure container size.
  useEffect(() => {
    const measure = () => {
      const r = containerRef.current?.getBoundingClientRect();
      if (r) setSize({ w: Math.max(800, r.width), h: Math.max(420, r.height) });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Auto-advance beats.
  useEffect(() => {
    if (beat >= 4) return;
    const t = setTimeout(
      () => setBeat((b) => (Math.min(4, b + 1) as Beat)),
      BEAT_DURATIONS[beat],
    );
    return () => clearTimeout(t);
  }, [beat]);

  // Ramp counter during beat 2.
  useEffect(() => {
    if (beat !== 2) return;
    const start = performance.now();
    const dur = BEAT_DURATIONS[2];
    const startVal = counter;
    let raf = 0;
    let last = -1;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(startVal + (totalFacts - startVal) * eased);
      if (next !== last) {
        last = next;
        setCounter(next);
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // counter excluded — we read its current value once at start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat, totalFacts]);

  // Snap counter to total once we leave beat 2.
  useEffect(() => {
    if (beat >= 3) setCounter(totalFacts);
  }, [beat, totalFacts]);

  // Layout math.
  const laneCount = Math.max(1, visibleCategories.length);
  const canvasW = size.w;
  const canvasH = size.h;
  const laneGap = 10;
  const laneW = Math.max(120, (canvasW - laneGap * (laneCount + 1)) / laneCount);

  // Pile positions: scattered in upper-left.
  const pilePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; rotate: number }>();
    enriched.forEach((e, i) => {
      const seed = hash(e.id);
      const col = i % 4;
      const row = Math.floor(i / 4) % 6;
      const x = 40 + col * 38 + (seed % 12);
      const y = 20 + row * 22 + ((seed >> 4) % 8);
      const rotate = ((seed >> 8) % 13) - 6;
      map.set(e.id, { x, y, rotate });
    });
    return map;
  }, [enriched]);

  // Lane positions per chip.
  const lanePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; rotate: number; visible: boolean }>();
    visibleCategories.forEach((cat, laneIdx) => {
      const laneX = laneGap + laneIdx * (laneW + laneGap) + (laneW - CHIP_W) / 2;
      const filesInLane = byCategory.get(cat) ?? [];
      filesInLane.forEach((e, chipIdx) => {
        const visible = chipIdx < MAX_CHIPS_PER_LANE;
        const y = LANE_HEADER + chipIdx * (CHIP_H + CHIP_GAP);
        map.set(e.id, { x: laneX, y, rotate: 0, visible });
      });
    });
    return map;
  }, [visibleCategories, byCategory, laneW]);

  // Per-chip extraction state during beat 2.
  const [extractedSet, setExtractedSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (beat !== 2) return;
    setExtractedSet(new Set());
    const dur = BEAT_DURATIONS[2];
    // Stagger extraction across all chips so the scan line "passes" each one.
    const sortedByLaneY: EnrichedFile[] = [];
    visibleCategories.forEach((cat) => {
      const inLane = byCategory.get(cat) ?? [];
      sortedByLaneY.push(...inLane.slice(0, MAX_CHIPS_PER_LANE));
    });

    const timers: ReturnType<typeof setTimeout>[] = [];
    sortedByLaneY.forEach((e) => {
      const inLane = (byCategory.get(e.cls.category) ?? []).slice(0, MAX_CHIPS_PER_LANE);
      const chipIndex = inLane.findIndex((x) => x.id === e.id);
      // Scan progresses top-to-bottom in each lane simultaneously.
      const yFraction = inLane.length > 0 ? (chipIndex + 1) / (inLane.length + 1) : 0;
      const delay = 100 + yFraction * (dur - 600);
      timers.push(
        setTimeout(() => {
          setExtractedSet((prev) => {
            const next = new Set(prev);
            next.add(e.id);
            return next;
          });
        }, delay),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [beat, visibleCategories, byCategory]);

  const chipState = (e: EnrichedFile): ChipState => {
    if (beat === 0) return "pile";
    if (beat === 1) return "lane";
    if (beat === 2) return extractedSet.has(e.id) ? "extracted" : "lane";
    return "fading";
  };

  // Once beat reaches 4, surface result to parent shell.
  useEffect(() => {
    if (beat !== 4) return;
    const classified: ClassifiedFile[] = enriched.map((e) => ({
      fileName: e.file.name,
      category: e.cls.category,
      detected: e.cls.detected,
      facts: e.facts,
      conflict: e.conflict,
    }));
    onComplete({ totalFacts, classified });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-full min-h-0 w-full flex-col gap-4 px-6 py-6"
    >
      <Header beat={beat} counter={counter} totalFacts={totalFacts} files={enriched.length} />

      <div
        ref={containerRef}
        className="relative flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]"
      >
        {/* Lane backgrounds — appear from beat 1 onward, fade out in beat 3. */}
        <AnimatePresence>
          {beat >= 1 && beat <= 2 ? (
            <motion.div
              key="lanes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {visibleCategories.map((cat, i) => {
                const laneX = laneGap + i * (laneW + laneGap);
                const laneFiles = byCategory.get(cat) ?? [];
                const laneFactTotal = laneFiles.reduce((acc, e) => acc + e.facts, 0);
                const meta = CATEGORIES[cat];
                return (
                  <Lane
                    key={cat}
                    x={laneX}
                    width={laneW}
                    height={canvasH - 24}
                    label={meta.label}
                    hint={meta.hint}
                    swatch={meta.swatch}
                    ink={meta.ink}
                    ring={meta.ring}
                    fileCount={laneFiles.length}
                    factCount={laneFactTotal}
                    revealCounts={beat >= 2}
                    scanning={beat === 2}
                  />
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Chips — visible during beats 0–2, fading during 3. */}
        <AnimatePresence>
          {beat <= 3 ? (
            <motion.div
              key="chips"
              initial={{ opacity: 1 }}
              animate={{ opacity: beat === 3 ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: beat === 3 ? 0.45 : 0.2 }}
              className="absolute inset-0"
            >
              {enriched.map((e, idx) => {
                const pile = pilePositions.get(e.id)!;
                const lane = lanePositions.get(e.id)!;
                const inLane = beat >= 1;
                const visible = inLane ? lane.visible : true;
                if (!visible && beat >= 1) return null;
                const pos = inLane ? lane : pile;
                const state = chipState(e);
                const highlight = beat === 2 && extractedSet.has(e.id);
                const conflict = beat === 2 && e.conflict && extractedSet.has(e.id);
                return (
                  <FileChip
                    key={e.id}
                    fileName={e.file.name}
                    category={e.cls.category}
                    state={state}
                    x={pos.x}
                    y={pos.y}
                    rotate={inLane ? 0 : pos.rotate}
                    width={CHIP_W}
                    highlight={highlight}
                    conflict={conflict}
                    delay={beat === 0 ? Math.min(idx * 0.04, 0.8) : 0}
                  />
                );
              })}

              {/* Per-lane fact-count badge that pops in during extraction */}
              {beat === 2
                ? visibleCategories.map((cat, i) => {
                    const laneFiles = byCategory.get(cat) ?? [];
                    const visible = laneFiles.slice(0, MAX_CHIPS_PER_LANE);
                    if (!visible.length) return null;
                    const allExtracted = visible.every((e) => extractedSet.has(e.id));
                    const facts = laneFiles.reduce((a, e) => a + e.facts, 0);
                    if (!allExtracted) return null;
                    const x =
                      laneGap +
                      i * (laneW + laneGap) +
                      (laneW - 88) / 2;
                    const y =
                      LANE_HEADER + Math.min(visible.length, MAX_CHIPS_PER_LANE) * (CHIP_H + CHIP_GAP) + 6;
                    return (
                      <motion.div
                        key={`badge-${cat}`}
                        initial={{ opacity: 0, scale: 0.7, y: y - 4 }}
                        animate={{ opacity: 1, scale: 1, y }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ left: x, top: 0, width: 88 }}
                        className="absolute mono inline-flex items-center justify-center rounded-full bg-violet-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-[var(--shadow-soft)]"
                      >
                        +{facts} facts
                      </motion.div>
                    );
                  })
                : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Convergence graph */}
        <AnimatePresence>
          {beat >= 3 ? (
            <motion.div
              key="graph"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <ConvergeGraph
                width={canvasW}
                height={canvasH}
                seeds={graphSeeds}
                centerLabel={patientName}
                centerInitials={patientInitials}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Subhead overlay */}
        <div className="pointer-events-none absolute right-4 top-3 z-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={beat}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-full bg-background/85 px-3 py-1 text-[12px] font-medium text-muted-foreground shadow-[var(--shadow-soft)] ring-1 ring-border backdrop-blur"
            >
              {BEAT_LABELS[beat]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function Header({
  beat,
  counter,
  totalFacts,
  files,
}: {
  beat: Beat;
  counter: number;
  totalFacts: number;
  files: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span className="eyebrow">New patient · Step 3 of 3</span>
        <h1 className="editorial mt-1.5 text-[26px] leading-tight text-foreground">
          {beat < 4 ? "Ingesting records." : "Vault assembled."}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Stat label="Records" value={files.toString()} />
        <Stat
          label="Facts"
          value={(beat >= 2 ? counter : 0).toString()}
          accent
          pulsing={beat >= 0 && beat <= 2}
          target={totalFacts}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  pulsing,
  target,
}: {
  label: string;
  value: string;
  accent?: boolean;
  pulsing?: boolean;
  target?: number;
}) {
  return (
    <div className="flex flex-col items-end">
      <span className="eyebrow">{label}</span>
      <span
        className={cn(
          "mono mt-0.5 text-[22px] font-semibold tabular-nums",
          accent ? "text-violet-500" : "text-foreground",
          pulsing && "transition-colors",
        )}
      >
        {value}
        {target && Number(value) === 0 ? (
          <span className="ml-1 text-[12px] text-muted-foreground/70">/ {target}</span>
        ) : null}
      </span>
    </div>
  );
}

function Lane({
  x,
  width,
  height,
  label,
  hint,
  swatch,
  ink,
  ring,
  fileCount,
  factCount,
  revealCounts,
  scanning,
}: {
  x: number;
  width: number;
  height: number;
  label: string;
  hint: string;
  swatch: string;
  ink: string;
  ring: string;
  fileCount: number;
  factCount: number;
  revealCounts: boolean;
  scanning: boolean;
}) {
  return (
    <div
      style={{ left: x, width, height }}
      className="absolute top-3 flex flex-col"
    >
      <div
        className={cn(
          "flex flex-col gap-0.5 rounded-t-2xl border border-b-0 px-3 pb-2 pt-2.5 ring-1 ring-inset",
          swatch,
          ink,
          ring,
        )}
        style={{ height: LANE_HEADER - 8 }}
      >
        <span className="text-[12px] font-semibold tracking-tight">{label}</span>
        <span className="text-[10.5px] opacity-80">{hint}</span>
      </div>
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-b-2xl border border-t-0 bg-card/60 ring-1 ring-inset ring-border",
        )}
      >
        {/* Sweep line during extract beat */}
        {scanning && fileCount > 0 ? (
          <motion.div
            aria-hidden
            initial={{ top: 0, opacity: 0 }}
            animate={{ top: ["0%", "92%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.0, ease: [0.45, 0, 0.55, 1], times: [0, 0.1, 0.85, 1] }}
            className="pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent"
            style={{ boxShadow: "0 0 18px rgba(15,31,77,0.35)" }}
          />
        ) : null}

        {/* Empty-state hint when no files */}
        {fileCount === 0 ? (
          <span className="absolute inset-0 flex items-center justify-center text-[10.5px] text-muted-foreground/60">
            —
          </span>
        ) : null}

        {/* Bottom counts */}
        {revealCounts ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
            <span className="mono text-[10.5px] text-muted-foreground/80">
              {fileCount} {fileCount === 1 ? "file" : "files"}
              {factCount > 0 ? ` · ${factCount} facts` : ""}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

