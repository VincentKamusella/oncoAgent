"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Plus, Search } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { Input } from "@/components/ui/input";
import { patients } from "@/lib/mock-data/patients";
import { cn } from "@/lib/utils";

const STATUS_GROUPS: { label: string; status: "active" | "surveillance" | "archived" }[] = [
  { label: "Active", status: "active" },
  { label: "Surveillance", status: "surveillance" },
];

export function PatientSidebar({ activePatientId }: { activePatientId?: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[260px] flex-shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-4">
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
      </Link>

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

      <div className="mt-3 px-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients…"
            className="h-8 rounded-md border-border bg-background pl-7 text-[12.5px] shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-violet-200"
          />
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="mono text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Patients
          </span>
          <button
            type="button"
            className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {STATUS_GROUPS.map((g) => {
          const groupPatients = patients.filter((p) => p.status === g.status);
          if (!groupPatients.length) return null;
          return (
            <div key={g.status} className="mt-2">
              <div className="px-2 pb-1 text-[10.5px] uppercase tracking-wider text-muted-foreground/80">
                {g.label} · {groupPatients.length}
              </div>
              <div className="flex flex-col gap-0.5">
                {groupPatients.map((p) => {
                  const isActive = activePatientId === p.id;
                  const href = `/patients/${p.id}`;
                  return (
                    <Link
                      key={p.id}
                      href={href}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-md mono text-[10.5px] font-semibold",
                          isActive
                            ? "bg-violet-500 text-white"
                            : "bg-violet-50 text-violet-700"
                        )}
                      >
                        {p.initials}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {p.cancerLabel.split(" · ")[0]}
                        </span>
                      </div>
                      {p.agent.needsYou.length > 0 && (
                        <StatusPill tone="warn" className="!px-1.5 !py-0.5 !text-[10px]">
                          {p.agent.needsYou.length}
                        </StatusPill>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto p-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-rose-100 mono text-[11px] font-semibold text-rose-700">
            JM
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[13px] font-medium">Dr. Julia Müller</span>
            <span className="truncate text-[11px] text-muted-foreground">Med-Onc</span>
          </div>
        </div>
      </div>

      <span className="hidden">{pathname}</span>
    </aside>
  );
}
