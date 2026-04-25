import Link from "next/link";
import {
  Sparkles,
  CircleDot,
  AlertCircle,
  Clock4,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import type { Patient } from "@/lib/types";
import { formatDistanceToNowStrict } from "date-fns";

function refHref(patientId: string, ref?: { kind: string; id: string }) {
  if (!ref) return undefined;
  if (ref.kind === "pr") return `/patients/${patientId}/prs/${ref.id}`;
  if (ref.kind === "meeting") return `/patients/${patientId}/meetings/${ref.id}`;
  return undefined;
}

export function AgentPanel({ patient }: { patient: Patient }) {
  const { now, needsYou, recent } = patient.agent;

  return (
    <aside className="hidden w-[336px] flex-shrink-0 flex-col border-l border-border bg-card/60 xl:flex">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-violet-100">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold">Agent</span>
            <span className="text-[10.5px] text-muted-foreground">
              Watching {patient.name.split(" ")[0]}&apos;s vault
            </span>
          </div>
        </div>
        <StatusPill tone="active">Online</StatusPill>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title="Now" icon={<CircleDot className="h-3 w-3 text-violet-500" />}>
          {now ? (
            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
              <p className="text-[13px] leading-snug text-foreground">{now.action}</p>
              {now.ref && (
                <Link
                  href={refHref(patient.id, now.ref) ?? "#"}
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-violet-700 hover:underline"
                >
                  {now.ref.label} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] italic text-muted-foreground">Idle.</p>
          )}
        </Section>

        <Section
          title="Needs you"
          icon={<AlertCircle className="h-3 w-3 text-amber-500" />}
          count={needsYou.length}
        >
          {needsYou.length === 0 ? (
            <p className="text-[12.5px] italic text-muted-foreground">All clear.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {needsYou.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3"
                >
                  <p className="text-[13px] font-medium leading-snug text-foreground">
                    {q.question}
                  </p>
                  {q.detail && (
                    <p className="mt-1.5 text-[12px] leading-snug text-muted-foreground">
                      {q.detail}
                    </p>
                  )}
                  {q.options && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {q.options.map((opt, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant={i === 0 ? "default" : "outline"}
                          className={`h-7 rounded-md px-2.5 text-[11.5px] ${
                            i === 0
                              ? "bg-violet-500 hover:bg-violet-600"
                              : "bg-card hover:bg-secondary"
                          }`}
                        >
                          <span>{opt}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                  {q.ref && (
                    <Link
                      href={refHref(patient.id, q.ref) ?? "#"}
                      className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-amber-800 hover:underline"
                    >
                      {q.ref.label} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Recent" icon={<Clock4 className="h-3 w-3 text-muted-foreground" />}>
          <ol className="relative ml-1 flex flex-col gap-3 border-l border-border pl-4">
            {recent.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[18px] top-1.5 grid h-2.5 w-2.5 place-items-center rounded-full border-2 border-card bg-violet-300" />
                <p className="text-[12.5px] leading-snug text-foreground">{e.action}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-[10.5px] text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(e.at), { addSuffix: true })}
                  </span>
                  {e.ref && (
                    <Link
                      href={refHref(patient.id, e.ref) ?? "#"}
                      className="text-[10.5px] font-medium text-violet-700 hover:underline"
                    >
                      {e.ref.label}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </aside>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border px-5 py-4 last:border-b-0">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="mono text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        </div>
        {typeof count === "number" && count > 0 && (
          <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-100 px-1 mono text-[10px] font-semibold text-amber-800">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
