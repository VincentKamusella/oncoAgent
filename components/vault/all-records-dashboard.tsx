"use client";

import { useMemo } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  Image as ImageIcon,
  FileText,
  ScrollText,
  Table as TableIcon,
  Sparkles,
} from "lucide-react";
import type {
  Attachment,
  AttachmentKind,
  Fact,
  Patient,
} from "@/lib/types";

type ActivityItem =
  | { id: string; type: "fact"; date: string; label: string; value: string }
  | {
      id: string;
      type: "attachment";
      date: string;
      label: string;
      kind: AttachmentKind;
      source?: string;
    };

const KIND_ICON: Record<AttachmentKind, React.ReactNode> = {
  image: <ImageIcon className="h-3.5 w-3.5" />,
  pdf: <FileText className="h-3.5 w-3.5" />,
  table: <TableIcon className="h-3.5 w-3.5" />,
  report: <ScrollText className="h-3.5 w-3.5" />,
};

const KIND_TONE: Record<AttachmentKind, string> = {
  image: "bg-violet-100 text-violet-700",
  pdf: "bg-rose-100 text-rose-700",
  table: "bg-sky-100 text-sky-700",
  report: "bg-amber-100 text-amber-800",
};

export function AllRecordsDashboard({
  patient,
  facts,
  attachments,
}: {
  patient: Patient;
  facts: Fact[];
  attachments: Attachment[];
}) {
  const activity = useMemo(() => mergeActivity(facts, attachments), [
    facts,
    attachments,
  ]);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-6 py-6">
      <span className="mono text-[10.5px] uppercase tracking-[0.16em] text-violet-600">
        Vault
      </span>
      <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
        {patient.cancerLabel}
      </h2>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
        {patient.diagnosis}
        <span className="mx-2 text-muted-foreground/50">·</span>
        <span className="mono text-[12px] text-foreground/80">
          {patient.staging}
        </span>
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-[480px]">
        <Stat label="Records" value={facts.length} />
        <Stat label="Files" value={attachments.length} />
        <Stat
          label="Last update"
          value={
            activity[0]
              ? formatDistanceToNowStrict(new Date(activity[0].date), {
                  addSuffix: false,
                })
              : "—"
          }
        />
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-violet-500" />
          <span className="mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Recent activity
          </span>
        </div>
        <ol className="mt-3 flex flex-col">
          {activity.slice(0, 8).map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 border-b border-border/60 py-2.5 last:border-b-0"
            >
              {item.type === "attachment" ? (
                <span
                  className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-md ${KIND_TONE[item.kind]}`}
                >
                  {KIND_ICON[item.kind]}
                </span>
              ) : (
                <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700">
                  <Sparkles className="h-3 w-3" />
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[13px] font-medium text-foreground">
                  {item.label}
                </span>
                <span className="truncate text-[11.5px] text-muted-foreground">
                  {item.type === "attachment"
                    ? item.source
                      ? `${item.kind} · ${item.source}`
                      : item.kind
                    : item.value}
                </span>
              </div>
              <span className="mono text-[10.5px] text-muted-foreground/80 whitespace-nowrap">
                {format(new Date(item.date), "MMM d")}
              </span>
            </li>
          ))}
        </ol>
        {activity.length === 0 && (
          <p className="mt-3 text-[12.5px] italic text-muted-foreground">
            No activity yet.
          </p>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2">
      <div className="mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-[16px] font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

function mergeActivity(
  facts: Fact[],
  attachments: Attachment[]
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...attachments.map<ActivityItem>((a) => ({
      id: `a-${a.id}`,
      type: "attachment",
      date: a.date,
      label: a.name,
      kind: a.kind,
      source: a.source,
    })),
    ...facts.map<ActivityItem>((f) => ({
      id: `f-${f.id}`,
      type: "fact",
      date: f.updatedAt,
      label: f.label,
      value: f.value,
    })),
  ];
  return items.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
