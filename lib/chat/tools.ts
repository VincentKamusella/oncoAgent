import {
  getPatient,
  prsForPatient,
  prById,
  meetingsForPatient,
  meetingById,
  followupForPatient,
  guidelinesFor,
} from "@/lib/data";

export const toolDefinitions = [
  {
    type: "function" as const,
    name: "get_patient_facts",
    description:
      "Get structured clinical facts for the current patient. Each fact includes a label, value, confidence score, source reference, and last-updated timestamp. Optionally filter by group.",
    parameters: {
      type: "object",
      properties: {
        group: {
          type: "string",
          enum: ["demographics", "diagnosis", "staging", "medication", "imaging", "lab", "history", "genomics"],
          description: "Filter facts to a specific category. Omit to get all facts.",
        },
      },
    },
  },
  {
    type: "function" as const,
    name: "get_pull_requests",
    description:
      "Get pull requests (proposed data changes) for the current patient. Each PR has a title, status, proposed field changes, conflicts, and an agent verdict.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["open", "merged", "conflict", "needs-review"],
          description: "Filter by PR status. Omit to get all PRs.",
        },
      },
    },
  },
  {
    type: "function" as const,
    name: "get_pr_details",
    description:
      "Get full details of a specific pull request including proposed changes, conflicts with severity/rationale, and the agent verdict.",
    parameters: {
      type: "object",
      properties: {
        pr_id: { type: "string", description: "The PR identifier, e.g. 'pr-tb-1'" },
      },
      required: ["pr_id"],
    },
  },
  {
    type: "function" as const,
    name: "get_treatment_plan",
    description:
      "Get the patient's full treatment plan: all phases with type, regimen, status, cycle progress, and clinical rationale.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "get_meetings",
    description:
      "Get clinical meetings and tumor board sessions for the current patient, including attendees and status.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "get_meeting_transcript",
    description:
      "Get the full transcript and agent notes for a specific meeting.",
    parameters: {
      type: "object",
      properties: {
        meeting_id: { type: "string", description: "The meeting identifier, e.g. 'mtg-tb-1'" },
      },
      required: ["meeting_id"],
    },
  },
  {
    type: "function" as const,
    name: "get_followup_schedule",
    description:
      "Get upcoming follow-up items: scheduled labs, imaging, visits, and discussions with dates and prep instructions.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "get_guidelines",
    description:
      "Get the clinical guideline decision pathway for this patient's cancer type, showing which nodes are on the patient's path.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "get_board_case",
    description:
      "Get the active tumor board case for this patient, including the clinical question, attendees, status, and any decision made.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "get_treatment_options",
    description:
      "Get treatment options under review for this patient. Each option includes intent, regimen phases, rationale, expected outcomes, toxicities, evidence citations, and clinician rankings.",
    parameters: { type: "object", properties: {} },
  },
];

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  patientId: string
): Promise<unknown> {
  switch (name) {
    case "get_patient_facts": {
      const patient = await getPatient(patientId);
      if (!patient) return { error: "Patient not found" };
      const group = args.group as string | undefined;
      const facts = group
        ? patient.facts.filter((f) => f.group === group)
        : patient.facts;
      return facts.map((f) => ({
        key: f.key,
        label: f.label,
        value: f.value,
        group: f.group,
        confidence: f.confidence,
        source: f.source.label,
        updatedAt: f.updatedAt,
        ...(f.specialty && { specialty: f.specialty }),
      }));
    }

    case "get_pull_requests": {
      const prs = await prsForPatient(patientId);
      const status = args.status as string | undefined;
      const filtered = status ? prs.filter((p) => p.status === status) : prs;
      return filtered.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        summary: p.summary,
        author: p.author,
        agentVerdict: p.agentVerdict,
        conflictCount: p.conflicts.length,
        openedAt: p.openedAt,
      }));
    }

    case "get_pr_details": {
      const pr = await prById(args.pr_id as string);
      if (!pr) return { error: "PR not found" };
      return {
        id: pr.id,
        title: pr.title,
        status: pr.status,
        summary: pr.summary,
        source: pr.source,
        author: pr.author,
        proposed: pr.proposed,
        conflicts: pr.conflicts,
        agentVerdict: pr.agentVerdict,
        openedAt: pr.openedAt,
      };
    }

    case "get_treatment_plan": {
      const patient = await getPatient(patientId);
      if (!patient) return { error: "Patient not found" };
      return patient.plan.map((p) => ({
        name: p.name,
        type: p.type,
        regimen: p.regimen,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        cycles: p.cycles,
        rationale: p.rationale,
      }));
    }

    case "get_meetings": {
      return (await meetingsForPatient(patientId)).map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        status: m.status,
        attendees: m.attendees.map((a) => `${a.name} (${a.role})`),
        hasTranscript: !!m.transcript,
      }));
    }

    case "get_meeting_transcript": {
      const meeting = await meetingById(args.meeting_id as string);
      if (!meeting) return { error: "Meeting not found" };
      return {
        title: meeting.title,
        date: meeting.date,
        transcript: meeting.transcript ?? [],
        agentNotes: meeting.agentNotes ?? [],
        summary: meeting.summary ?? null,
      };
    }

    case "get_followup_schedule": {
      return (await followupForPatient(patientId)).map((f) => ({
        date: f.date,
        type: f.type,
        label: f.label,
        status: f.status,
        prep: f.prep ?? null,
      }));
    }

    case "get_guidelines": {
      const g = await guidelinesFor(patientId);
      if (!g) return { error: "No guidelines available for this cancer type" };
      return {
        cancerType: g.cancerType,
        title: g.title,
        source: g.source,
        patientPath: g.nodes
          .filter((n) => n.patientPath)
          .map((n) => ({ label: n.label.replace(/\n/g, " "), kind: n.kind })),
      };
    }

    case "get_board_case": {
      const patient = await getPatient(patientId);
      if (!patient) return { error: "Patient not found" };
      if (!patient.boardCase) return { info: "No active board case for this patient" };
      const bc = patient.boardCase;
      return {
        id: bc.id,
        question: bc.question,
        status: bc.status,
        openedAt: bc.openedAt,
        attendees: bc.attendees.map((a) => `${a.name} (${a.role})`),
        decidedOptionId: bc.decidedOptionId ?? null,
        decidedAt: bc.decidedAt ?? null,
        decidedBy: bc.decidedBy ?? null,
      };
    }

    case "get_treatment_options": {
      const patient = await getPatient(patientId);
      if (!patient) return { error: "Patient not found" };
      if (!patient.options || patient.options.length === 0)
        return { info: "No treatment options under review for this patient" };
      return {
        chosenOptionId: patient.chosenOptionId ?? null,
        options: patient.options.map((opt) => ({
          id: opt.id,
          name: opt.name,
          shortLabel: opt.shortLabel,
          intent: opt.intent,
          rationale: opt.rationale,
          outcomes: opt.outcomes,
          toxicities: opt.toxicities,
          evidence: opt.evidence,
          burden: opt.burden ?? null,
          rankings: opt.rankings.map((r) => ({
            specialist: r.specialist,
            specialty: r.specialty,
            rank: r.rank,
            confidence: r.confidence,
            note: r.note ?? null,
          })),
          phases: opt.phases.map((p) => ({
            name: p.name,
            type: p.type,
            regimen: p.regimen,
            status: p.status,
          })),
        })),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
