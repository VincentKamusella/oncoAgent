"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, FileText, FolderOpen, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DroppedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
};

type Props = {
  files: DroppedFile[];
  onFilesChange: (files: DroppedFile[]) => void;
  onBack: () => void;
  onIngest: () => void;
};

/** Recursively walk a DataTransferItem (file or directory) and yield File objects. */
async function walkEntry(entry: FileSystemEntry, out: File[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((res, rej) =>
      (entry as FileSystemFileEntry).file(res, rej),
    );
    out.push(file);
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const entries: FileSystemEntry[] = await new Promise((res, rej) => {
      const all: FileSystemEntry[] = [];
      const readBatch = () =>
        reader.readEntries((batch) => {
          if (!batch.length) return res(all);
          all.push(...batch);
          readBatch();
        }, rej);
      readBatch();
    });
    await Promise.all(entries.map((e) => walkEntry(e, out)));
  }
}

export function DropzoneStep({ files, onFilesChange, onBack, onIngest }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [reading, setReading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Cursor-light: track pointer relative to the drop zone for an animated radial gradient
  const cursorX = useMotionValue(0.5);
  const cursorY = useMotionValue(0.2);
  const lightX = useSpring(cursorX, { stiffness: 80, damping: 18, mass: 0.6 });
  const lightY = useSpring(cursorY, { stiffness: 80, damping: 18, mass: 0.6 });

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = dropRef.current?.getBoundingClientRect();
    if (!rect) return;
    cursorX.set((e.clientX - rect.left) / rect.width);
    cursorY.set((e.clientY - rect.top) / rect.height);
  };

  const handleFiles = useCallback(
    (incoming: File[]) => {
      const merged: DroppedFile[] = [...files];
      for (const f of incoming) {
        // Skip macOS metadata noise.
        if (f.name === ".DS_Store") continue;
        if (f.name.startsWith("._")) continue;
        merged.push({
          id: `${f.name}-${f.size}-${f.lastModified}`,
          name: f.name,
          size: f.size,
          type: f.type,
        });
      }
      // De-dupe by id.
      const seen = new Set<string>();
      const unique = merged.filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)));
      onFilesChange(unique);
    },
    [files, onFilesChange],
  );

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    setReading(true);
    try {
      // Prefer DataTransferItemList — the only way to traverse dropped folders.
      // Snapshot entries synchronously before any await; the items list is
      // released the moment this handler returns.
      const items = e.dataTransfer.items;
      const entries: FileSystemEntry[] = [];
      if (items && items.length) {
        for (let i = 0; i < items.length; i++) {
          const it = items[i] as DataTransferItem & {
            webkitGetAsEntry?: () => FileSystemEntry | null;
          };
          if (it.kind !== "file") continue;
          const entry = it.webkitGetAsEntry?.();
          if (entry) entries.push(entry);
        }
      }
      if (entries.length) {
        const out: File[] = [];
        await Promise.all(entries.map((entry) => walkEntry(entry, out)));
        handleFiles(out);
      } else {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    } finally {
      setReading(false);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) setDragOver(false);
  };

  const onPickFile = (input: HTMLInputElement) => {
    if (!input.files) return;
    handleFiles(Array.from(input.files));
    input.value = "";
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  // Group by extension for the tray summary.
  const byExt = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of files) {
      const ext = (f.name.split(".").pop() ?? "?").toLowerCase();
      map.set(ext, (map.get(ext) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [files]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-0 w-full flex-col gap-5 overflow-y-auto px-6 py-6"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="eyebrow">New patient · Step 2 of 3</span>
          <h1 className="editorial mt-2 text-[28px] leading-tight text-foreground">
            Drop the records.
          </h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
            Pathology, imaging, labs, notes, communications. Drop the folder — every file is routed
            to its specialist and indexed with provenance.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-1.5 text-[12.5px] text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
      </div>

      <motion.div
        ref={dropRef}
        onPointerMove={onPointerMove}
        onDragEnter={onDragOver}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        animate={{
          scale: dragOver ? 1.005 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative flex min-h-[34vh] flex-1 items-center justify-center overflow-hidden rounded-3xl bg-card",
          "transition-shadow duration-200",
          dragOver
            ? "shadow-[0_28px_80px_-20px_rgba(15,31,77,0.35),inset_0_0_0_1px_rgba(15,31,77,0.4)]"
            : "shadow-[var(--shadow-soft)]",
        )}
      >
        <motion.div
          aria-hidden
          style={{
            background:
              "radial-gradient(420px circle at calc(var(--lx) * 100%) calc(var(--ly) * 100%), rgba(15,31,77,0.08), transparent 60%)",
            // @ts-expect-error CSS custom props with motion values
            "--lx": lightX,
            "--ly": lightY,
          }}
          className="pointer-events-none absolute inset-0"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div
            animate={{ y: dragOver ? -6 : 0, scale: dragOver ? 1.04 : 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl ring-1 transition-colors",
              dragOver
                ? "bg-violet-500/15 text-violet-600 ring-violet-500/30"
                : "bg-muted text-muted-foreground ring-border",
            )}
          >
            <Upload className="h-5 w-5" />
          </motion.div>
          <h2 className="mt-4 text-[16px] font-semibold tracking-tight text-foreground">
            {dragOver ? "Release to ingest" : "Drop a folder, or any mix of files"}
          </h2>
          <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
            PDF · DICOM · PNG · CSV · JSON · EML · Markdown — we&apos;ll classify and route automatically.
          </p>

          <div className="mt-5 inline-flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium text-foreground shadow-[var(--shadow-soft)] hover:bg-muted">
              <FileText className="h-3.5 w-3.5" />
              Browse files
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => onPickFile(e.currentTarget)}
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium text-foreground shadow-[var(--shadow-soft)] hover:bg-muted">
              <FolderOpen className="h-3.5 w-3.5" />
              Browse folder
              <input
                type="file"
                hidden
                // webkitdirectory enables folder selection in Chrome / Safari / Edge.
                {...{ webkitdirectory: "", directory: "" }}
                onChange={(e) => onPickFile(e.currentTarget)}
              />
            </label>
          </div>
        </div>

        {reading ? (
          <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-[var(--shadow-soft)] ring-1 ring-border backdrop-blur">
            <Sparkles className="h-3 w-3 text-violet-500" />
            Reading folder…
          </div>
        ) : null}
      </motion.div>

      <div className="flex min-h-[100px] flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="eyebrow">Loaded</span>
            <p className="mt-0.5 text-[14px] font-semibold text-foreground">
              {files.length} {files.length === 1 ? "record" : "records"}
              {byExt.length ? (
                <span className="ml-2 mono text-[12px] font-normal text-muted-foreground">
                  {byExt.map(([ext, n]) => `${n} ${ext.toUpperCase()}`).join(" · ")}
                </span>
              ) : null}
            </p>
          </div>
          <Button
            size="lg"
            disabled={files.length === 0}
            onClick={onIngest}
            className="gap-1.5 bg-violet-500 px-4 text-[13px] font-medium hover:bg-violet-600"
          >
            Ingest
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {files.length > 0 ? (
          <div className="grid grid-cols-1 gap-1.5 rounded-2xl border border-border bg-card p-3 sm:grid-cols-2 xl:grid-cols-3">
            {files.slice(0, 24).map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: Math.min(i * 0.04, 0.6),
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition-colors hover:bg-muted/60"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{f.name}</span>
                <span className="ml-auto mono text-[11px] text-muted-foreground">
                  {formatSize(f.size)}
                </span>
                <button
                  onClick={() => removeFile(f.id)}
                  className="ml-1 hidden h-4 w-4 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground group-hover:flex"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
            {files.length > 24 ? (
              <span className="col-span-full mono text-center text-[11px] text-muted-foreground">
                + {files.length - 24} more
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
