export type SourceKind =
  | "email"
  | "report"
  | "pr"
  | "note"
  | "lab"
  | "imaging"
  | "pathology"
  | "meeting"
  | "genomics";

export type Specialty =
  | "pathology"
  | "radiology"
  | "med-onc"
  | "surg-onc"
  | "rad-onc"
  | "molecular"
  | "nuc-med"
  | "ir"
  | "pharmacy"
  | "nursing"
  | "genetics"
  | "patient";

export type SourceRef = {
  kind: SourceKind;
  id: string;
  label: string;
  excerpt?: string;
  at: string;
  author?: string;
  specialty?: Specialty;
};

export type Fact = {
  id: string;
  key: string;
  label: string;
  value: string;
  confidence: number;
  source: SourceRef;
  updatedAt: string;
  specialty?: Specialty;
  group:
    | "demographics"
    | "diagnosis"
    | "staging"
    | "medication"
    | "imaging"
    | "lab"
    | "history"
    | "genomics";
};

export type PhaseStatus = "done" | "in-progress" | "planned" | "skipped";
export type PhaseType =
  | "chemo"
  | "radiation"
  | "surgery"
  | "immunotherapy"
  | "targeted"
  | "hormonal"
  | "observation";

export type TreatmentPhase = {
  id: string;
  name: string;
  type: PhaseType;
  regimen?: string;
  status: PhaseStatus;
  startDate: string;
  endDate?: string;
  cycles?: { total: number; completed: number };
  notes?: string;
  rationale?: string;
};

export type AgentEvent = {
  id: string;
  action: string;
  at: string;
  ref?: { kind: "pr" | "fact" | "meeting"; id: string; label: string };
};

export type AgentQuestion = {
  id: string;
  question: string;
  detail?: string;
  ref?: { kind: "pr" | "fact" | "meeting"; id: string; label: string };
  options?: string[];
};

export type AvatarTone = "violet" | "rose" | "amber" | "emerald" | "sky";

export type PatientStatus = "active" | "surveillance" | "archived";

export type Patient = {
  id: string;
  name: string;
  initials: string;
  dob: string;
  age: number;
  sex: "F" | "M" | "X";
  mrn: string;
  status: PatientStatus;
  cancerType: string;
  cancerLabel: string;
  diagnosis: string;
  staging: string;
  primaryOncologist: string;
  caseOpenedAt: string;
  avatarTone: AvatarTone;
  vaultAvatars: { initials: string; tone: AvatarTone }[];
  facts: Fact[];
  plan: TreatmentPhase[];
  options?: TreatmentOption[];
  chosenOptionId?: string | null;
  boardCase?: BoardCase;
  agent: {
    now?: { action: string; ref?: { kind: "pr" | "fact" | "meeting"; id: string; label: string } };
    needsYou: AgentQuestion[];
    recent: AgentEvent[];
  };
};

export type ConflictSeverity = "low" | "medium" | "high";

export type FactDelta = {
  factKey: string;
  label: string;
  before?: string;
  after: string;
  impact?: string;
};

export type Conflict = {
  factKey: string;
  label: string;
  before: string;
  after: string;
  severity: ConflictSeverity;
  rationale: string;
};

export type PRStatus = "open" | "merged" | "conflict" | "needs-review";

export type PullRequest = {
  id: string;
  patientId: string;
  title: string;
  summary: string;
  source: SourceRef;
  proposed: FactDelta[];
  conflicts: Conflict[];
  status: PRStatus;
  agentVerdict: string;
  openedAt: string;
  author: { name: string; role: string };
};

export type Attendee = { name: string; role: string; tone?: AvatarTone };

export type TranscriptLine = {
  id: string;
  speaker: string;
  role: string;
  tone?: AvatarTone;
  at: string;
  text: string;
};

export type AgentNote = {
  id: string;
  at: string;
  text: string;
  attachedToLineId?: string;
};

export type Meeting = {
  id: string;
  patientId: string;
  title: string;
  date: string;
  durationMin: number;
  status: "scheduled" | "live" | "completed";
  attendees: Attendee[];
  transcript?: TranscriptLine[];
  agentNotes?: AgentNote[];
  summary?: string;
  proposedPRIds?: string[];
};

export type GuidelinesNode = {
  id: string;
  label: string;
  detail?: string;
  kind: "decision" | "outcome" | "treatment";
  patientPath?: boolean;
  factKey?: string;
};

export type GuidelinesEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  patientPath?: boolean;
};

export type GuidelinesGraph = {
  cancerType: string;
  title: string;
  source: string;
  nodes: GuidelinesNode[];
  edges: GuidelinesEdge[];
};

export type FollowupItem = {
  id: string;
  patientId: string;
  date: string;
  type: "imaging" | "lab" | "visit" | "discussion";
  label: string;
  prep?: string;
  status: "scheduled" | "completed" | "overdue";
};

export type DataSource = {
  id: string;
  label: string;
  kind: "PACS" | "EHR" | "LIS" | "PathologyDB" | "Email" | "Notes";
  status: "active" | "warn" | "muted";
  lastSync: string;
  frequency: string;
};

export type ActiveAgent = {
  id: string;
  name: string;
  patientId: string;
  task: string;
  type: "Claude" | "Specialist" | "Compliance" | "Triage";
  status: "active" | "warn" | "muted";
};

export type ClinicianRanking = {
  specialist: string;
  specialty: Specialty;
  rank: number;
  confidence: number;
  note?: string;
};

export type OutcomeMetric = {
  label: string;
  value: string;
  citation?: string;
};

export type ToxicityNote = {
  category: string;
  severity: string;
};

export type OptionIntent = "curative" | "palliative" | "trial" | "watch";

export type TreatmentOption = {
  id: string;
  name: string;
  shortLabel: string;
  intent: OptionIntent;
  phases: TreatmentPhase[];
  rationale: string[];
  rationaleFactIds?: string[];
  outcomes: OutcomeMetric[];
  toxicities: ToxicityNote[];
  evidence: string[];
  burden?: string;
  rankings: ClinicianRanking[];
  patientFacing?: {
    name: string;
    summary: string;
    livesLikeThis: string;
  };
};

export type BoardCaseStatus =
  | "draft"
  | "live"
  | "sent-to-patient"
  | "decided"
  | "archived";

export type BoardCase = {
  id: string;
  patientId: string;
  question: string;
  openedAt: string;
  openedFromIssue?: string;
  attendees: Attendee[];
  status: BoardCaseStatus;
  decidedOptionId?: string | null;
  decidedAt?: string;
  decidedBy?: "patient" | "team";
};
