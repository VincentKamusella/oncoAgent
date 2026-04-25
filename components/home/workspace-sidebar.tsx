import Link from "next/link";
import {
  LayoutDashboard,
  FolderOpen,
  Database,
  Settings,
  HelpCircle,
  ChevronsUpDown,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
};

type Props = {
  active?: "overview" | "vaults" | "sources";
};

export function WorkspaceSidebar({ active = "vaults" }: Props) {
  const items: NavItem[] = [
    {
      href: "/",
      label: "Overview",
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: active === "overview",
    },
    {
      href: "/",
      label: "Patient vaults",
      icon: <FolderOpen className="h-4 w-4" />,
      active: active === "vaults",
    },
    {
      href: "/sources",
      label: "Data sources",
      icon: <Database className="h-4 w-4" />,
      active: active === "sources",
    },
  ];

  return (
    <aside className="hidden w-[252px] flex-shrink-0 flex-col rounded-2xl border border-border bg-sidebar shadow-[var(--shadow-soft)] md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-violet-500 shadow-[0_4px_12px_rgba(124,91,247,0.45)]">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
            <path
              d="M12 3l8.5 4.9v8.2L12 21l-8.5-4.9V7.9L12 3z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M12 7.5l4.5 2.6v4.4L12 17.1l-4.5-2.6v-4.4L12 7.5z"
              fill="currentColor"
              fillOpacity="0.4"
            />
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight">oncoAgent</span>
      </div>

      <div className="px-3">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left text-[13px] font-medium hover:bg-secondary"
        >
          <div className="flex items-center gap-2">
            <div className="grid h-5 w-5 place-items-center rounded bg-violet-100 mono text-[10px] font-bold text-violet-700">
              OV
            </div>
            <span>OncoUnit Vienna</span>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <nav className="mt-3 flex flex-col gap-0.5 px-3">
        {items.map((it) => (
          <Link
            key={it.label}
            href={it.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-colors ${
              it.active
                ? "bg-secondary font-medium text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <span className={it.active ? "text-violet-600" : "text-muted-foreground"}>
              {it.icon}
            </span>
            {it.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 px-3 pb-4">
        <Link
          href="#"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Workspace settings
        </Link>
        <Link
          href="#"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </Link>

        <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-rose-100 mono text-[11px] font-semibold text-rose-700">
            JM
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[13px] font-medium">Dr. Julia Müller</span>
            <span className="truncate text-[11.5px] text-muted-foreground">
              j.mueller@oncounit.at
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
