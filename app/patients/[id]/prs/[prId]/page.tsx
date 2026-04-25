import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  GitPullRequest,
  GitMerge,
  AlertOctagon,
  Eye,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { getPatient, prById } from "@/lib/data";
import { StatusPill } from "@/components/ui/status-pill";
import { FactMono } from "@/components/ui/fact-mono";
import { PRDiff } from "@/components/prs/pr-diff";
import { PRActions } from "@/components/prs/pr-actions";
import { PR_STATUS_LABEL, PR_STATUS_TONE } from "@/components/prs/pr-status";

const ICON = {
  open: <GitPullRequest className="h-4 w-4 text-violet-600" />,
  merged: <GitMerge className="h-4 w-4 text-emerald-600" />,
  conflict: <AlertOctagon className="h-4 w-4 text-rose-600" />,
  "needs-review": <Eye className="h-4 w-4 text-amber-600" />,
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

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 overflow-y-auto px-6 py-6">
      <Link
        href={`/patients/${id}/inbox`}
        className="inline-flex w-max items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to inbox
      </Link>

      {/* hero */}
      <header className="surface flex flex-col gap-3 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-muted">
            {ICON[pr.status]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <FactMono className="text-muted-foreground/80">{pr.id}</FactMono>
              <StatusPill tone={PR_STATUS_TONE[pr.status]}>
                {PR_STATUS_LABEL[pr.status]}
              </StatusPill>
            </div>
            <h2 className="mt-1.5 text-[20px] font-semibold leading-tight tracking-tight">
              {pr.title}
            </h2>
            <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
              {pr.summary}
            </p>
            <div className="mono mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
              <span>opened {format(new Date(pr.openedAt), "yyyy-MM-dd HH:mm")}</span>
              <span className="text-muted-foreground/50">·</span>
              <span>by {pr.author.name}</span>
              <span className="text-muted-foreground/50">·</span>
              <span>{pr.author.role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* agent verdict */}
      <section className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
        <div className="flex items-start gap-2.5">
          <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-violet-100">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mono text-[10.5px] font-semibold uppercase tracking-wider text-violet-700">
              Agent verdict
            </p>
            <p className="mt-1 text-[13px] leading-snug text-foreground">
              {pr.agentVerdict}
            </p>
          </div>
        </div>
      </section>

      {/* source */}
      <section className="surface px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="mono text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Source
          </div>
          <FactMono className="text-muted-foreground/80">
            {pr.source.kind}
          </FactMono>
        </div>
        <p className="mt-2 text-[13px] font-medium text-foreground">
          {pr.source.label}
        </p>
        {pr.source.author && (
          <p className="text-[11.5px] text-muted-foreground">{pr.source.author}</p>
        )}
        {pr.source.excerpt && (
          <blockquote className="mt-2 rounded-md border-l-2 border-violet-300 bg-violet-50/40 p-2.5 text-[12.5px] leading-snug text-foreground/80">
            {pr.source.excerpt}
          </blockquote>
        )}
      </section>

      {/* diff with inline conflicts */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
            Proposed changes
          </h3>
          <span className="mono text-[11.5px] text-muted-foreground">
            {pr.proposed.length} change{pr.proposed.length === 1 ? "" : "s"}
            {pr.conflicts.length > 0 && (
              <>
                {" · "}
                <span className="font-medium text-rose-700">
                  {pr.conflicts.length} conflict
                  {pr.conflicts.length === 1 ? "" : "s"}
                </span>
              </>
            )}
          </span>
        </div>
        <PRDiff deltas={pr.proposed} conflicts={pr.conflicts} />
      </section>

      <PRActions pr={pr} />
    </div>
  );
}
