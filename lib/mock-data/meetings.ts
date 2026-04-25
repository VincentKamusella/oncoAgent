import type { Meeting } from "../types";

export const meetings: Meeting[] = [
  {
    id: "mtg-tb-1",
    patientId: "thomas-b",
    title: "Tumor board · staging reconciliation",
    date: "2026-04-26T09:00:00Z",
    durationMin: 25,
    status: "scheduled",
    attendees: [
      { name: "Dr. C. Romano", role: "Medical Oncology", tone: "violet" },
      { name: "Dr. F. Park", role: "Surgical Oncology", tone: "sky" },
      { name: "Dr. K. Lee", role: "Radiology", tone: "amber" },
      { name: "Dr. M. Schwarz", role: "GI Pathology", tone: "rose" },
      { name: "Dr. N. Ito", role: "Radiation Oncology", tone: "emerald" },
    ],
  },
  {
    id: "mtg-tb-2",
    patientId: "thomas-b",
    title: "Tumor board · TNT plan kickoff",
    date: "2026-03-12T09:00:00Z",
    durationMin: 22,
    status: "completed",
    attendees: [
      { name: "Dr. C. Romano", role: "Medical Oncology", tone: "violet" },
      { name: "Dr. F. Park", role: "Surgical Oncology", tone: "sky" },
      { name: "Dr. K. Lee", role: "Radiology", tone: "amber" },
      { name: "Dr. N. Ito", role: "Radiation Oncology", tone: "emerald" },
    ],
    transcript: [
      {
        id: "t-1",
        speaker: "Dr. C. Romano",
        role: "Med-Onc",
        tone: "violet",
        at: "00:01",
        text: "Mid-rectal adenocarcinoma, cT3 cN1 by MRI. CEA 8.4. Performance status 1. Proposing TNT.",
      },
      {
        id: "t-2",
        speaker: "Dr. F. Park",
        role: "Surgery",
        tone: "sky",
        at: "00:03",
        text: "Tumor at 8 cm — sphincter preservation feasible if good response. Comfortable with TME after CRT.",
      },
      {
        id: "t-3",
        speaker: "Dr. N. Ito",
        role: "Rad-Onc",
        tone: "emerald",
        at: "00:06",
        text: "Long-course 50.4 Gy with concurrent capecitabine, standard. Start 4 weeks after final FOLFOX.",
      },
      {
        id: "t-4",
        speaker: "Dr. K. Lee",
        role: "Radiology",
        tone: "amber",
        at: "00:10",
        text: "Will repeat MRI after induction to assess response and re-stage before CRT.",
      },
      {
        id: "t-5",
        speaker: "Dr. C. Romano",
        role: "Med-Onc",
        tone: "violet",
        at: "00:14",
        text: "Consensus: induction FOLFOX × 4 → CRT → TME → adjuvant if path response is poor.",
      },
    ],
    agentNotes: [
      {
        id: "an-1",
        at: "00:01",
        text: "Captured proposed plan: TNT (induction → CRT → TME → adjuvant).",
      },
      {
        id: "an-2",
        at: "00:10",
        text: "Auto-scheduled restaging MRI at week 8 post-induction.",
        attachedToLineId: "t-4",
      },
      {
        id: "an-3",
        at: "00:14",
        text: "Drafted PR #1 — TNT plan adoption with cited consensus.",
      },
    ],
    summary:
      "Tumor board adopted Total Neoadjuvant Therapy: induction FOLFOX × 4 → long-course CRT (50.4 Gy + capecitabine) → TME at 6–8 weeks post-CRT → adjuvant chemo if path response < grade 3. Restaging MRI scheduled post-induction.",
    proposedPRIds: ["pr-tb-2"],
  },
  {
    id: "mtg-mk-1",
    patientId: "maria-k",
    title: "Tumor board · HER2+ neoadjuvant plan",
    date: "2026-02-22T10:00:00Z",
    durationMin: 18,
    status: "completed",
    attendees: [
      { name: "Dr. J. Müller", role: "Medical Oncology", tone: "violet" },
      { name: "Dr. R. Patel", role: "Pathology", tone: "rose" },
      { name: "Dr. F. Park", role: "Surgical Oncology", tone: "sky" },
      { name: "Dr. A. Singh", role: "Cardiology", tone: "emerald" },
    ],
    transcript: [
      {
        id: "t-1",
        speaker: "Dr. R. Patel",
        role: "Pathology",
        tone: "rose",
        at: "00:00",
        text: "IDC, NG2, ER 95% PR 60% HER2 3+ confirmed FISH. No LVI on core.",
      },
      {
        id: "t-2",
        speaker: "Dr. J. Müller",
        role: "Med-Onc",
        tone: "violet",
        at: "00:02",
        text: "Stage IIB clinical. Standard is neoadjuvant TCHP × 6 → surgery → adjuvant HP + endocrine.",
      },
      {
        id: "t-3",
        speaker: "Dr. A. Singh",
        role: "Cardiology",
        tone: "emerald",
        at: "00:06",
        text: "Baseline echo normal. Recommend echocardiography q3 cycles during HER2 therapy.",
      },
      {
        id: "t-4",
        speaker: "Dr. F. Park",
        role: "Surgery",
        tone: "sky",
        at: "00:09",
        text: "Plan breast conservation if good response, otherwise mastectomy. Sentinel nodes per response.",
      },
    ],
    agentNotes: [
      { id: "an-1", at: "00:02", text: "Captured TCHP plan and timing." },
      {
        id: "an-2",
        at: "00:06",
        text: "Auto-booked echocardiogram every 3 cycles, attached to monitoring SOP.",
      },
    ],
    summary:
      "Plan: TCHP × 6 (q3w) → surgery → adjuvant HP to 1 yr + endocrine therapy. Echo at baseline and every 3 cycles. Surgery type guided by neoadjuvant response.",
  },
];

export function meetingsForPatient(id: string): Meeting[] {
  return meetings.filter((m) => m.patientId === id);
}

export function meetingById(id: string): Meeting | undefined {
  return meetings.find((m) => m.id === id);
}
