import { notFound } from "next/navigation";
import { GitPullRequest, AlertOctagon, GitMerge, Eye, Filter } from "lucide-react";
import { getPatient } from "@/lib/mock-data/patients";
import { prsForPatient } from "@/lib/mock-data/prs";
import { PRList } from "@/components/prs/pr-list";

export default async function PRsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = getPatient(id);
  if (!patient) notFound();

  const prs = prsForPatient(id).sort(
    (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
  );

  const counts = {
    open: prs.filter((p) => p.status === "open").length,
    review: prs.filter((p) => p.status === "needs-review").length,
    conflict: prs.filter((p) => p.status === "conflict").length,
    merged: prs.filter((p) => p.status === "merged").length,
  };

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <span className="mono text-[11px] uppercase tracking-[0.16em] text-violet-600">
            Pull requests
          </span>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight">
            Incoming changes
          </h2>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
            New facts arrive as pull requests. Auto-mergeable changes flow in immediately;
            anything that contradicts existing facts or guideline rules is held for human review.
          </p>
        </div>
        <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] hover:bg-secondary">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<GitPullRequest className="h-3.5 w-3.5 text-violet-500" />} label="Open" value={counts.open} />
        <Stat icon={<Eye className="h-3.5 w-3.5 text-amber-500" />} label="Needs review" value={counts.review} />
        <Stat icon={<AlertOctagon className="h-3.5 w-3.5 text-rose-500" />} label="Conflict" value={counts.conflict} highlight={counts.conflict > 0} />
        <Stat icon={<GitMerge className="h-3.5 w-3.5 text-emerald-500" />} label="Merged" value={counts.merged} />
      </div>

      <PRList prs={prs} patientId={id} />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card px-4 py-3 ${
        highlight ? "border-rose-200 shadow-[0_0_0_1px_rgba(239,68,68,0.08)_inset]" : "border-border"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 mono text-[22px] font-semibold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
