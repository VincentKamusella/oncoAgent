import { notFound } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { getPatient } from "@/lib/mock-data/patients";
import { followupForPatient } from "@/lib/mock-data/followup";
import { FollowupTimeline } from "@/components/followup/followup-timeline";
import { Button } from "@/components/ui/button";

const TODAY = new Date("2026-04-25T00:00:00Z");

export default async function FollowupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = getPatient(id);
  if (!patient) notFound();

  const items = followupForPatient(id);
  const upcoming = items.filter(
    (i) => i.status === "scheduled" && new Date(i.date) >= TODAY
  );
  const past = items.filter(
    (i) => i.status === "completed" || new Date(i.date) < TODAY
  );

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-violet-600" />
            <span className="mono text-[11px] uppercase tracking-[0.16em] text-violet-600">
              Followup
            </span>
          </div>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight">
            {patient.status === "surveillance"
              ? "Surveillance schedule"
              : "Treatment & monitoring schedule"}
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Imaging, labs, visits, and tumor board discussions auto-scheduled by the agent.
            Status flips to overdue automatically and triggers a nudge to the care team.
          </p>
        </div>
        <Button className="h-9 gap-1.5 rounded-lg bg-violet-500 px-3.5 text-[13px] font-medium text-white hover:bg-violet-600">
          <Plus className="h-3.5 w-3.5" />
          <span>Schedule</span>
        </Button>
      </header>

      <section className="flex flex-col gap-3">
        <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
          Upcoming
        </h3>
        <FollowupTimeline items={upcoming} />
      </section>

      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-[14px] font-semibold tracking-tight text-muted-foreground">
            History
          </h3>
          <FollowupTimeline items={past.slice().reverse()} />
        </section>
      )}
    </div>
  );
}
