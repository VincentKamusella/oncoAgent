"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import type { IngestCategory } from "@/lib/onboarding/classify";

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
  cx: number;
  cy: number;
  r: number;
  ring: 0 | 1 | 2;
  delay: number;
};

type Edge = {
  id: string;
  x: number;
  y: number;
  delay: number;
};

// Same monochromatic slate palette as FactsGraph / AuraGraph so the whole
// app reads as one visual system. Differentiation is by ring depth and size.
const ANCHOR = "#0f1f4d";
const INNER = "#475569";
const MID = "#94A3B8";
const OUTER = "#CBD5E1";

function buildLayout(seeds: GraphSeed[], width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const ringInner = minDim * 0.18;
  const ringMid = minDim * 0.28;
  const ringOuter = minDim * 0.38;

  const total = Math.max(seeds.length, 1);
  const sectorSpan = (Math.PI * 2) / total;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let nodeIdx = 0;
  seeds.forEach((seed, sectorIdx) => {
    const sectorStart = sectorIdx * sectorSpan - Math.PI / 2;
    const cap = Math.min(seed.count, 6);
    for (let i = 0; i < cap; i++) {
      // Distribute across three concentric rings for depth without crowding.
      const ringPos = (i % 3) as 0 | 1 | 2;
      const r =
        ringPos === 0 ? ringInner : ringPos === 1 ? ringMid : ringOuter;
      const inSector = (i + 0.5) / cap;
      const theta = sectorStart + sectorSpan * inSector * 0.8 + 0.08;
      const radius =
        ringPos === 0 ? 4 : ringPos === 1 ? 3 : 2.2;
      const px = cx + Math.cos(theta) * r;
      const py = cy + Math.sin(theta) * r;
      const id = `n-${seed.category}-${i}`;
      nodes.push({
        id,
        cx: px,
        cy: py,
        r: radius,
        ring: ringPos,
        delay: 0.04 * nodeIdx,
      });
      // Only the innermost ring connects with spokes — keeps the visual calm.
      if (ringPos === 0) {
        edges.push({
          id: `e-${id}`,
          x: px,
          y: py,
          delay: 0.04 * nodeIdx + 0.05,
        });
      }
      nodeIdx++;
    }
  });

  return { cx, cy, nodes, edges };
}

function nodeFill(ring: 0 | 1 | 2): string {
  return ring === 0 ? INNER : ring === 1 ? MID : OUTER;
}

export function ConvergeGraph({
  width,
  height,
  seeds,
  centerLabel,
  centerInitials,
}: Props) {
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
          <stop offset="0%" stopColor="rgba(15,31,77,0.10)" />
          <stop offset="55%" stopColor="rgba(15,31,77,0.03)" />
          <stop offset="100%" stopColor="rgba(15,31,77,0)" />
        </radialGradient>
      </defs>

      <motion.circle
        initial={{ opacity: 0, r: 0 }}
        animate={{ opacity: 1, r: Math.min(width, height) * 0.42 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        cx={cx}
        cy={cy}
        fill="url(#vault-glow)"
      />

      {edges.map((e) => (
        <motion.line
          key={e.id}
          x1={cx}
          y1={cy}
          x2={e.x}
          y2={e.y}
          stroke="#94A3B8"
          strokeOpacity={0.28}
          strokeWidth={0.6}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: e.delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}

      <motion.g
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        {nodes.map((n) => (
          <motion.circle
            key={n.id}
            cx={n.cx}
            cy={n.cy}
            r={n.r}
            fill={nodeFill(n.ring)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: n.ring === 2 ? 0.7 : 1, scale: 1 }}
            transition={{ delay: n.delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
          />
        ))}
      </motion.g>

      <motion.circle
        cx={cx}
        cy={cy}
        r={28}
        fill={ANCHOR}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{
          opacity: 1,
          scale: [1, 1.04, 1],
        }}
        transition={{
          opacity: { delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
          scale: {
            delay: 0.7,
            duration: 3.6,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
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
