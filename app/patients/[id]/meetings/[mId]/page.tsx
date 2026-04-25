import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Video,
  CalendarDays,
  Mic,
  Sparkles,
  Plus,
} from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getPatient, meetingById, prById } from "@/lib/data";
import { Transcript } from "@/components/meetings/transcript";
import { MeetingSummary } from "@/components/meetings/meeting-summary";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { FactMono } from "@/components/ui/fact-mono";

const TONE = {
  scheduled: "info",
  live: "warn",
  completed: "active",
} as const;

const LABEL = {
  scheduled: "Upcoming",
  live: "Live now",
  completed: "Completed",
};

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string; mId: string }>;
}) {
  const { id, mId } = await params;
  const patient = await getPatient(id);
  const meeting = await meetingById(mId);
  if (!patient || !meeting || meeting.patientId !== id) notFound();

  const prResults = await Promise.all(
    (meeting.proposedPRIds ?? []).map((pid) => prById(pid))
  );
  const prTitles = prResults
    .filter((pr): pr is NonNullable<typeof pr> => !!pr)
    .map((pr) => ({ id: pr.id, title: pr.title }));

  const date = new Date(meeting.date);
  const isUpcoming = meeting.status === "scheduled";

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5">
      <Link
        href={`/patients/${id}/meetings`}
        className="inline-flex w-max items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> All meetings
      </Link>

      <header className="surface flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-violet-100">
            <Video className="h-5 w-5 text-violet-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-semibold tracking-tight">
                {meeting.title}
              </h2>
              <StatusPill tone={TONE[meeting.status]}>{LABEL[meeting.status]}</StatusPill>
            </div>
            <FactMono className="mt-1 text-muted-foreground">
              <CalendarDays className="mr-1 inline h-3 w-3" />
              {format(date, "EEEE · yyyy-MM-dd HH:mm")} · {meeting.durationMin} min ·{" "}
              {meeting.status === "completed"
                ? formatDistanceToNowStrict(date, { addSuffix: true })
                : `in ${formatDistanceToNowStrict(date)}`}
            </FactMono>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {isUpcoming && (
            <>
              <Button variant="outline" className="h-9 gap-1.5 rounded-md bg-card text-[13px]">
                <Plus className="h-3.5 w-3.5" /> <span>Add agenda item</span>
              </Button>
              <Button className="h-9 gap-1.5 rounded-md bg-violet-500 px-3.5 text-[13px] font-medium text-white hover:bg-violet-600">
                <Mic className="h-3.5 w-3.5" />
                <span>Start with agent</span>
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="surface flex min-h-[440px] flex-col gap-1 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="mono text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Transcript
            </span>
            {meeting.agentNotes && meeting.agentNotes.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2 py-0.5 mono text-[10px] font-semibold uppercase tracking-wider text-violet-700">
                <Sparkles className="h-2.5 w-2.5" />
                {meeting.agentNotes.length} agent notes
              </span>
            )}
          </div>
          <div className="mt-3">
            {meeting.transcript && meeting.transcript.length > 0 ? (
              <Transcript
                lines={meeting.transcript}
                agentNotes={meeting.agentNotes ?? []}
              />
            ) : (
              <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground">
                  Transcript will start when the meeting begins.
                </span>
                The agent will join, listen, and propose plan adjustments as PRs.
              </div>
            )}
          </div>
        </section>

        <MeetingSummary
          meeting={meeting}
          patientId={id}
          prTitles={prTitles}
        />
      </div>
    </div>
  );
}
