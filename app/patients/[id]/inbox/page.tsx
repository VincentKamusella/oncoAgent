import Link from "next/link";
import { notFound } from "next/navigation";
import { GitPullRequest, Check, HelpCircle } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { getPatient, prsForPatient } from "@/lib/data";
import type { PullRequest, AgentQuestion } from "@/lib/types";
import {
  summarizeIssues,
  type IssueSummary,
} from "@/components/prs/derive-issues";
import { PR_STATUS_COLOR, PR_STATUS_ICON } from "@/components/prs/pr-status";
import { QuestionActions } from "@/components/prs/question-actions";

const PRIORITY: Record<PullRequest["status"], number> = {
  conflict: 0,
  "needs-review": 2,
  open: 3,
  merged: 9,
  declined: 9,
};

const SUMMARY_COLOR: Record<IssueSummary["tone"], string> = {
  fail: "#cf222e",
  warn: "#9a6700",
  missing: "#57606a",
  ok: "#1a7f37",
  info: "#0969da",
};

type State = "open" | "closed";

export default async function InboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { id } = await params;
  const { state: stateParam } = await searchParams;
  const state: State = stateParam === "closed" ? "closed" : "open";

  const [patient, prs] = await Promise.all([getPatient(id), prsForPatient(id)]);
  if (!patient) notFound();
  const open = prs
    .filter((p) => p.status !== "merged" && p.status !== "declined")
    .sort((a, b) => {
      const p = PRIORITY[a.status] - PRIORITY[b.status];
      if (p !== 0) return p;
      return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
    });
  const closed = prs
    .filter((p) => p.status === "merged" || p.status === "declined")
    .sort(
      (a, b) =>
        new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
    );

  const questions = patient.agent.needsYou;
  const openCount = open.length + questions.length;

  const visiblePrs = state === "open" ? open : closed;
  const visibleQuestions = state === "open" ? questions : [];
  const isEmpty = visiblePrs.length === 0 && visibleQuestions.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col overflow-y-auto px-8 py-10">
      <span className="eyebrow">Review</span>

      <div className="mt-3 overflow-hidden rounded-md border border-border bg-paper">
        <div className="flex items-center gap-4 border-b border-border bg-muted/40 px-4 py-2.5 text-[12.5px]">
          <FilterChip
            href={`/patients/${id}/inbox`}
            active={state === "open"}
            tone="open"
            count={openCount}
            label="Open"
          />
          <FilterChip
            href={`/patients/${id}/inbox?state=closed`}
            active={state === "closed"}
            tone="closed"
            count={closed.length}
            label="Closed"
          />
          <span className="ml-auto text-muted-foreground/70">
            Sorted by newest
          </span>
        </div>

        {isEmpty ? (
          <p className="px-6 py-12 text-center text-[13px] italic text-muted-foreground">
            {state === "open"
              ? "Nothing needs you right now."
              : "Nothing closed yet."}
          </p>
        ) : (
          <ul className="flex flex-col">
            {visibleQuestions.map((q) => (
              <QuestionRow key={q.id} q={q} />
            ))}
            {visiblePrs.map((pr) => (
              <PRRow key={pr.id} pr={pr} patientId={id} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  tone,
  count,
  label,
}: {
  href: string;
  active: boolean;
  tone: "open" | "closed";
  count: number;
  label: string;
}) {
  const Icon = tone === "open" ? GitPullRequest : Check;
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 tracking-tight transition-colors ${
        active
          ? "font-semibold text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon
        className={`h-3.5 w-3.5 ${
          active && tone === "open" ? "text-[#1a7f37]" : ""
        }`}
        strokeWidth={2.25}
      />
      <span>
        <span className="tabular-nums">{count}</span> {label}
      </span>
    </Link>
  );
}

function PRRow({
  pr,
  patientId,
}: {
  pr: PullRequest;
  patientId: string;
}) {
  const Icon = PR_STATUS_ICON[pr.status];
  const summary = summarizeIssues(pr);

  return (
    <li className="border-t border-border first:border-t-0">
      <div className="group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
        <span
          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center"
          style={{ color: PR_STATUS_COLOR[pr.status] }}
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <Link
              href={`/patients/${patientId}/prs/${pr.id}`}
              className="truncate text-[14.5px] font-semibold leading-snug tracking-tight text-foreground hover:text-[#0969da]"
            >
              {pr.title}
            </Link>
            <span
              className="mono flex-shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: SUMMARY_COLOR[summary.tone] }}
            >
              {summary.label}
            </span>
          </div>

          <p className="mt-1 truncate text-[12px] text-muted-foreground">
            <span className="mono">{pr.id}</span>
            <span> opened </span>
            {formatDistanceToNowStrict(new Date(pr.openedAt), {
              addSuffix: true,
            })}
            <span> by </span>
            <span className="text-foreground/70">{pr.author.name}</span>
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span>{pr.source.kind}</span>
          </p>
        </div>
      </div>
    </li>
  );
}

function QuestionRow({ q }: { q: AgentQuestion }) {
  return (
    <li className="border-t border-border first:border-t-0">
      <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
        <span
          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-[#0969da]"
          aria-hidden
        >
          <HelpCircle className="h-4 w-4" strokeWidth={2.25} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[14.5px] font-semibold leading-snug tracking-tight text-foreground">
              {q.question}
            </h3>
            <span className="mono flex-shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0969da]">
              agent question
            </span>
          </div>

          {q.detail && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {q.detail}
            </p>
          )}

          {q.options && q.options.length > 0 && (
            <QuestionActions questionId={q.id} options={q.options} />
          )}
        </div>
      </div>
    </li>
  );
}
