import { notFound } from "next/navigation";
import { getPatient } from "@/lib/data";
import { TreatmentTimeline } from "@/components/plan/treatment-timeline";
import { Sparkles } from "lucide-react";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <header>
        <span className="mono text-[11px] uppercase tracking-[0.16em] text-violet-600">
          Treatment plan
        </span>
        <h2 className="mt-1 text-[22px] font-semibold tracking-tight">
          {patient.name.split(" ")[0]}&apos;s therapy roadmap
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          The full sequence proposed by the agent and ratified at tumor board. Click any
          phase for details. Drug regimens, cycles, and dates are kept in sync with the
          vault — every change writes a PR.
        </p>
      </header>

      <TreatmentTimeline phases={patient.plan} />

      <section className="surface px-5 py-4">
        <div className="flex items-start gap-2.5">
          <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-violet-100">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <div>
            <p className="mono text-[10.5px] font-semibold uppercase tracking-wider text-violet-700">
              Why this sequence
            </p>
            <p className="mt-1 text-[13px] leading-snug text-foreground">
              Patient&apos;s diagnosis ({patient.diagnosis}) and stage ({patient.staging})
              place them on the standard pathway for {patient.cancerLabel.split("·")[0].trim()}.
              The agent matched these records to the relevant guideline (see Guidelines view)
              and ordered phases by clinical timing windows.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
