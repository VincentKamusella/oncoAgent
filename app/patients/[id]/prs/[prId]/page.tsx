import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { getPatient, prById } from "@/lib/data";
import { PRActions } from "@/components/prs/pr-actions";
import { IssueRow } from "@/components/prs/issue-row";
import { CommentCard } from "@/components/prs/comment-card";
import { StatusPill } from "@/components/prs/status-pill";
import { PRTabs, type TabKey } from "@/components/prs/pr-tabs";
import { deriveIssues } from "@/components/prs/derive-issues";

const VALID_TABS: readonly TabKey[] = ["conversation", "issues", "source"];

const isTabKey = (value: unknown): value is TabKey =>
  VALID_TABS.includes(value as TabKey);

export default async function PRDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; prId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id, prId } = await params;
  const { tab: tabParam } = await searchParams;

  const [patient, pr] = await Promise.all([getPatient(id), prById(prId)]);
  if (!patient || !pr || pr.patientId !== id) notFound();

  const issues = deriveIssues(pr);
  const tab: TabKey = isTabKey(tabParam) ? tabParam : "conversation";
  const basePath = `/patients/${id}/prs/${pr.id}`;

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 overflow-y-auto px-8 py-8">
      <Link
        href={`/patients/${id}/inbox`}
        className="inline-flex w-max items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to review
      </Link>

      <header className="flex flex-col gap-3 border-b border-border pb-5">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground editorial">
          {pr.title}{" "}
          <span className="font-normal text-muted-foreground/70">
            #{pr.id}
          </span>
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <StatusPill status={pr.status} />
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground/80">
              {pr.author.name}
            </span>{" "}
            wants to update <Chip>vault</Chip> from <Chip>{pr.source.label}</Chip>
            <span className="mx-2 text-muted-foreground/40">·</span>
            opened{" "}
            {formatDistanceToNowStrict(new Date(pr.openedAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </header>

      <PRTabs
        basePath={basePath}
        active={tab}
        counts={{ conversation: 1, issues: issues.length }}
      />

      {tab === "conversation" && (
        <CommentCard author="agent" at={pr.openedAt} role="auto-review">
          <p>{pr.agentVerdict}</p>
          {pr.summary && (
            <p className="mt-3 text-muted-foreground">{pr.summary}</p>
          )}
        </CommentCard>
      )}

      {tab === "issues" && (
        <section>
          {issues.length === 0 ? (
            <p className="text-[13px] italic text-muted-foreground">
              Nothing flagged.
            </p>
          ) : (
            <ul className="flex flex-col">
              {issues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} />
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "source" && (
        <section>
          <p className="text-[15px] font-semibold tracking-tight text-foreground">
            {pr.source.label}
          </p>
          <p className="mono mt-1 text-[12px] text-muted-foreground">
            {pr.source.kind}
            {pr.source.author && (
              <>
                <span className="mx-2 text-muted-foreground/40">·</span>
                {pr.source.author}
              </>
            )}
          </p>
          {pr.source.excerpt && (
            <blockquote className="mt-4 border-l-2 border-border pl-4 text-[13.5px] italic leading-relaxed text-foreground/75">
              {pr.source.excerpt}
            </blockquote>
          )}
        </section>
      )}

      <PRActions pr={pr} />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[12px] font-semibold text-foreground/80">
      {children}
    </span>
  );
}
