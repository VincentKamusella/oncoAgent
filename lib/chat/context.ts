import type { Patient, PullRequest } from "@/lib/types";
import {
  prsForPatient,
  prById,
  meetingsForPatient,
  meetingById,
  followupForPatient,
  guidelinesFor,
} from "@/lib/data";

export function buildPatientSummary(patient: Patient): string {
  const activePhase = patient.plan.find((p) => p.status === "in-progress");
  const lines: string[] = [
    `## Patient: ${patient.name}`,
    `- ${patient.age}${patient.sex} | MRN ${patient.mrn} | Status: ${patient.status}`,
    `- Diagnosis: ${patient.diagnosis}`,
    `- Staging: ${patient.staging}`,
    `- Cancer: ${patient.cancerLabel}`,
    `- Primary oncologist: ${patient.primaryOncologist}`,
  ];

  if (activePhase) {
    lines.push(``, `## Active Treatment`, `- ${activePhase.name} (${activePhase.type})`);
    if (activePhase.regimen) lines.push(`- Regimen: ${activePhase.regimen}`);
    if (activePhase.cycles)
      lines.push(`- Cycle ${activePhase.cycles.completed}/${activePhase.cycles.total}`);
  }

  if (patient.agent.now) {
    lines.push(``, `## Agent Activity`, `- ${patient.agent.now.action}`);
  }

  if (patient.agent.needsYou.length > 0) {
    lines.push(``, `## Pending Decisions`);
    for (const q of patient.agent.needsYou) {
      lines.push(`- ⚠ ${q.question}`);
      if (q.detail) lines.push(`  ${q.detail}`);
      if (q.options) lines.push(`  Options: ${q.options.join(" · ")}`);
    }
  }

  if (patient.boardCase) {
    const bc = patient.boardCase;
    lines.push(``, `## Board Case`, `- Question: ${bc.question}`, `- Status: ${bc.status}`);
    if (bc.decidedOptionId) lines.push(`- Decision: option ${bc.decidedOptionId}`);
  }

  return lines.join("\n");
}

function formatPR(pr: PullRequest): string {
  const lines = [
    `### PR: ${pr.title}`,
    `Status: ${pr.status} | Author: ${pr.author.name} (${pr.author.role})`,
    `Summary: ${pr.summary}`,
  ];
  if (pr.proposed.length > 0) {
    lines.push(``, `Proposed changes:`);
    for (const d of pr.proposed) {
      lines.push(`- ${d.label}: ${d.before ? `${d.before} → ` : ""}${d.after}`);
      if (d.impact) lines.push(`  Impact: ${d.impact}`);
    }
  }
  if (pr.conflicts.length > 0) {
    lines.push(``, `Conflicts:`);
    for (const c of pr.conflicts) {
      lines.push(`- [${c.severity.toUpperCase()}] ${c.label}: ${c.before} → ${c.after}`);
      lines.push(`  ${c.rationale}`);
    }
  }
  lines.push(``, `Agent verdict: ${pr.agentVerdict}`);
  return lines.join("\n");
}

