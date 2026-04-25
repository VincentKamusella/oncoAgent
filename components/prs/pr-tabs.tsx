import Link from "next/link";
import { MessageSquare, ListChecks, FileText } from "lucide-react";

export type TabKey = "conversation" | "issues" | "source";

const TABS: {
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "conversation", label: "Conversation", Icon: MessageSquare },
  { key: "issues", label: "Issues", Icon: ListChecks },
  { key: "source", label: "Source", Icon: FileText },
];

export function PRTabs({
  basePath,
  active,
  counts,
}: {
  basePath: string;
  active: TabKey;
  counts: Partial<Record<TabKey, number>>;
}) {
  return (
    <nav className="flex items-center gap-0 border-b border-border">
      {TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        const count = counts[key];
        const href =
          key === "conversation" ? basePath : `${basePath}?tab=${key}`;
        return (
          <Link
            key={key}
            href={href}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[12.5px] font-medium tracking-tight transition-colors ${
              isActive
                ? "border-[#0f1f4d] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 ${
                isActive ? "text-foreground/80" : "text-muted-foreground/70"
              }`}
            />
            <span>{label}</span>
            {typeof count === "number" && count > 0 && (
              <span className="inline-flex min-w-[18px] justify-center rounded-full bg-muted px-1.5 text-[10.5px] font-medium tabular-nums text-muted-foreground">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
