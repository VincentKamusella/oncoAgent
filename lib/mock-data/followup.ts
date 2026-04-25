import type { FollowupItem } from "../types";

export const followupItems: FollowupItem[] = [
  // Maria — active, mid-treatment monitoring
  {
    id: "fu-mk-1",
    patientId: "maria-k",
    date: "2026-05-06T10:00:00Z",
    type: "lab",
    label: "Pre-cycle 5 CBC + CMP",
    prep: "Fasting not required.",
    status: "scheduled",
  },
  {
    id: "fu-mk-2",
    patientId: "maria-k",
    date: "2026-05-06T13:30:00Z",
    type: "visit",
    label: "Cycle 5 TCHP infusion",
    prep: "Premedication 30 min prior.",
    status: "scheduled",
  },
  {
    id: "fu-mk-3",
    patientId: "maria-k",
    date: "2026-05-13T09:00:00Z",
    type: "imaging",
    label: "Mid-treatment breast MRI",
    prep: "Fast 4 h, IV contrast, remove implants if any.",
    status: "scheduled",
  },
  {
    id: "fu-mk-4",
    patientId: "maria-k",
    date: "2026-05-27T14:00:00Z",
    type: "visit",
    label: "Cycle 6 TCHP infusion",
    status: "scheduled",
  },
  {
    id: "fu-mk-5",
    patientId: "maria-k",
    date: "2026-06-10T10:00:00Z",
    type: "discussion",
    label: "Surgical planning consult",
    status: "scheduled",
  },

  // Thomas — active, awaiting tumor board
  {
    id: "fu-tb-1",
    patientId: "thomas-b",
    date: "2026-04-26T09:00:00Z",
    type: "discussion",
    label: "Tumor board · staging reconciliation",
    prep: "Review PR #3 and updated MRI.",
    status: "scheduled",
  },
  {
    id: "fu-tb-2",
    patientId: "thomas-b",
    date: "2026-05-05T11:00:00Z",
    type: "visit",
    label: "RT planning visit",
    prep: "Bring prior MRI and treatment summary.",
    status: "scheduled",
  },
  {
    id: "fu-tb-3",
    patientId: "thomas-b",
    date: "2026-05-06T09:00:00Z",
    type: "imaging",
    label: "RT simulation CT",
    status: "scheduled",
  },
  {
    id: "fu-tb-4",
    patientId: "thomas-b",
    date: "2026-06-17T09:00:00Z",
    type: "imaging",
    label: "End-of-CRT MRI",
    status: "scheduled",
  },

  // Anna — surveillance schedule
  {
    id: "fu-al-1",
    patientId: "anna-l",
    date: "2026-05-08T09:00:00Z",
    type: "imaging",
    label: "Bilateral mammogram (18-mo)",
    prep: "No deodorant on day of exam.",
    status: "scheduled",
  },
  {
    id: "fu-al-2",
    patientId: "anna-l",
    date: "2026-05-15T11:00:00Z",
    type: "visit",
    label: "Med-Onc surveillance visit",
    status: "scheduled",
  },
  {
    id: "fu-al-3",
    patientId: "anna-l",
    date: "2026-07-04T08:00:00Z",
    type: "lab",
    label: "CMP + CA 15-3",
    status: "scheduled",
  },
  {
    id: "fu-al-4",
    patientId: "anna-l",
    date: "2026-04-04T08:00:00Z",
    type: "lab",
    label: "CA 15-3 (completed)",
    status: "completed",
  },
  {
    id: "fu-al-5",
    patientId: "anna-l",
    date: "2025-10-14T09:00:00Z",
    type: "imaging",
    label: "Mammogram (12-mo)",
    status: "completed",
  },
];

export function followupForPatient(id: string): FollowupItem[] {
  return followupItems
    .filter((f) => f.patientId === id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
