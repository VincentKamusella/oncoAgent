import type { PullRequest } from "../types";

export const pullRequests: PullRequest[] = [
  {
    id: "pr-tb-1",
    patientId: "thomas-b",
    title: "Restaging MRI 2026-04-22 — staging change cT3 → cT4a",
    summary:
      "New pelvic MRI shows anterior tumor extension contacting visceral peritoneum. Conflicts with baseline cT3 staging.",
    source: {
      kind: "imaging",
      id: "img-tb-mri-002",
      label: "Pelvic MRI · 2026-04-22",
      excerpt:
        "Compared to 2026-03-08: tumor enhancement reduced ~30% but anterior extension now contacts visceral peritoneum (suggestive of cT4a). One persistent 7 mm mesorectal node.",
      author: "Dr. K. Lee, Radiology",
      at: "2026-04-22T16:00:00Z",
    },
    proposed: [
      {
        factKey: "staging.clinical",
        label: "Clinical stage",
        before: "cT3 cN1 cM0 — Stage IIIB",
        after: "cT4a cN1 cM0 — Stage IIIB (upstaged T)",
        impact: "Treatment intensification likely indicated.",
      },
      {
        factKey: "imaging.restage",
        label: "Restaging MRI",
        after: "Pelvic MRI · 2026-04-22 (post-induction)",
      },
      {
        factKey: "plan.escalation",
        label: "Plan escalation candidate",
        after: "Discuss adding short-course RT boost or earlier surgery",
        impact: "Tumor board decision required.",
      },
    ],
    conflicts: [
      {
        factKey: "staging.clinical",
        label: "Clinical stage",
        before: "cT3 cN1 cM0",
        after: "cT4a cN1 cM0",
        severity: "high",
        rationale:
          "Visceral peritoneum involvement (cT4a) materially changes prognosis and surgical plan. Cannot be auto-merged — requires multidisciplinary review.",
      },
    ],
    status: "conflict",
    agentVerdict:
      "Conflict on staging.clinical. Auto-merge blocked. Recommended action: tumor board review on 2026-04-26.",
    openedAt: "2026-04-22T17:14:00Z",
    author: { name: "Dr. K. Lee", role: "Radiology" },
  },
  {
    id: "pr-mk-1",
    patientId: "maria-k",
    title: "CBC 2026-04-21 — neutrophils 2.1",
    summary: "Routine pre-cycle 5 CBC. ANC marginal but acceptable.",
    source: {
      kind: "lab",
      id: "lab-mk-cbc-3",
      label: "CBC · 2026-04-21",
      author: "Hematology lab",
      at: "2026-04-21T08:15:00Z",
      excerpt:
        "WBC 4.1, ANC 2.1, Hgb 11.4 g/dL, Plt 188 ×10⁹/L. No transfusion threshold met.",
    },
    proposed: [
      {
        factKey: "lab.cbc",
        label: "ANC (latest)",
        before: "2.6 ×10⁹/L (2026-03-31)",
        after: "2.1 ×10⁹/L",
      },
    ],
    conflicts: [],
    status: "merged",
    agentVerdict: "Auto-merged — within normal protocol thresholds, no DLT.",
    openedAt: "2026-04-21T08:21:00Z",
    author: { name: "Hematology lab", role: "Auto-feed" },
  },
  {
    id: "pr-mk-2",
    patientId: "maria-k",
    title: "Echocardiogram 2026-04-22 — LVEF 62%",
    summary: "Routine cardiac surveillance during trastuzumab. Normal function.",
    source: {
      kind: "report",
      id: "echo-mk-002",
      label: "Echocardiogram · 2026-04-22",
      author: "Dr. A. Singh, Cardiology",
      at: "2026-04-22T09:30:00Z",
    },
    proposed: [
      {
        factKey: "lab.lvef",
        label: "LVEF (echo)",
        before: "61% (2026-03-04)",
        after: "62% — within normal limits",
      },
    ],
    conflicts: [],
    status: "merged",
    agentVerdict: "Auto-merged — change within measurement noise, LVEF stable.",
    openedAt: "2026-04-22T11:02:00Z",
    author: { name: "Dr. A. Singh", role: "Cardiology" },
  },
  {
    id: "pr-tb-2",
    patientId: "thomas-b",
    title: "FOLFOX cycle 4 infusion note",
    summary: "Final induction cycle delivered without dose modification.",
    source: {
      kind: "note",
      id: "note-tb-infusion-4",
      label: "Infusion note · 2026-04-18",
      at: "2026-04-18T14:20:00Z",
    },
    proposed: [
      {
        factKey: "medication.cycle",
        label: "Current cycle",
        before: "FOLFOX cycle 3 of 4",
        after: "FOLFOX cycle 4 of 4 — completed 2026-04-18",
      },
    ],
    conflicts: [],
    status: "merged",
    agentVerdict: "Auto-merged.",
    openedAt: "2026-04-18T15:00:00Z",
    author: { name: "Onc nursing", role: "Care team" },
  },
  {
    id: "pr-mk-3",
    patientId: "maria-k",
    title: "Patient-reported neuropathy onset",
    summary:
      "Patient mentioned grade 1 numbness in fingertips during cycle 4 follow-up call.",
    source: {
      kind: "note",
      id: "note-mk-call-4",
      label: "Nurse call note · 2026-04-23",
      author: "Onc nursing",
      at: "2026-04-23T10:30:00Z",
      excerpt:
        "Patient reports tingling in fingertips, no functional impairment. No reported pain.",
    },
    proposed: [
      {
        factKey: "history.event.neuropathy",
        label: "Adverse event",
        after: "Grade 1 peripheral neuropathy, fingertips, onset cycle 4",
        impact: "Monitor; no dose change indicated at G1.",
      },
    ],
    conflicts: [],
    status: "needs-review",
    agentVerdict:
      "Light review needed — confirm grade and symptom mapping with the treating oncologist.",
    openedAt: "2026-04-23T10:35:00Z",
    author: { name: "Onc nursing", role: "Care team" },
  },
  {
    id: "pr-al-1",
    patientId: "anna-l",
    title: "CA 15-3 result · 2026-04-04",
    summary: "Routine surveillance tumor marker, within normal limits.",
    source: {
      kind: "lab",
      id: "lab-al-ca153-2",
      label: "CA 15-3 · 2026-04-04",
      at: "2026-04-04T08:00:00Z",
    },
    proposed: [
      {
        factKey: "lab.ca153",
        label: "CA 15-3",
        before: "19 U/mL (2025-10-12)",
        after: "21 U/mL (within normal)",
      },
    ],
    conflicts: [],
    status: "merged",
    agentVerdict: "Auto-merged — stable, no action needed.",
    openedAt: "2026-04-04T08:45:00Z",
    author: { name: "Lab feed", role: "Auto-feed" },
  },
];

export function prsForPatient(id: string): PullRequest[] {
  return pullRequests.filter((pr) => pr.patientId === id);
}

export function prById(id: string): PullRequest | undefined {
  return pullRequests.find((pr) => pr.id === id);
}
