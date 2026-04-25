import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
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
    <header className="flex items-center justify-between gap-4 border-b border-border bg-background/70 px-6 py-3.5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2.5">
        <Link
          href="/"
          className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          Patient vaults
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-violet-50 mono text-[11px] font-semibold text-violet-700">
            {patient.initials}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[14px] font-semibold tracking-tight">
              {patient.name}
            </span>
            <FactMono className="text-[11px] text-muted-foreground">
              {patient.mrn} · {patient.age}
              {patient.sex} · case opened {patient.caseOpenedAt}
            </FactMono>
          </div>
        </div>
        <StatusPill tone={STATUS_TONE[patient.status]} className="ml-2">
          {STATUS_LABEL[patient.status]}
        </StatusPill>
      </div>

      <div className="relative hidden w-72 lg:block">
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
