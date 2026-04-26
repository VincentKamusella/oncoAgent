import Link from "next/link";
import { FolderIcon } from "@/components/ui/folder-icon";
import { StatusPill } from "@/components/ui/status-pill";
import { FactMono } from "@/components/ui/fact-mono";
import { DeletePatientButton } from "./delete-patient-button";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_COPY: Record<Patient["status"], { tone: "active" | "info" | "muted"; label: string }> = {
  active: { tone: "active", label: "Active" },
  surveillance: { tone: "info", label: "Surveillance" },
  archived: { tone: "muted", label: "Archived" },
};

type Props = {
  patient: Patient;
  factsCount: number;
  openPRs: number;
  conflictPRs: number;
  className?: string;
};

export function VaultCard({ patient, factsCount, openPRs, conflictPRs, className }: Props) {
  const status = STATUS_COPY[patient.status];

  return (
    <Link
      href={`/patients/${patient.id}`}
      className={cn(
        "group relative flex flex-col items-center rounded-3xl border border-border bg-card px-8 pt-10 pb-7",
        "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        "shadow-[var(--shadow-soft)]",
        className
      )}
    >
      <DeletePatientButton slug={patient.id} patientName={patient.name} />
      <FolderIcon avatars={patient.vaultAvatars} size={156} />

      <div className="mt-5 flex flex-col items-center text-center">
        <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
          {patient.name}
        </h3>
        <p className="mt-1 max-w-[20ch] text-[13px] leading-snug text-muted-foreground">
          {patient.cancerLabel}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
        <FactMono className="text-[11.5px] text-muted-foreground">
          {factsCount} facts · {openPRs} open
          {conflictPRs > 0 ? ` · ${conflictPRs} conflict` : ""}
        </FactMono>
      </div>
    </Link>
  );
}
