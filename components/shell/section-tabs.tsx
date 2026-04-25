"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  GitPullRequest,
  Activity,
  Network,
  CalendarDays,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Section = {
  href: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  countTone?: "active" | "warn" | "conflict";
};

export function SectionTabs({
  patientId,
  prCount,
  conflictCount,
  meetingCount,
}: {
  patientId: string;
  prCount: number;
  conflictCount: number;
  meetingCount: number;
}) {
  const pathname = usePathname();
  const base = `/patients/${patientId}`;

  const sections: Section[] = [
    { href: base, label: "Overview", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { href: `${base}/plan`, label: "Treatment plan", icon: <Activity className="h-3.5 w-3.5" /> },
    { href: `${base}/guidelines`, label: "Guidelines", icon: <Network className="h-3.5 w-3.5" /> },
    {
      href: `${base}/prs`,
      label: "Pull requests",
      icon: <GitPullRequest className="h-3.5 w-3.5" />,
      count: prCount,
      countTone: conflictCount > 0 ? "conflict" : "active",
    },
    { href: `${base}/followup`, label: "Followup", icon: <CalendarDays className="h-3.5 w-3.5" /> },
    {
      href: `${base}/meetings`,
      label: "Meetings",
      icon: <Video className="h-3.5 w-3.5" />,
      count: meetingCount,
      countTone: "active",
    },
  ];

  return (
    <nav className="flex items-center gap-0.5 border-b border-border bg-background/60 px-4 backdrop-blur">
      {sections.map((s) => {
        const isActive =
          s.href === base ? pathname === base : pathname.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={isActive ? "text-violet-600" : "text-muted-foreground"}>
              {s.icon}
            </span>
            {s.label}
            {typeof s.count === "number" && s.count > 0 && (
              <span
                className={cn(
                  "ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 mono text-[10px] font-semibold",
                  s.countTone === "conflict"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-violet-100 text-violet-700"
                )}
              >
                {s.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-[-1px] left-2 right-2 h-[2px] rounded-full bg-violet-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
