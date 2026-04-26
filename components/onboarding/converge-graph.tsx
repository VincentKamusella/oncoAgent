"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { CATEGORIES, type IngestCategory } from "@/lib/onboarding/classify";

export type GraphSeed = {
  category: IngestCategory;
  count: number;
};

type Props = {
  width: number;
  height: number;
  seeds: GraphSeed[];
  centerLabel: string;
  centerInitials: string;
};

type Node = {
  id: string;
  category: IngestCategory | "self";
  cx: number;
  cy: number;
  r: number;
  delay: number;
};

type Edge = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
};

const CAT_HEX: Record<IngestCategory, string> = {
  pathology: "#8b5cf6",
  radiology: "#0ea5e9",
  genomics: "#10b981",
  labs: "#f59e0b",
  notes: "#f43f5e",
  communications: "#6366f1",
  operational: "#64748b",
  reference: "#94a3b8",
};

/**
 * Lays out fact-nodes around the patient center using deterministic polar
 * coordinates: each category claims an angular sector, and within that sector
 * nodes spread on two concentric rings.
 */
function buildLayout(seeds: GraphSeed[], width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const ringInner = minDim * 0.18;
  const ringOuter = minDim * 0.32;

  const total = seeds.length || 1;
  const sectorSpan = (Math.PI * 2) / total;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let nodeIdx = 0;
  seeds.forEach((seed, sectorIdx) => {
    const sectorStart = sectorIdx * sectorSpan - Math.PI / 2; // start at top
    const cap = Math.min(seed.count, 7);
    for (let i = 0; i < cap; i++) {
      const ringPos = i % 2;
      const inSector = (i + 0.5) / cap;
      const theta = sectorStart + sectorSpan * inSector * 0.85 + 0.06;
      const r = ringPos === 0 ? ringInner : ringOuter;
      const radius = 2.5 + (i % 3);
      const px = cx + Math.cos(theta) * r;
      const py = cy + Math.sin(theta) * r;
      const id = `n-${seed.category}-${i}`;
      nodes.push({
        id,
        category: seed.category,
        cx: px,
        cy: py,
        r: radius,
        delay: 0.05 * nodeIdx,
      });
      edges.push({
        id: `e-${id}`,
        x1: cx,
        y1: cy,
        x2: px,
        y2: py,
        delay: 0.05 * nodeIdx + 0.05,
      });
      nodeIdx++;
    }
  });

  return { cx, cy, nodes, edges };
}

export function ConvergeGraph({ width, height, seeds, centerLabel, centerInitials }: Props) {
  const { cx, cy, nodes, edges } = useMemo(
    () => buildLayout(seeds, width, height),
    [seeds, width, height],
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0"
      aria-hidden
    >
      <defs>
        <radialGradient id="vault-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(15,31,77,0.18)" />
          <stop offset="60%" stopColor="rgba(15,31,77,0.04)" />
          <stop offset="100%" stopColor="rgba(15,31,77,0)" />
        </radialGradient>
      </defs>

      <motion.circle
        initial={{ opacity: 0, r: 0 }}
        animate={{ opacity: 1, r: Math.min(width, height) * 0.45 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        cx={cx}
        cy={cy}
        fill="url(#vault-glow)"
      />

      {edges.map((e) => (
        <motion.line
          key={e.id}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke="rgba(15,31,77,0.18)"
          strokeWidth={0.7}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: e.delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}

      <motion.g
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        {nodes.map((n) => (
          <motion.circle
            key={n.id}
            cx={n.cx}
            cy={n.cy}
            r={n.r}
            fill={CAT_HEX[n.category as IngestCategory] ?? "#0f1f4d"}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: n.delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
          />
        ))}
      </motion.g>

      <motion.circle
        cx={cx}
        cy={cy}
        r={28}
        fill="#0f1f4d"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill="white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {centerInitials}
      </motion.text>
      <motion.text
        x={cx}
        y={cy + 60}
        textAnchor="middle"
        fontSize="11"
        fontWeight="500"
        fill="#0f1115"
        initial={{ opacity: 0, y: cy + 70 }}
        animate={{ opacity: 1, y: cy + 60 }}
        transition={{ delay: 1.0, duration: 0.4 }}
      >
        {centerLabel}
      </motion.text>
    </svg>
  );
}
