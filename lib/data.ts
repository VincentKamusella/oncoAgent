import type {
  Patient,
  PullRequest,
  Meeting,
  FollowupItem,
  GuidelinesGraph,
  DataSource,
  ActiveAgent,
  AvatarTone,
  Fact,
  TreatmentPhase,
  TreatmentOption,
  BoardCase,
} from "./types";

import {
  patients as mockPatients,
  getPatient as mockGetPatient,
  patientsByStatus as mockPatientsByStatus,
} from "./mock-data/patients";
import {
  pullRequests as mockPullRequests,
  prsForPatient as mockPrsForPatient,
  prById as mockPrById,
} from "./mock-data/prs";
import {
  meetings as mockMeetings,
  meetingsForPatient as mockMeetingsForPatient,
  meetingById as mockMeetingById,
} from "./mock-data/meetings";
import {
  followupItems as mockFollowupItems,
  followupForPatient as mockFollowupForPatient,
} from "./mock-data/followup";
import { guidelinesFor as mockGuidelinesFor } from "./mock-data/guidelines";
import {
  dataSources as mockDataSources,
  activeAgents as mockActiveAgents,
} from "./mock-data/sources";

const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

// ---------------------------------------------------------------------------
// Supabase helpers (lazy import to avoid client-side bundling when off)
// ---------------------------------------------------------------------------

async function supabase() {
  const { createClient } = await import("./supabase/server");
  return createClient();
}

function toFact(row: Record<string, unknown>): Fact {
  return {
    id: row.id as string,
    key: row.key as string,
    label: row.label as string,
    value: row.value as string,
    confidence: Number(row.confidence),
    group: row.group as Fact["group"],
    specialty: (row.specialty as Fact["specialty"]) ?? undefined,
    source: {
      kind: (row.source_kind ?? "report") as Fact["source"]["kind"],
      id: (row.source_id ?? row.id) as string,
      label: (row.source_label ?? "") as string,
      excerpt: (row.source_excerpt as string) ?? undefined,
      at: (row.source_at as string) ?? (row.updated_at as string),
      author: (row.source_author as string) ?? undefined,
      specialty: (row.source_specialty as Fact["source"]["specialty"]) ?? undefined,
    },
    updatedAt: row.updated_at as string,
  };
}

function toPhase(row: Record<string, unknown>): TreatmentPhase {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as TreatmentPhase["type"],
    regimen: (row.regimen as string) ?? undefined,
    status: row.status as TreatmentPhase["status"],
    startDate: row.start_date as string,
    endDate: (row.end_date as string) ?? undefined,
    cycles:
      row.cycles_total != null
        ? { total: row.cycles_total as number, completed: (row.cycles_completed ?? 0) as number }
        : undefined,
    notes: (row.notes as string) ?? undefined,
    rationale: (row.rationale as string) ?? undefined,
  };
}

function toPullRequest(
  row: Record<string, unknown>,
  deltas: Record<string, unknown>[],
  conflicts: Record<string, unknown>[],
): PullRequest {
  return {
    id: row.id as string,
    patientId: row.patient_id as string,
    title: row.title as string,
    summary: (row.summary ?? "") as string,
    source: {
      kind: (row.source_kind ?? "report") as PullRequest["source"]["kind"],
      id: (row.source_id ?? row.id) as string,
      label: (row.source_label ?? "") as string,
      excerpt: (row.source_excerpt as string) ?? undefined,
      at: (row.source_at as string) ?? (row.opened_at as string),
      author: (row.source_author as string) ?? undefined,
    },
    proposed: deltas.map((d) => ({
      factKey: d.fact_key as string,
      label: d.label as string,
      before: (d.before_value as string) ?? undefined,
      after: d.after_value as string,
      impact: (d.impact as string) ?? undefined,
    })),
    conflicts: conflicts.map((c) => ({
      factKey: c.fact_key as string,
      label: c.label as string,
      before: c.before_value as string,
      after: c.after_value as string,
      severity: c.severity as "low" | "medium" | "high",
      rationale: c.rationale as string,
    })),
    status: row.status as PullRequest["status"],
    agentVerdict: (row.agent_verdict ?? "") as string,
    openedAt: row.opened_at as string,
    author: {
      name: row.author_name as string,
      role: row.author_role as string,
    },
  };
}

