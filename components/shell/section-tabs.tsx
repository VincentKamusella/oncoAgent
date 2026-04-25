"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder, GitPullRequest, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Section = {
  href: string;
  label: string;
  icon: React.ReactNode;
  matches?: (path: string, base: string) => boolean;
  count?: number;
  countTone?: "active" | "conflict";
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

  void meetingCount;

  const sections: Section[] = [
    {
      href: base,
      label: "Vault",
      icon: <Folder className="h-3.5 w-3.5" />,
      matches: (p, b) => p === b,
    },
    {
      href: `${base}/inbox`,
      label: "Review",
      icon: <GitPullRequest className="h-3.5 w-3.5" />,
      count: prCount,
      countTone: conflictCount > 0 ? "conflict" : "active",
      matches: (p, b) =>
        p.startsWith(`${b}/inbox`) || p.startsWith(`${b}/prs`),
    },
    {
      href: `${base}/board`,
      label: "Board",
      icon: <Users2 className="h-3.5 w-3.5" />,
      matches: (p, b) =>
        p.startsWith(`${b}/board`) || p.startsWith(`${b}/meetings`),
    },
  ];

  return (
    <nav className="flex h-12 flex-shrink-0 items-center gap-1.5 border-b border-border bg-background/60 px-3 backdrop-blur">
      {sections.map((s) => {
        const isActive = s.matches
          ? s.matches(pathname, base)
          : pathname.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium tracking-tight transition-colors",
              isActive
                ? "bg-card text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.06),0_0_0_1px_rgba(15,23,42,0.04)]"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex-shrink-0",
                isActive ? "text-foreground/80" : "text-muted-foreground/70"
              )}
            >
              {s.icon}
            </span>
            <span>{s.label}</span>
            {typeof s.count === "number" && s.count > 0 && (
              <span
                className={cn(
                  "ml-0.5 tabular-nums text-[11px] font-normal",
                  s.countTone === "conflict"
                    ? "text-rose-500"
                    : isActive
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60"
                )}
              >
                {s.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
