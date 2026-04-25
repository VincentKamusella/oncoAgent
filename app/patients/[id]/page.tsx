import { notFound } from "next/navigation";
import {
  Stethoscope,
  Pill,
  ScanLine,
  History as HistoryIcon,
} from "lucide-react";
import { getPatient } from "@/lib/mock-data/patients";
import { FactCard } from "@/components/overview/fact-card";
import type { Fact } from "@/lib/types";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = getPatient(id);
  if (!patient) notFound();

  const facts = (...groups: Fact["group"][]) =>
    patient.facts.filter((f) => groups.includes(f.group));

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5">
      {/* hero card */}
      <section className="surface flex items-start justify-between gap-6 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-500 mono text-[16px] font-semibold text-white shadow-[0_8px_24px_rgba(124,91,247,0.35)]">
            {patient.initials}
          </div>
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
              {patient.name}
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {patient.diagnosis}
            </p>
            <div className="mono mt-2 flex items-center gap-3 text-[11.5px] text-muted-foreground">
              <span>{patient.mrn}</span>
              <span className="text-muted-foreground/50">·</span>
              <span>
                {patient.age}
                {patient.sex} · DOB {patient.dob}
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span>{patient.primaryOncologist}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Clinical stage
          </span>
          <span className="rounded-md bg-violet-50 px-2.5 py-1 mono text-[12px] font-semibold text-violet-700">
            {patient.staging}
          </span>
        </div>
      </section>

      {/* grouped fact cards — fewer, denser, single column */}
      <FactCard
        title="Diagnosis & Staging"
        icon={<Stethoscope className="h-3.5 w-3.5" />}
        facts={facts("diagnosis", "staging")}
      />
      <FactCard
        title="Medications"
        icon={<Pill className="h-3.5 w-3.5" />}
        facts={facts("medication")}
      />
      <FactCard
        title="Imaging & Labs"
        icon={<ScanLine className="h-3.5 w-3.5" />}
        facts={facts("imaging", "lab")}
      />
      <FactCard
        title="History & Demographics"
        icon={<HistoryIcon className="h-3.5 w-3.5" />}
        facts={facts("history", "demographics")}
      />
    </div>
  );
}