function toMeeting(
  row: Record<string, unknown>,
  attendees: Record<string, unknown>[],
  transcript: Record<string, unknown>[],
  agentNotes: Record<string, unknown>[],
): Meeting {
  return {
    id: row.id as string,
    patientId: row.patient_id as string,
    title: row.title as string,
    date: row.date as string,
    durationMin: row.duration_min as number,
    status: row.status as Meeting["status"],
    summary: (row.summary as string) ?? undefined,
    proposedPRIds: (row.proposed_pr_ids as string[]) ?? [],
    attendees: attendees.map((a) => ({
      name: a.name as string,
      role: a.role as string,
      tone: (a.tone as Meeting["attendees"][0]["tone"]) ?? undefined,
    })),
    transcript: transcript.map((t) => ({
      id: t.id as string,
      speaker: t.speaker as string,
      role: t.role as string,
      tone: (t.tone as AvatarTone) ?? undefined,
      at: t.at as string,
      text: t.text as string,
    })),
    agentNotes: agentNotes.map((n) => ({
      id: n.id as string,
      at: n.at as string,
      text: n.text as string,
      attachedToLineId: (n.attached_to_line_id as string) ?? undefined,
    })),
  };
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export async function getAllPatients(): Promise<Patient[]> {
  if (!USE_SUPABASE) return mockPatients;

  const db = await supabase();
  const { data: rows } = await db.from("patients").select("*").order("name");
  if (!rows?.length) return [];

  const patientPromises = rows.map((row) => buildPatient(row));
  return Promise.all(patientPromises);
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  if (!USE_SUPABASE) return mockGetPatient(id);

  const db = await supabase();
  let query = db.from("patients").select("*");
  if (UUID_RE.test(id)) {
    query = query.or(`slug.eq.${id},id.eq.${id}`);
  } else {
    query = query.eq("slug", id);
  }
  const { data: row } = await query.single();

  if (!row) return undefined;
  return buildPatient(row);
}

export async function patientsByStatus(
  status: Patient["status"],
): Promise<Patient[]> {
  if (!USE_SUPABASE) return mockPatientsByStatus(status);

  const db = await supabase();
  const { data: rows } = await db
    .from("patients")
    .select("*")
    .eq("status", status)
    .order("name");

  if (!rows?.length) return [];
  return Promise.all(rows.map((row) => buildPatient(row)));
}

async function buildPatient(row: Record<string, unknown>): Promise<Patient> {
  const db = await supabase();
  const pid = row.id as string;
  const slug = (row.slug ?? pid) as string;

  const [
    { data: facts },
    { data: phases },
    { data: avatars },
    { data: options },
    { data: boardCases },
    { data: currentAction },
    { data: questions },
    { data: events },
  ] = await Promise.all([
    db.from("facts").select("*").eq("patient_id", pid),
    db.from("treatment_phases").select("*").eq("patient_id", pid).order("sort_order"),
    db.from("vault_avatars").select("*").eq("patient_id", pid).order("sort_order"),
    db.from("treatment_options").select("*").eq("patient_id", pid).order("sort_order"),
    db.from("board_cases").select("*").eq("patient_id", pid).limit(1),
    db.from("agent_current_action").select("*").eq("patient_id", pid).maybeSingle(),
    db.from("agent_questions").select("*").eq("patient_id", pid).eq("answered", false),
    db.from("agent_events").select("*").eq("patient_id", pid).order("created_at", { ascending: false }).limit(5),
  ]);

  let boardCase: BoardCase | undefined;
  if (boardCases?.[0]) {
    const bc = boardCases[0];
    const { data: attendees } = await db
      .from("board_attendees")
      .select("*")
      .eq("board_case_id", bc.id);
    boardCase = {
      id: bc.id,
      patientId: slug,
      question: bc.question,
      openedAt: bc.opened_at,
      openedFromIssue: bc.opened_from_issue ?? undefined,
      attendees: (attendees ?? []).map((a: Record<string, unknown>) => ({
        name: a.name as string,
        role: a.role as string,
        tone: (a.tone as BoardCase["attendees"][0]["tone"]) ?? undefined,
      })),
      status: bc.status,
      decidedOptionId: bc.decided_option_id ?? null,
      decidedAt: bc.decided_at ?? undefined,
      decidedBy: bc.decided_by ?? undefined,
    };
  }

  let builtOptions: TreatmentOption[] | undefined;
  if (options?.length) {
    const optIds = options.map((o: Record<string, unknown>) => o.id as string);
    const [{ data: rankings }, { data: optPhases }] = await Promise.all([
      db.from("clinician_rankings").select("*").in("option_id", optIds),
      db.from("treatment_phases").select("*").in("option_id", optIds).order("sort_order"),
    ]);

    builtOptions = options.map((o: Record<string, unknown>) => ({
      id: o.id as string,
      name: o.name as string,
      shortLabel: o.short_label as string,
      intent: o.intent as TreatmentOption["intent"],
      phases: (optPhases ?? [])
        .filter((p: Record<string, unknown>) => p.option_id === o.id)
        .map(toPhase),
      rationale: (o.rationale as string[]) ?? [],
      rationaleFactIds: (o.rationale_fact_ids as string[]) ?? [],
      outcomes: (o.outcomes as TreatmentOption["outcomes"]) ?? [],
      toxicities: (o.toxicities as TreatmentOption["toxicities"]) ?? [],
      evidence: (o.evidence as string[]) ?? [],
      burden: (o.burden as string) ?? undefined,
      rankings: (rankings ?? [])
        .filter((r: Record<string, unknown>) => r.option_id === o.id)
        .map((r: Record<string, unknown>) => ({
          specialist: r.specialist_name as string,
          specialty: r.specialty as TreatmentOption["rankings"][0]["specialty"],
          rank: r.rank as number,
          confidence: Number(r.confidence),
          note: (r.note as string) ?? undefined,
        })),
      patientFacing: (o.patient_facing as TreatmentOption["patientFacing"]) ?? undefined,
    }));
  }

  const chosenOpt = options?.find((o: Record<string, unknown>) => o.is_chosen);

  return {
    id: slug,
    name: row.name as string,
    initials: row.initials as string,
    dob: row.dob as string,
    age: row.age as number,
    sex: row.sex as Patient["sex"],
    mrn: row.mrn as string,
    status: row.status as Patient["status"],
    cancerType: row.cancer_type as string,
    cancerLabel: row.cancer_label as string,
    diagnosis: row.diagnosis as string,
    staging: row.staging as string,
    primaryOncologist: row.primary_oncologist as string,
    caseOpenedAt: row.case_opened_at as string,
    avatarTone: (row.avatar_tone ?? "violet") as Patient["avatarTone"],
    vaultAvatars: (avatars ?? []).map((a: Record<string, unknown>) => ({
      initials: a.initials as string,
      tone: a.tone as Patient["avatarTone"],
    })),
    facts: (facts ?? []).map(toFact),
    plan: (phases ?? []).filter((p: Record<string, unknown>) => !p.option_id).map(toPhase),
    options: builtOptions,
    chosenOptionId: chosenOpt ? (chosenOpt.id as string) : null,
    boardCase,
    agent: {
      now: currentAction
        ? {
            action: currentAction.action as string,
            ref: currentAction.ref_kind
              ? {
                  kind: currentAction.ref_kind as "pr" | "fact" | "meeting",
                  id: currentAction.ref_id as string,
                  label: currentAction.ref_label as string,
                }
              : undefined,
          }
        : undefined,
      needsYou: (questions ?? []).map((q: Record<string, unknown>) => ({
        id: q.id as string,
        question: q.question as string,
        detail: (q.detail as string) ?? undefined,
        ref: q.ref_kind
          ? {
              kind: q.ref_kind as "pr" | "fact" | "meeting",
              id: q.ref_id as string,
              label: q.ref_label as string,
            }
          : undefined,
        options: (q.options as string[]) ?? [],
      })),
      recent: (events ?? []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        action: e.action as string,
        at: e.created_at as string,
        ref: e.ref_kind
          ? {
              kind: e.ref_kind as "pr" | "fact" | "meeting",
              id: e.ref_id as string,
              label: e.ref_label as string,
            }
          : undefined,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Pull Requests (Review Items)
// ---------------------------------------------------------------------------

export async function getAllPullRequests(): Promise<PullRequest[]> {
  if (!USE_SUPABASE) return mockPullRequests;

  const db = await supabase();
  const { data: rows } = await db
    .from("review_items")
    .select("*")
    .order("opened_at", { ascending: false });
  if (!rows?.length) return [];

  return Promise.all(rows.map((row) => buildPullRequest(row)));
}

export async function prsForPatient(patientId: string): Promise<PullRequest[]> {
  if (!USE_SUPABASE) return mockPrsForPatient(patientId);

  const db = await supabase();
  const pid = await resolvePatientId(patientId);
  if (!pid) return [];

  const { data: rows } = await db
    .from("review_items")
    .select("*")
    .eq("patient_id", pid)
    .order("opened_at", { ascending: false });
  if (!rows?.length) return [];

  return Promise.all(rows.map((row) => buildPullRequest(row)));
}

export async function prById(id: string): Promise<PullRequest | undefined> {
  if (!USE_SUPABASE) return mockPrById(id);

  const db = await supabase();
  const { data: row } = await db.from("review_items").select("*").eq("id", id).single();
  if (!row) return undefined;
  return buildPullRequest(row);
}

async function buildPullRequest(row: Record<string, unknown>): Promise<PullRequest> {
  const db = await supabase();
  const rid = row.id as string;

  const [{ data: deltas }, { data: conflicts }] = await Promise.all([
    db.from("review_deltas").select("*").eq("review_item_id", rid).order("sort_order"),
    db.from("review_conflicts").select("*").eq("review_item_id", rid),
  ]);

  const slug = await resolvePatientSlug(row.patient_id as string);
  const pr = toPullRequest(row, deltas ?? [], conflicts ?? []);
  pr.patientId = slug ?? (row.patient_id as string);
  return pr;
}

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------

export async function getAllMeetings(): Promise<Meeting[]> {
  if (!USE_SUPABASE) return mockMeetings;

  const db = await supabase();
  const { data: rows } = await db.from("meetings").select("*").order("date", { ascending: false });
  if (!rows?.length) return [];
  return Promise.all(rows.map((row) => buildMeeting(row)));
}

export async function meetingsForPatient(patientId: string): Promise<Meeting[]> {
  if (!USE_SUPABASE) return mockMeetingsForPatient(patientId);

  const db = await supabase();
  const pid = await resolvePatientId(patientId);
  if (!pid) return [];

  const { data: rows } = await db
    .from("meetings")
    .select("*")
    .eq("patient_id", pid)
    .order("date", { ascending: false });
  if (!rows?.length) return [];
  return Promise.all(rows.map((row) => buildMeeting(row)));
}

export async function meetingById(id: string): Promise<Meeting | undefined> {
  if (!USE_SUPABASE) return mockMeetingById(id);

  const db = await supabase();
  const { data: row } = await db.from("meetings").select("*").eq("id", id).single();
  if (!row) return undefined;
  return buildMeeting(row);
}

async function buildMeeting(row: Record<string, unknown>): Promise<Meeting> {
  const db = await supabase();
  const mid = row.id as string;

  const [{ data: attendees }, { data: transcript }, { data: notes }] = await Promise.all([
    db.from("meeting_attendees").select("*").eq("meeting_id", mid),
    db.from("transcript_lines").select("*").eq("meeting_id", mid).order("sort_order"),
    db.from("agent_notes").select("*").eq("meeting_id", mid),
  ]);

  const slug = await resolvePatientSlug(row.patient_id as string);
  const meeting = toMeeting(row, attendees ?? [], transcript ?? [], notes ?? []);
  meeting.patientId = slug ?? (row.patient_id as string);
  return meeting;
}

// ---------------------------------------------------------------------------
// Follow-up
// ---------------------------------------------------------------------------

export async function getAllFollowupItems(): Promise<FollowupItem[]> {
  if (!USE_SUPABASE) return mockFollowupItems;

  const db = await supabase();
  const { data: rows } = await db.from("followup_items").select("*").order("date");
  if (!rows?.length) return [];

  const results: FollowupItem[] = [];
  for (const row of rows) {
    const slug = await resolvePatientSlug(row.patient_id as string);
    results.push({
      id: row.id as string,
      patientId: slug ?? (row.patient_id as string),
      date: row.date as string,
      type: row.type as FollowupItem["type"],
      label: row.label as string,
      prep: (row.prep as string) ?? undefined,
      status: row.status as FollowupItem["status"],
    });
  }
  return results;
}

export async function followupForPatient(patientId: string): Promise<FollowupItem[]> {
  if (!USE_SUPABASE) return mockFollowupForPatient(patientId);

  const db = await supabase();
  const pid = await resolvePatientId(patientId);
  if (!pid) return [];

  const { data: rows } = await db
    .from("followup_items")
    .select("*")
    .eq("patient_id", pid)
    .order("date");
  if (!rows?.length) return [];

  return rows.map((row) => ({
    id: row.id as string,
    patientId,
    date: row.date as string,
    type: row.type as FollowupItem["type"],
    label: row.label as string,
    prep: (row.prep as string) ?? undefined,
    status: row.status as FollowupItem["status"],
  }));
}

// ---------------------------------------------------------------------------
// Guidelines
// ---------------------------------------------------------------------------

export async function guidelinesFor(
  patientId: string,
): Promise<GuidelinesGraph | undefined> {
  if (!USE_SUPABASE) return mockGuidelinesFor(patientId);

  const db = await supabase();
  const pid = await resolvePatientId(patientId);
  if (!pid) return undefined;

  const { data: link } = await db
    .from("patient_guidelines")
    .select("guideline_id")
    .eq("patient_id", pid)
    .limit(1)
    .maybeSingle();
  if (!link) return undefined;

  const gid = link.guideline_id as string;
  const [{ data: guideline }, { data: nodes }, { data: edges }] = await Promise.all([
    db.from("guidelines").select("*").eq("id", gid).single(),
    db.from("guideline_nodes").select("*").eq("guideline_id", gid).order("sort_order"),
    db.from("guideline_edges").select("*").eq("guideline_id", gid),
  ]);

  if (!guideline) return undefined;

  return {
    cancerType: guideline.cancer_type as string,
    title: guideline.title as string,
    source: guideline.source as string,
    nodes: (nodes ?? []).map((n: Record<string, unknown>) => ({
      id: n.node_key as string,
      label: n.label as string,
      detail: (n.detail as string) ?? undefined,
      kind: n.kind as GuidelinesGraph["nodes"][0]["kind"],
      patientPath: (n.patient_path as boolean) ?? false,
      factKey: (n.fact_key as string) ?? undefined,
    })),
    edges: (edges ?? []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      source: e.source_node_key as string,
      target: e.target_node_key as string,
      label: (e.label as string) ?? undefined,
      patientPath: (e.patient_path as boolean) ?? false,
    })),
  };
}

// ---------------------------------------------------------------------------
// Sources & Agents
// ---------------------------------------------------------------------------

export async function getAllDataSources(): Promise<DataSource[]> {
  if (!USE_SUPABASE) return mockDataSources;

  const db = await supabase();
  const { data: rows } = await db.from("data_sources").select("*");
  if (!rows?.length) return [];

  return rows.map((row) => ({
    id: row.id as string,
    label: row.label as string,
    kind: row.kind as DataSource["kind"],
    status: row.status as DataSource["status"],
    lastSync: (row.last_sync ?? "") as string,
    frequency: (row.frequency ?? "") as string,
  }));
}

export async function getAllActiveAgents(): Promise<ActiveAgent[]> {
  if (!USE_SUPABASE) return mockActiveAgents;

  const db = await supabase();
  const { data: rows } = await db.from("active_agents").select("*");
  if (!rows?.length) return [];

  return rows.map((row) => {
    const slug = row.patient_id as string;
    return {
      id: row.id as string,
      name: row.name as string,
      patientId: slug,
      task: row.task as string,
      type: row.type as ActiveAgent["type"],
      status: row.status as ActiveAgent["status"],
    };
  });
}

// ---------------------------------------------------------------------------
// Slug ↔ UUID resolution (patients use slugs in URLs, UUIDs in DB)
// ---------------------------------------------------------------------------

const slugCache = new Map<string, string>();
const idCache = new Map<string, string>();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolvePatientId(slugOrId: string): Promise<string | null> {
  if (slugCache.has(slugOrId)) return slugCache.get(slugOrId)!;
  if (idCache.has(slugOrId)) return slugOrId;

  const db = await supabase();
  let query = db.from("patients").select("id, slug");
  if (UUID_RE.test(slugOrId)) {
    query = query.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`);
  } else {
    query = query.eq("slug", slugOrId);
  }
  const { data } = await query.maybeSingle();

  if (!data) return null;
  slugCache.set(data.slug, data.id);
  idCache.set(data.id, data.slug);
  return data.id;
}

async function resolvePatientSlug(uuid: string): Promise<string | null> {
  if (idCache.has(uuid)) return idCache.get(uuid)!;

  const db = await supabase();
  const { data } = await db
    .from("patients")
    .select("id, slug")
    .eq("id", uuid)
    .maybeSingle();

  if (!data) return null;
  slugCache.set(data.slug, data.id);
  idCache.set(data.id, data.slug);
  return data.slug;
}
