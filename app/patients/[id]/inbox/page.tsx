import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GitMerge,
  AlertOctagon,
  Eye,
  GitPullRequest,
  XCircle,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getPatient, prsForPatient, followupForPatient } from "@/lib/data";
import type { PullRequest, AgentQuestion } from "@/lib/types";

const TODAY = new Date("2026-04-25T00:00:00Z");

const PRIORITY: Record<PullRequest["status"], number> = {
  conflict: 0,
  "needs-review": 2,
  open: 3,
  merged: 9,
  declined: 9,
};

export default async function InboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const prs = await prsForPatient(id);

  const open = prs
    .filter((p) => p.status !== "merged" && p.status !== "declined")
    .sort((a, b) => {
      const p = PRIORITY[a.status] - PRIORITY[b.status];
      if (p !== 0) return p;
      return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
    });

  const closed = prs
    .filter((p) => p.status === "merged" || p.status === "declined")
    .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());

  const questions = patient.agent.needsYou;

  const followups = await followupForPatient(id);
  const upcoming = followups
    .filter((i) => i.status === "scheduled" && new Date(i.date) >= TODAY)
    .slice(0, 6);

  const needsCount = open.length + questions.length;

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col overflow-y-auto px-8 py-10">
      <span className="eyebrow">Review</span>
      <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-foreground editorial">
        {needsCount === 0 ? (
          <>Nothing needs you right now.</>
        ) : (
          <>
            <span className="tabular-nums">{needsCount}</span>{" "}
            {needsCount === 1 ? "thing needs" : "things need"} you.
          </>
        )}
      </h1>

      {needsCount > 0 && (
        <ul className="mt-8 flex flex-col">
          {questions.map((q) => (
            <QuestionRow key={q.id} q={q} />
          ))}
          {open.map((pr) => (
            <PRRow key={pr.id} pr={pr} patientId={id} />
          ))}
        </ul>
      )}

      {closed.length > 0 && (
        <section className="mt-14">
          <span className="eyebrow">Recent</span>
          <ul className="mt-3 flex flex-col">
            {closed.map((pr) => (
              <RecentRow key={pr.id} pr={pr} patientId={id} />
            ))}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mt-14">
          <span className="eyebrow">Watching</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {upcoming.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-paper px-2.5 py-1 text-[12px] text-muted-foreground"
              >
                <Clock className="h-3 w-3" />
                <span className="text-foreground/80">{item.label}</span>
                <span className="mono text-[11px] text-muted-foreground/70">
                  {format(new Date(item.date), "MMM d")}
                </span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PRRow({ pr, patientId }: { pr: PullRequest; patientId: string }) {
  const isConflict = pr.status === "conflict";
  const Icon = isConflict
    ? AlertOctagon
    : pr.status === "needs-review"
      ? Eye
      : GitPullRequest;

  return (
    <li className="border-t border-border first:border-t-0">
      <Link
        href={`/patients/${patientId}/prs/${pr.id}`}
        className="group flex items-start gap-5 py-5 transition-colors"
      >
        <span
          className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center"
          style={{ color: isConflict ? "#b91c1c" : "#0f1f4d" }}
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[15.5px] font-semibold leading-snug tracking-tight text-foreground">
              {pr.title}
            </h3>
            <span className="mono flex-shrink-0 text-[11px] text-muted-foreground/70">
              {formatDistanceToNowStrict(new Date(pr.openedAt), { addSuffix: true })}
            </span>
          </div>

          <p className="mt-1 text-[12.5px] text-muted-foreground">
            <span className="text-foreground/70">{pr.author.name}</span>
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span>{pr.author.role}</span>
          </p>

          <p
            className={`mt-3 text-[13.5px] leading-relaxed ${
              isConflict ? "text-[#7f1d1d]" : "text-foreground/80"
            }`}
          >
            {pr.agentVerdict}
          </p>

          <div className="mt-3 flex items-center gap-4 text-[11.5px]">
            <span className="mono text-muted-foreground/70">
              {pr.proposed.length} change{pr.proposed.length === 1 ? "" : "s"}
              {pr.conflicts.length > 0 && (
                <>
                  <span className="mx-1.5 text-muted-foreground/40">·</span>
                  <span className="font-semibold text-[#b91c1c]">
                    {pr.conflicts.length} conflict
                    {pr.conflicts.length === 1 ? "" : "s"}
                  </span>
                </>
              )}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-[#0f1f4d] transition-transform group-hover:translate-x-0.5">
              Open diff <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function QuestionRow({ q }: { q: AgentQuestion }) {
  return (
    <li className="border-t border-border first:border-t-0">
      <div className="flex items-start gap-5 py-5">
        <span
          className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center"
          style={{ color: "#0f1f4d" }}
        >
          <span className="text-[15px] font-semibold leading-none">?</span>
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-[15.5px] font-semibold leading-snug tracking-tight text-foreground">
            {q.question}
          </h3>
          {q.detail && (
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              {q.detail}
            </p>
          )}
          {q.options && q.options.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {q.options.map((o, i) => (
                <button
                  key={i}
                  type="button"
                  className={
                    i === 0
                      ? "h-8 rounded-md bg-[#0f1f4d] px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-[#0a1740]"
                      : "h-8 rounded-md border border-border bg-paper px-3 text-[12.5px] font-medium text-foreground/80 transition-colors hover:bg-muted/60"
                  }
                >
                  {o}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function RecentRow({ pr, patientId }: { pr: PullRequest; patientId: string }) {
  const isMerged = pr.status === "merged";
  const Icon = isMerged ? GitMerge : XCircle;
  return (
    <li className="border-t border-border/60 first:border-t-0">
      <Link
        href={`/patients/${patientId}/prs/${pr.id}`}
        className="flex items-center gap-3 py-2.5 text-[12.5px] text-muted-foreground/90 transition-colors hover:text-foreground"
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
        <span className="flex-1 truncate text-foreground/80">{pr.title}</span>
        <span className="mono flex-shrink-0 text-[11px] text-muted-foreground/60">
          {formatDistanceToNowStrict(new Date(pr.openedAt), { addSuffix: true })}
        </span>
      </Link>
    </li>
  );
}