const viewBuilders: Record<string, (patientId: string, patient: Patient) => string | Promise<string>> = {
  vault: (patientId, patient) => {
    const groups = new Map<string, typeof patient.facts>();
    for (const f of patient.facts) {
      const list = groups.get(f.group) ?? [];
      list.push(f);
      groups.set(f.group, list);
    }
    const lines = [`## Vault — Structured Facts (all specialties)`];
    for (const [group, facts] of groups) {
      lines.push(`### ${group}`);
      for (const f of facts)
        lines.push(`- ${f.label}: ${f.value} (${f.source.label})${f.specialty ? ` [${f.specialty}]` : ""}`);
    }
    return lines.join("\n");
  },

  inbox: async (patientId, patient) => {
    const prs = await prsForPatient(patientId);
    const followups = await followupForPatient(patientId);
    const upcoming = followups.filter((f) => f.status === "scheduled");
    const lines = [`## Inbox`];

    const openPrs = prs.filter((p) => p.status !== "merged");
    if (openPrs.length > 0) {
      lines.push(`### Open PRs`);
      for (const p of openPrs)
        lines.push(`- ${p.title} [${p.status}] — ${p.agentVerdict}`);
    }

    if (patient.agent.needsYou.length > 0) {
      lines.push(``, `### Agent Questions`);
      for (const q of patient.agent.needsYou) {
        lines.push(`- ${q.question}`);
        if (q.options) lines.push(`  Options: ${q.options.join(" · ")}`);
      }
    }

    if (upcoming.length > 0) {
      lines.push(``, `### Upcoming Follow-ups`);
      for (const f of upcoming)
        lines.push(`- ${f.date}: ${f.label} (${f.type})${f.prep ? ` — Prep: ${f.prep}` : ""}`);
    }

    return lines.join("\n");
  },

  board: async (patientId, patient) => {
    const meetings = await meetingsForPatient(patientId);
    const lines = [`## Board`];

    if (patient.boardCase) {
      const bc = patient.boardCase;
      lines.push(
        `### Active Case`,
        `- Question: ${bc.question}`,
        `- Status: ${bc.status}`,
        `- Attendees: ${bc.attendees.map((a) => `${a.name} (${a.role})`).join(", ")}`,
      );
    }

    if (patient.options && patient.options.length > 0) {
      lines.push(``, `### Treatment Options Under Review`);
      for (const opt of patient.options) {
        lines.push(`- **${opt.name}** (${opt.intent}) — ${opt.shortLabel}`);
        lines.push(`  Rationale: ${opt.rationale.join("; ")}`);
        if (opt.outcomes.length > 0)
          lines.push(`  Outcomes: ${opt.outcomes.map((o) => `${o.label}: ${o.value}`).join(", ")}`);
        if (opt.burden) lines.push(`  Burden: ${opt.burden}`);
      }
      if (patient.chosenOptionId) {
        const chosen = patient.options.find((o) => o.id === patient.chosenOptionId);
        if (chosen) lines.push(``, `Chosen option: ${chosen.name}`);
      }
    }

    if (meetings.length > 0) {
      lines.push(``, `### Meetings`);
      for (const m of meetings)
        lines.push(`- ${m.title} (${m.date}) [${m.status}] — ${m.attendees.map((a) => a.name).join(", ")}`);
    }

    return lines.join("\n");
  },

  prs: async (patientId) => {
    const prs = await prsForPatient(patientId);
    return [`## All Pull Requests`, ...prs.map((p) => `- ${p.title} [${p.status}] — ${p.agentVerdict}`)].join("\n");
  },

  plan: (_patientId, patient) => {
    return [
      `## Treatment Plan`,
      ...patient.plan.map((p) => {
        let line = `- ${p.name} (${p.type}) [${p.status}]`;
        if (p.regimen) line += ` — ${p.regimen}`;
        if (p.cycles) line += ` | Cycle ${p.cycles.completed}/${p.cycles.total}`;
        if (p.rationale) line += `\n  Rationale: ${p.rationale}`;
        return line;
      }),
    ].join("\n");
  },

  meetings: async (patientId) => {
    const meetings = await meetingsForPatient(patientId);
    return [`## Meetings`, ...meetings.map((m) => `- ${m.title} (${m.date}) [${m.status}]`)].join("\n");
  },

  guidelines: async (patientId) => {
    const g = await guidelinesFor(patientId);
    if (!g) return "No guidelines available for this cancer type.";
    const pathNodes = g.nodes.filter((n) => n.patientPath);
    return [
      `## Guideline Pathway: ${g.title}`,
      `Source: ${g.source}`,
      `Patient's path: ${pathNodes.map((n) => n.label.replace(/\n/g, " ")).join(" → ")}`,
    ].join("\n");
  },

  followup: async (patientId) => {
    const items = await followupForPatient(patientId);
    return [
      `## Follow-up Schedule`,
      ...items.map((f) => `- ${f.date}: ${f.label} (${f.type}) [${f.status}]${f.prep ? ` — Prep: ${f.prep}` : ""}`),
    ].join("\n");
  },
};

