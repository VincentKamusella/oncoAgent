import type { DataSource, ActiveAgent } from "../types";

export const dataSources: DataSource[] = [
  {
    id: "src-pacs",
    label: "PACS imaging archive",
    kind: "PACS",
    status: "active",
    lastSync: "13 minutes ago",
    frequency: "Real-time",
  },
  {
    id: "src-ehr",
    label: "Epic EHR connection",
    kind: "EHR",
    status: "active",
    lastSync: "27 minutes ago",
    frequency: "Hourly",
  },
  {
    id: "src-lis",
    label: "Laboratory results (LIS)",
    kind: "LIS",
    status: "active",
    lastSync: "2 hours ago",
    frequency: "Hourly",
  },
  {
    id: "src-path",
    label: "Pathology dictation system",
    kind: "PathologyDB",
    status: "warn",
    lastSync: "11 hours ago",
    frequency: "Daily",
  },
  {
    id: "src-mail",
    label: "Tumor board mailbox",
    kind: "Email",
    status: "active",
    lastSync: "9 minutes ago",
    frequency: "Real-time",
  },
  {
    id: "src-notes",
    label: "Clinician dictation notes",
    kind: "Notes",
    status: "muted",
    lastSync: "Yesterday",
    frequency: "Daily",
  },
];

export const activeAgents: ActiveAgent[] = [
  {
    id: "ag-staging-thomas",
    name: "Staging reviewer",
    patientId: "thomas-b",
    task: "Reconciling MRI cT3 → cT4a",
    type: "Specialist",
    status: "warn",
  },
  {
    id: "ag-cardio-maria",
    name: "Cardio-onc monitor",
    patientId: "maria-k",
    task: "LVEF surveillance",
    type: "Compliance",
    status: "active",
  },
  {
    id: "ag-claude-triage",
    name: "Claude triage",
    patientId: "thomas-b",
    task: "Drafting tumor board summary",
    type: "Claude",
    status: "active",
  },
  {
    id: "ag-surveillance-anna",
    name: "Surveillance scheduler",
    patientId: "anna-l",
    task: "Booking 18-mo mammogram",
    type: "Triage",
    status: "muted",
  },
];
