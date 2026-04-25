import { notFound } from "next/navigation";
import { getPatient } from "@/lib/mock-data/patients";
import { prsForPatient } from "@/lib/mock-data/prs";
import { meetingsForPatient } from "@/lib/mock-data/meetings";
import { PatientSidebar } from "@/components/shell/patient-sidebar";
import { PatientHeader } from "@/components/shell/patient-header";
import { SectionTabs } from "@/components/shell/section-tabs";
import { AgentPanel } from "@/components/shell/agent-panel";
import { PageTransition } from "@/components/shell/page-transition";

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = getPatient(id);
  if (!patient) notFound();

  const prs = prsForPatient(id);
  const conflicts = prs.filter((p) => p.status === "conflict").length;
  const open = prs.filter((p) => p.status === "open" || p.status === "needs-review").length;
  const meetings = meetingsForPatient(id);

  return (
    <div className="bg-aurora flex min-h-screen w-full">
      <PatientSidebar activePatientId={id} />

      <div className="flex min-w-0 flex-1 flex-col">
        <PatientHeader patient={patient} />
        <SectionTabs
          patientId={id}
          prCount={open + conflicts}
          conflictCount={conflicts}
          meetingCount={meetings.length}
        />
        <main className="flex min-w-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <PageTransition>{children}</PageTransition>
          </div>
          <AgentPanel patient={patient} />
        </main>
      </div>
    </div>
  );
}