export async function buildViewContext(patientId: string, view: string, patient: Patient): Promise<string> {
  if (view.startsWith("pr:")) {
    const pr = await prById(view.slice(3));
    if (!pr) return "PR not found.";
    return formatPR(pr);
  }

  if (view.startsWith("meeting:")) {
    const meeting = await meetingById(view.slice(8));
    if (!meeting) return "Meeting not found.";
    const lines = [
      `## Meeting: ${meeting.title}`,
      `Date: ${meeting.date} | Status: ${meeting.status}`,
      `Attendees: ${meeting.attendees.map((a) => `${a.name} (${a.role})`).join(", ")}`,
    ];
    if (meeting.transcript) {
      lines.push(``, `### Transcript`);
      for (const t of meeting.transcript)
        lines.push(`[${t.at}] ${t.speaker}: ${t.text}`);
    }
    if (meeting.agentNotes) {
      lines.push(``, `### Agent Notes`);
      for (const n of meeting.agentNotes) lines.push(`- ${n.text}`);
    }
    if (meeting.summary) lines.push(``, `### Summary`, meeting.summary);
    return lines.join("\n");
  }

  // Vault with specialty filter (vault:pathology, vault:radiology, etc.)
  if (view.startsWith("vault:")) {
    const specialty = view.slice(6);
    const filtered = patient.facts.filter((f) => f.specialty === specialty);
    const groups = new Map<string, typeof patient.facts>();
    for (const f of filtered) {
      const list = groups.get(f.group) ?? [];
      list.push(f);
      groups.set(f.group, list);
    }
    const lines = [`## Vault — ${specialty} facts`];
    if (filtered.length === 0) {
      lines.push(`No facts found for specialty "${specialty}".`);
    } else {
      for (const [group, facts] of groups) {
        lines.push(`### ${group}`);
        for (const f of facts)
          lines.push(`- ${f.label}: ${f.value} (${f.source.label})`);
      }
    }
    return lines.join("\n");
  }

  const builder = viewBuilders[view];
  if (builder) return await builder(patientId, patient);

  const prs = await prsForPatient(patientId);
  const openPrs = prs.filter((p) => p.status !== "merged");
  return [
    `## Current View: ${view}`,
    `(No specific context handler for this view — use tools to look up relevant data.)`,
    openPrs.length > 0
      ? `Open PRs: ${openPrs.map((p) => `${p.title} [${p.status}]`).join(", ")}`
      : "No open PRs.",
  ].join("\n");
}

export async function buildSystemPrompt(patient: Patient, view: string): Promise<string> {
  const summary = buildPatientSummary(patient);
  const viewCtx = await buildViewContext(patient.id, view, patient);

  return `You are the Cliniarc agent — an AI copilot embedded in an IDE for cancer care called Cliniarc.
You assist Dr. Mei Okonkwo with patient record review, conflict detection, and tumor board preparation.

Your responsibilities:
1. Conflict detection — flag contradictions in patient data (medication conflicts, staging mismatches, temporal inconsistencies)
2. Pattern detection — identify clinical patterns across recent data (rising markers + imaging findings = recurrence suspicion)
3. Case assembly — compile relevant information for tumor board review

The app has three main sections:
- Vault: structured clinical facts organized by specialty (filterable by specialty: pathology, radiology, med-onc, nursing, etc.)
- Inbox: open PRs (proposed data changes), agent questions needing clinician input, and upcoming follow-ups
- Board: tumor board cases, treatment options under review, and meetings

${summary}

## Current View
The clinician is viewing: ${view}
${viewCtx}

## Rules
- Cite data sources when referencing facts (e.g. "per the MRI report from 2026-04-22")
- Use Cliniarc vocabulary: PR (proposed change), merge, conflict, commit, sign off
- Flag contradictions proactively
- Be concise and clinical — short paragraphs, no filler
- When uncertain, say so and suggest which data to check
- Use your tools to look up additional patient data when the question goes beyond your current context
- You can also traverse the patient's knowledge graph to explore relationships between clinical data points — use the traverse_graph tool when asked about dependencies, evidence chains, conflicts, or who contributed what.
- Never fabricate clinical data — only reference what exists in the patient record
- Today is 2026-04-25.`;
}
