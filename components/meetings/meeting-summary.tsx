import Link from "next/link";
import { Sparkles, GitPullRequest, ArrowRight } from "lucide-react";
import type { Meeting } from "@/lib/types";

export function MeetingSummary({
  meeting,
  patientId,
  prTitles,
}: {
  meeting: Meeting;
  patientId: string;
  prTitles: { id: string; title: string }[];
}) {
  return (
    <aside className="flex flex-col gap-4">
      <section className="surface px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-violet-100">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <span className="mono text-[10.5px] font-semibold uppercase tracking-wider text-violet-700">
            Agent summary
          </span>
        </div>
        {meeting.summary ? (
          <p className="mt-3 text-[13px] leading-relaxed text-foreground/90">
            {meeting.summary}
          </p>
        ) : (
          <p className="mt-3 text-[13px] italic text-muted-foreground">
            Not yet summarized.
          </p>
        )}
      </section>

      {prTitles.length > 0 && (
        <section className="surface px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-emerald-100">
              <GitPullRequest className="h-3.5 w-3.5 text-emerald-700" />
            </div>
            <span className="mono text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">
              Proposed PRs
            </span>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {prTitles.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/patients/${patientId}/prs/${p.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 hover:bg-secondary/40"
                >
                  <span className="text-[13px] font-medium leading-snug text-foreground">
                    {p.title}
                  </span>
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="surface px-5 py-4">
        <span className="mono text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          Attendees
        </span>
        <ul className="mt-2 flex flex-col gap-1.5">
          {meeting.attendees.map((a, i) => (
            <li
              key={i}
              className="flex items-center justify-between text-[12.5px]"
            >
              <span className="font-medium">{a.name}</span>
              <span className="text-muted-foreground">{a.role}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
