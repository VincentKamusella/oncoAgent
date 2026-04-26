"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { GitPullRequest, Loader2, Sparkles, UploadCloud } from "lucide-react";
import type { Attachment, AttachmentKind, Fact, Specialty } from "@/lib/types";
import { STAGING_CT_RE } from "@/lib/onboarding/linda-phase1";
import { specialtyMeta } from "./specialist-tree";
import { FileRow } from "./file-card";
import { cn } from "@/lib/utils";

const IMAGE_GRADIENTS = [
  "from-slate-700 via-slate-500 to-slate-300",
  "from-rose-300 via-pink-200 to-amber-200",
  "from-slate-900 via-indigo-700 to-violet-500",
  "from-emerald-300 via-teal-200 to-sky-200",
];

function inferKind(file: File): AttachmentKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
    return "table";
  }
  return "report";
}

function fileToAttachment(file: File, specialty: Specialty): Attachment {
  const kind = inferKind(file);
  const id = `att-up-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  const base: Attachment = {
    id,
    patientId: "uploaded",
    specialty,
    kind,
    name: file.name,
    date: new Date().toISOString(),
    source: "Uploaded just now",
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
  };
  if (kind === "image") {
    base.gradient =
      IMAGE_GRADIENTS[Math.floor(Math.random() * IMAGE_GRADIENTS.length)];
  } else if (kind === "pdf") {
    base.pages = 1;
  } else if (kind === "table") {
    base.rows = 4;
    base.cols = 4;
  } else {
    base.excerpt = "Uploaded — no excerpt yet. Agent will summarize on next sync.";
  }
  return base;
}

export function SpecialistFolder({
  patientId,
  specialty,
  attachments: initialAttachments,
  facts,
}: {
  patientId: string;
  specialty: Specialty;
  attachments: Attachment[];
  facts: Fact[];
}) {
  const router = useRouter();
  const meta = specialtyMeta(specialty);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragCounter = useRef(0);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isDragOver, setIsDragOver] = useState(false);
  const [conflictPrId, setConflictPrId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    const next = arr.map((f) => fileToAttachment(f, specialty));
    setAttachments((curr) => [...next, ...curr]);

    for (let i = 0; i < next.length; i++) {
      const att = next[i];
      const mimeType = arr[i].type || undefined;
      fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          specialty: att.specialty,
          name: att.name,
          kind: att.kind,
          sizeKb: att.sizeKb,
          mimeType,
        }),
      }).catch(() => {
        /* mock mode: route 200 no-ops; nothing to surface */
      });
    }

    // Linda-only staging-CT cascade. Show a brief "analyzing" indicator so
    // the agent's classification feels deliberate, then flip to the conflict
    // banner if the route returns a PR id. Minimum 2.2s so the spinner reads.
    if (!arr.some((f) => STAGING_CT_RE.test(f.name))) return;
    setAnalyzing(true);
    setConflictPrId(null);
    const minDelay = new Promise<void>((res) => setTimeout(res, 2200));
    const fetchPromise = fetch(
      `/api/patients/${encodeURIComponent(patientId)}/followup-upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileNames: arr.map((f) => f.name) }),
      },
    );
    Promise.all([fetchPromise, minDelay])
      .then(async ([res]) => {
        if (res.status === 200) {
          const body = (await res.json()) as { prId?: string };
          if (body.prId) {
            setConflictPrId(body.prId);
            router.refresh();
          }
        }
      })
      .catch(() => {
        /* file is already visible; route 204/4xx is harmless */
      })
      .finally(() => {
        setAnalyzing(false);
      });
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragOver(true);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  return (
    <section
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-6 py-6"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <span className="mono text-[10.5px] uppercase tracking-[0.16em] text-violet-600">
            Folder
          </span>
          <h2 className="mt-1 flex items-center gap-2 text-[20px] font-semibold tracking-tight text-foreground">
            <span className="text-muted-foreground">{meta?.icon}</span>
            {meta?.label ?? "Records"}
          </h2>
          <p className="mt-1 max-w-xl text-[13px] leading-snug text-muted-foreground">
            {meta?.blurb ??
              "Files and structured records for this specialty."}
          </p>
        </div>
        <div className="mono text-[11px] text-muted-foreground/80">
          {attachments.length} {attachments.length === 1 ? "file" : "files"}
          <span className="mx-1.5 text-muted-foreground/50">·</span>
          {facts.length} {facts.length === 1 ? "record" : "records"}
        </div>
      </header>

      {analyzing ? (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-[12px] text-foreground/80">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
          <span className="font-medium">
            Analyzing dropped record against existing facts…
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
            <Sparkles className="h-3 w-3 text-violet-500" />
            <span className="mono text-[11px]">agent · scanning</span>
          </span>
        </div>
      ) : conflictPrId ? (
        <Link
          href={`/patients/${encodeURIComponent(patientId)}/prs/${conflictPrId}`}
          className="mt-5 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50/70 px-3 py-2 text-[12px] text-amber-900 transition-colors hover:bg-amber-100"
        >
          <GitPullRequest className="h-3.5 w-3.5" />
          <span className="font-medium">Conflict detected — Review item opened.</span>
          <span className="ml-auto text-amber-800/80 underline-offset-2 hover:underline">
            Open PR →
          </span>
        </Link>
      ) : null}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-[12px] transition-colors",
          isDragOver
            ? "border-violet-400 bg-violet-50/70 text-violet-700"
            : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        )}
      >
        <UploadCloud className="h-3.5 w-3.5" />
        <span>
          {isDragOver
            ? "Drop to add to this folder"
            : "Drop files here, or click to browse"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {attachments.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-[1fr_84px_140px_72px] gap-4 border-b border-border bg-muted/40 px-4 py-2 mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Name</span>
            <span>Type</span>
            <span>Source</span>
            <span>Modified</span>
          </div>
          <ol className="divide-y divide-border">
            {attachments.map((a) => (
              <li key={a.id}>
                <FileRow attachment={a} />
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {facts.length > 0 && (
        <details className="mt-8 group">
          <summary className="flex cursor-pointer items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground">
            <span className="mono uppercase tracking-[0.14em]">
              Structured records
            </span>
            <span className="mono text-[10px] text-muted-foreground/70">
              ({facts.length})
            </span>
          </summary>
          <ol className="mt-3 flex flex-col">
            {facts.map((f) => (
              <li
                key={f.id}
                className="grid grid-cols-[140px_1fr_auto] items-baseline gap-3 border-b border-border/60 py-2 text-[12.5px] last:border-b-0"
              >
                <span className="text-muted-foreground">{f.label}</span>
                <span className="text-foreground/90">{f.value}</span>
                <span className="mono text-[10px] tabular-nums text-muted-foreground/80">
                  {Math.round(f.confidence * 100)}%
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-2 ring-inset ring-violet-300" />
      )}
    </section>
  );
}
