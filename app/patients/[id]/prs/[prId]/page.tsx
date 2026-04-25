import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  GitPullRequest,
  GitMerge,
  AlertOctagon,
  Eye,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { getPatient, prById } from "@/lib/data";
import { PRDiff } from "@/components/prs/pr-diff";
import { PRActions } from "@/components/prs/pr-actions";
import { PR_STATUS_LABEL } from "@/components/prs/pr-status";

const STATUS_GLYPH = {
  open: <GitPullRequest className="h-3.5 w-3.5" />,
  merged: <GitMerge className="h-3.5 w-3.5" />,
  conflict: <AlertOctagon className="h-3.5 w-3.5" />,
  "needs-review": <Eye className="h-3.5 w-3.5" />,
  declined: <XCircle className="h-3.5 w-3.5" />,
};

const STATUS_TEXT_COLOR: Record<string, string> = {
  conflict: "text-[#b91c1c]",
  "needs-review": "text-[#0f1f4d]",
  open: "text-[#0f1f4d]",
  merged: "text-[#15803d]",
  declined: "text-muted-foreground",
};

export default async function PRDetailPage({
  params,
}: {
  params: Promise<{ id: string; prId: string }>;
}) {
  const { id, prId } = await params;
  const patient = await getPatient(id);
  const pr = await prById(prId);
  if (!patient || !pr || pr.patientId !== id) notFound();

  const isConflict = pr.status === "conflict";

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-9 overflow-y-auto px-8 py-10">
      <Link
        href={`/patients/${id}/inbox`}
        className="inline-flex w-max items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to review
      </Link>

      {/* Title block — no card, just type */}
      <header>
        <div className="flex items-center gap-2">
          <span className="mono text-[11px] text-muted-foreground/70">
            {pr.id}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] ${STATUS_TEXT_COLOR[pr.status]}`}
          >
            {STATUS_GLYPH[pr.status]}
            {PR_STATUS_LABEL[pr.status]}
          </span>
        </div>
        <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight text-foreground editorial">
          {pr.title}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          {pr.summary}
        </p>
        <p className="mono mt-4 text-[11.5px] text-muted-foreground/70">
          <span className="text-foreground/70">{pr.author.name}</span>
          <span className="mx-2 text-muted-foreground/40">·</span>
          {pr.author.role}
          <span className="mx-2 text-muted-foreground/40">·</span>
          opened {format(new Date(pr.openedAt), "yyyy-MM-dd HH:mm")}
        </p>
      </header>

      {/* Agent verdict — horizontal stripe, no card */}
      <section
        className="border-l-2 pl-5"
        style={{
          borderColor: isConflict ? "#b91c1c" : "#0f1f4d",
        }}
      >
        <span
          className="mono text-[10.5px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: isConflict ? "#b91c1c" : "#0f1f4d" }}
        >
          Agent verdict
        </span>
        <p className="mt-1.5 text-[14px] leading-relaxed text-foreground">
          {pr.agentVerdict}
        </p>
      </section>

      {/* Source — inline prose, no card */}
      <section>
        <span className="eyebrow">Source</span>
        <p className="mt-2 text-[14px] font-semibold tracking-tight text-foreground">
          {pr.source.label}
        </p>
        <p className="mono mt-1 text-[11.5px] text-muted-foreground/80">
          {pr.source.kind}
          {pr.source.author && (
            <>
              <span className="mx-2 text-muted-foreground/40">·</span>
              {pr.source.author}
            </>
          )}
        </p>
        {pr.source.excerpt && (
          <blockquote className="mt-4 border-l border-border pl-4 text-[13.5px] italic leading-relaxed text-foreground/75">
            {pr.source.excerpt}
          </blockquote>
        )}
      </section>

      {/* Diff */}
      <section>
        <div className="flex items-baseline justify-between">
          <span className="eyebrow">Proposed changes</span>
          <span className="mono text-[11.5px] text-muted-foreground/80">
            {pr.proposed.length}
            {pr.conflicts.length > 0 && (
              <>
                <span className="mx-2 text-muted-foreground/40">·</span>
                <span className="font-semibold text-[#b91c1c]">
                  {pr.conflicts.length} conflict
                  {pr.conflicts.length === 1 ? "" : "s"}
                </span>
              </>
            )}
          </span>
        </div>
        <div className="mt-4">
          <PRDiff deltas={pr.proposed} conflicts={pr.conflicts} />
        </div>
      </section>

      <PRActions pr={pr} />
    </div>
  );
}
