import { Search } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { Input } from "@/components/ui/input";
import { FactMono } from "@/components/ui/fact-mono";
import type { Patient } from "@/lib/types";

const STATUS_TONE = {
  active: "active",
  surveillance: "info",
  archived: "muted",
} as const;

const STATUS_LABEL: Record<Patient["status"], string> = {
  active: "Active treatment",
  surveillance: "Surveillance",
  archived: "Archived",
};

export function PatientHeader({ patient }: { patient: Patient }) {
  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between gap-4 border-b border-border bg-background/70 px-6 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-md bg-violet-50 mono text-[10.5px] font-semibold text-violet-700">
          {patient.initials}
        </div>
        <span className="truncate text-[14px] font-semibold tracking-tight">
          {patient.name}
        </span>
        <FactMono className="hidden whitespace-nowrap text-[11px] text-muted-foreground md:inline">
          {patient.mrn} · {patient.age}
          {patient.sex} · {patient.caseOpenedAt}
        </FactMono>
        <StatusPill tone={STATUS_TONE[patient.status]}>
          {STATUS_LABEL[patient.status]}
        </StatusPill>
      </div>

      <div className="relative hidden w-64 flex-shrink-0 lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Find anything…"
          className="h-8 rounded-md border-border bg-card pl-8 text-[12.5px] shadow-none focus-visible:ring-violet-200"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>
    </header>
  );
}
