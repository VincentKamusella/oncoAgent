"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type {
  Attachment,
  GuidelinesGraph,
  Patient,
  Specialty,
} from "@/lib/types";
import { AllRecordsDashboard } from "./all-records-dashboard";
import { SpecialistFolder } from "./specialist-folder";

const VALID_SPECIALTIES: Specialty[] = [
  "pathology",
  "radiology",
  "med-onc",
  "surg-onc",
  "rad-onc",
  "molecular",
  "nuc-med",
  "ir",
  "pharmacy",
  "nursing",
  "genetics",
  "patient",
];

export function VaultView({
  patient,
  guidelines,
}: {
  patient: Patient;
  guidelines: GuidelinesGraph | null;
}) {
  const params = useSearchParams();
  const raw = params.get("specialty");
  const active: Specialty | "all" =
    raw && (VALID_SPECIALTIES as string[]).includes(raw)
      ? (raw as Specialty)
      : "all";

  const facts = patient.facts;
  const attachments: Attachment[] = patient.attachments ?? [];

  const folderAttachments = useMemo(
    () =>
      active === "all"
        ? attachments
        : attachments.filter((a) => a.specialty === active),
    [attachments, active]
  );

  const folderFacts = useMemo(
    () =>
      active === "all" ? facts : facts.filter((f) => f.specialty === active),
    [facts, active]
  );

  if (active === "all") {
    return (
      <AllRecordsDashboard
        patient={patient}
        facts={facts}
        guidelines={guidelines}
      />
    );
  }

  return (
    <SpecialistFolder
      key={active}
      specialty={active}
      attachments={folderAttachments}
      facts={folderFacts}
    />
  );
}
