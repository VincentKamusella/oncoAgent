import { format, isBefore, isSameDay } from "date-fns";
import {
  ScanLine,
  FlaskConical,
  Stethoscope,
  Users,
  Check,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { FollowupItem } from "@/lib/types";
import { StatusPill } from "@/components/ui/status-pill";
import { FactMono } from "@/components/ui/fact-mono";
import { cn } from "@/lib/utils";

const TYPE_META: Record<
  FollowupItem["type"],
  { label: string; icon: React.ReactNode; bg: string; fg: string }
> = {
  imaging: {
    label: "Imaging",
    icon: <ScanLine className="h-3.5 w-3.5" />,
    bg: "bg-violet-100",
    fg: "text-violet-700",
  },
  lab: {
    label: "Lab",
    icon: <FlaskConical className="h-3.5 w-3.5" />,
    bg: "bg-emerald-100",
    fg: "text-emerald-700",
  },
  visit: {
    label: "Visit",
    icon: <Stethoscope className="h-3.5 w-3.5" />,
    bg: "bg-rose-100",
    fg: "text-rose-700",
  },
  discussion: {
    label: "Discussion",
    icon: <Users className="h-3.5 w-3.5" />,
    bg: "bg-amber-100",
    fg: "text-amber-700",
  },
};

const STATUS_TONE = {
  scheduled: "info",
  completed: "active",
  overdue: "conflict",
} as const;

const STATUS_ICON = {
  scheduled: <Clock className="h-3 w-3" />,
  completed: <Check className="h-3 w-3" />,
  overdue: <AlertTriangle className="h-3 w-3" />,
};

const TODAY = new Date("2026-04-25T00:00:00Z");

export function FollowupTimeline({ items }: { items: FollowupItem[] }) {
  if (items.length === 0) {
    return (
      <div className="surface px-6 py-10 text-center text-[13px] text-muted-foreground">
        No followup items scheduled.
      </div>
    );
  }

  return (
    <ol className="relative ml-4 flex flex-col gap-4 border-l-2 border-dashed border-border pl-6">
      {items.map((it) => {
        const meta = TYPE_META[it.type];
        const date = new Date(it.date);
        const isPast = isBefore(date, TODAY) && !isSameDay(date, TODAY);
        const isToday = isSameDay(date, TODAY);
        const dotColor =
          it.status === "completed"
            ? "#10B981"
            : isToday
            ? "#0f1f4d"
            : isPast
            ? "#EF4444"
            : "#7587b0";

        return (
          <li key={it.id} className="relative">
            <span
              className={cn(
                "absolute -left-[35px] top-3 grid h-4 w-4 place-items-center rounded-full border-2 border-card",
                isToday && "ring-4 ring-violet-100"
              )}
              style={{ background: dotColor }}
            />

            <div
              className={cn(
                "surface flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
                isToday && "border-violet-200 ring-1 ring-violet-100"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${meta.bg} ${meta.fg}`}
                >
                  {meta.icon}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold tracking-tight">
                      {it.label}
                    </span>
                    <span className="rounded-md bg-muted/70 px-1.5 py-0.5 mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {meta.label}
                    </span>
                    <StatusPill tone={STATUS_TONE[it.status]}>
                      <span className="flex items-center gap-1">
                        {STATUS_ICON[it.status]}
                        {it.status === "scheduled"
                          ? isToday
                            ? "Today"
                            : "Scheduled"
                          : it.status === "completed"
                          ? "Completed"
                          : "Overdue"}
                      </span>
                    </StatusPill>
                  </div>
                  <FactMono className="mt-1 text-muted-foreground">
                    {format(date, "EEE · yyyy-MM-dd · HH:mm")}
                  </FactMono>
                  {it.prep && (
                    <p className="mt-1.5 text-[12px] leading-snug text-muted-foreground">
                      {it.prep}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
