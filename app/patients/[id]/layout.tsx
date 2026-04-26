import { notFound } from "next/navigation";
import {
  getAllPatients,
  getPatient,
  prsForPatient,
  meetingsForPatient,
} from "@/lib/data";
import { PatientSidebar } from "@/components/shell/patient-sidebar";
import { PatientHeader } from "@/components/shell/patient-header";
import { SectionTabs } from "@/components/shell/section-tabs";
import { AgentChat } from "@/components/agent-chat/agent-chat";
import { PageTransition } from "@/components/shell/page-transition";

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patient, allPatients] = await Promise.all([
    getPatient(id),
    getAllPatients(),
  ]);
  if (!patient) notFound();

  const prs = await prsForPatient(id);
  const conflicts = prs.filter((p) => p.status === "conflict").length;
  const open = prs.filter((p) => p.status === "open" || p.status === "needs-review").length;
  const meetings = await meetingsForPatient(id);

  return (
    <div className="bg-aurora-strong flex h-full w-full gap-2.5 overflow-hidden p-2.5">
      <PatientSidebar patients={allPatients} activePatientId={id} />

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-soft)]">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PatientHeader patient={patient} />
          <SectionTabs
            patientId={id}
            prCount={open + conflicts}
            conflictCount={conflicts}
            meetingCount={meetings.length}
          />
          <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>

        <AgentChat patient={patient} />
      </div>
    </div>
  );
}
