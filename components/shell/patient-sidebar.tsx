"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronsUpDown,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { patients } from "@/lib/mock-data/patients";
import { SpecialistTreeNav } from "@/components/vault/specialist-tree";
import { useCollapsible } from "@/lib/use-collapsible";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PatientSidebar({
  activePatientId,
}: {
  activePatientId?: string;
}) {
  const router = useRouter();
  const { collapsed, toggle } = useCollapsible("left");
  const active = patients.find((p) => p.id === activePatientId);
  const facts = active?.facts ?? [];

  const grouped = {
    active: patients.filter((p) => p.status === "active"),
    surveillance: patients.filter((p) => p.status === "surveillance"),
  };

  if (collapsed) {
    return (
      <aside className="hidden w-12 flex-shrink-0 flex-col items-center gap-2 rounded-2xl border border-border bg-sidebar py-3 shadow-[var(--shadow-soft)] md:flex">
        <Link
          href="/"
          aria-label="oncoAgent home"
          className="grid h-7 w-7 place-items-center rounded-md bg-violet-500 shadow-[0_4px_12px_rgba(15,31,77,0.22)]"
        >
          <Logo />
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label="Expand sidebar"
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="hidden w-[260px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-sidebar shadow-[var(--shadow-soft)] md:flex">
      <div className="flex h-14 flex-shrink-0 items-center justify-between px-2">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-1"
        >
          <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-violet-500 shadow-[0_4px_12px_rgba(15,31,77,0.22)]">
            <Logo />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">
            oncoAgent
          </span>
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label="Collapse sidebar"
          className="mr-1.5 grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex h-12 flex-shrink-0 items-center px-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-1.5 text-left hover:bg-secondary">
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[13px] font-medium">
                {active?.name ?? "Select patient"}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {active
                  ? active.cancerLabel.split(" · ")[0]
                  : "OncoUnit Vienna"}
              </span>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="w-[244px] py-1.5"
          >
            <div className="px-2 py-1 mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active · {grouped.active.length}
            </div>
            {grouped.active.map((p) => (
              <PatientMenuRow
                key={p.id}
                patient={p}
                isActive={p.id === activePatientId}
                onPick={() => router.push(`/patients/${p.id}`)}
              />
            ))}
            {grouped.surveillance.length > 0 && (
              <>
                <DropdownMenuSeparator className="my-1" />
                <div className="px-2 py-1 mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Surveillance · {grouped.surveillance.length}
                </div>
                {grouped.surveillance.map((p) => (
                  <PatientMenuRow
                    key={p.id}
                    patient={p}
                    isActive={p.id === activePatientId}
                    onPick={() => router.push(`/patients/${p.id}`)}
                  />
                ))}
              </>
            )}
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={() => router.push("/")}
              className="px-2 py-1.5 text-[12.5px] text-muted-foreground"
            >
              All patient vaults
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {active && (
        <div className="flex-1 overflow-y-auto pt-3 pb-3">
          <SpecialistTreeNav facts={facts} patientId={active.id} />
        </div>
      )}
      {!active && <div className="flex-1" />}

      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-rose-100 mono text-[11px] font-semibold text-rose-700">
            JM
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[13px] font-medium">
              Dr. Julia Müller
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              Med-Onc · OncoUnit Vienna
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PatientMenuRow({
  patient,
  isActive,
  onPick,
}: {
  patient: Patient;
  isActive: boolean;
  onPick: () => void;
}) {
  return (
    <DropdownMenuItem
      onClick={onPick}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 text-[12.5px]",
        isActive && "bg-violet-50/70"
      )}
    >
      <span
        className={cn(
          "grid h-6 w-6 flex-shrink-0 place-items-center rounded-md mono text-[10.5px] font-semibold",
          isActive
            ? "bg-violet-500 text-white"
            : "bg-violet-100 text-violet-700"
        )}
      >
        {patient.initials}
      </span>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate font-medium">{patient.name}</span>
        <span className="truncate text-[10.5px] text-muted-foreground">
          {patient.cancerLabel.split(" · ")[0]}
        </span>
      </div>
      {isActive && (
        <Check className="h-3.5 w-3.5 flex-shrink-0 text-violet-600" />
      )}
    </DropdownMenuItem>
  );
}

function Logo() {
  return (
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
  );
}
