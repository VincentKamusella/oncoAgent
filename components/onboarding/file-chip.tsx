"use client";

import { motion } from "motion/react";
import { FileText, Image as ImageIcon, Mail, FileJson, FileSpreadsheet } from "lucide-react";
import { CATEGORIES, type IngestCategory } from "@/lib/onboarding/classify";
import { cn } from "@/lib/utils";

export type ChipState = "pile" | "lane" | "extracted" | "fading";

type Props = {
  fileName: string;
  category: IngestCategory;
  state: ChipState;
  x: number;
  y: number;
  rotate?: number;
  width?: number;
  highlight?: boolean;
  conflict?: boolean;
  delay?: number;
};

export function FileChip({
  fileName,
  category,
  state,
  x,
  y,
  rotate = 0,
  width = 132,
  highlight = false,
  conflict = false,
  delay = 0,
}: Props) {
  const meta = CATEGORIES[category];
  const ext = (fileName.split(".").pop() ?? "").toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        opacity: state === "fading" ? 0 : 1,
        scale: state === "fading" ? 0.6 : highlight ? 1.04 : 1,
        x,
        y,
        rotate,
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 26,
        mass: 0.8,
        delay,
      }}
      style={{ width }}
      className={cn(
        "absolute left-0 top-0 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-medium ring-1 transition-colors",
        state === "lane" || state === "extracted" || state === "fading"
          ? cn(meta.swatch, meta.ink, meta.ring, "ring-1 shadow-[var(--shadow-soft)]")
          : "bg-card text-foreground ring-border shadow-[var(--shadow-soft)]",
        highlight && "shadow-[0_8px_24px_-6px_rgba(15,31,77,0.30)]",
      )}
    >
      <FileIcon ext={ext} className="h-3 w-3 shrink-0 opacity-80" />
      <span className="truncate">{fileName}</span>

      {highlight ? (
        <motion.span
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 rounded-lg bg-white/60"
        />
      ) : null}

      {conflict && state !== "fading" ? (
        <motion.span
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200"
        >
          conflicts with prior records
        </motion.span>
      ) : null}
    </motion.div>
  );
}

function FileIcon({ ext, className }: { ext: string; className?: string }) {
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "dcm") return <ImageIcon className={className} />;
  if (ext === "eml") return <Mail className={className} />;
  if (ext === "json" || ext === "jsonl") return <FileJson className={className} />;
  if (ext === "csv") return <FileSpreadsheet className={className} />;
  return <FileText className={className} />;
}
