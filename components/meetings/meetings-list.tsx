import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ChevronRight, Video } from "lucide-react";
import type { Meeting } from "@/lib/types";
import { StatusPill } from "@/components/ui/status-pill";
import { FactMono } from "@/components/ui/fact-mono";

const TONE = {
  scheduled: "info",
  live: "warn",
  completed: "active",
} as const;

const LABEL = {
  scheduled: "Upcoming",
  live: "Live now",
  completed: "Completed",
};

const AVATAR_TONE: Record<string, string> = {
  violet: "bg-violet-100 text-violet-700",
  rose: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
};

export function MeetingsList({
  meetings,
  patientId,
}: {
  meetings: Meeting[];
  patientId: string;
}) {
  if (meetings.length === 0) {
    return (
      <div className="surface px-6 py-10 text-center text-[13px] text-muted-foreground">
        No tumor board meetings yet.
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden">
      <ul className="divide-y divide-border">
        {meetings.map((m) => {
          const date = new Date(m.date);
          return (
            <li key={m.id}>
              <Link
                href={`/patients/${patientId}/meetings/${m.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700">
                  <Video className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[14px] font-semibold tracking-tight">
                      {m.title}
                    </h3>
                    <StatusPill tone={TONE[m.status]}>{LABEL[m.status]}</StatusPill>
                  </div>
                  <FactMono className="mt-0.5 text-muted-foreground">
                    {format(date, "EEE · yyyy-MM-dd HH:mm")} ·{" "}
                    {m.status === "completed"
                      ? `${formatDistanceToNowStrict(date, { addSuffix: true })}`
                      : `in ${formatDistanceToNowStrict(date)}`}{" "}
                    · {m.durationMin} min
                  </FactMono>
                </div>

                <div className="flex -space-x-1.5">
                  {m.attendees.slice(0, 4).map((a, i) => {
                    const initials = a.name
                      .split(" ")
                      .map((s) => s[0])
                      .join("")
                      .replace(".", "")
                      .slice(0, 2);
                    return (
                      <div
                        key={i}
                        className={`grid h-6 w-6 place-items-center rounded-full border-2 border-card mono text-[9.5px] font-semibold ${
                          AVATAR_TONE[a.tone ?? "violet"]
                        }`}
                        title={`${a.name} · ${a.role}`}
                      >
                        {initials}
                      </div>
                    );
                  })}
                  {m.attendees.length > 4 && (
                    <div className="grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-muted mono text-[9.5px] font-semibold text-muted-foreground">
                      +{m.attendees.length - 4}
                    </div>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
