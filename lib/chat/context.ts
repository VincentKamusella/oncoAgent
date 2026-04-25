import type { Patient, PullRequest } from "@/lib/types";
import { prsForPatient, prById } from "@/lib/mock-data/prs";
import { meetingsForPatient, meetingById } from "@/lib/mock-data/meetings";
import { followupForPatient } from "@/lib/mock-data/followup";
import { guidelinesFor } from "@/lib/mock-data/guidelines";

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

export function buildViewContext(patientId: string, view: string, patient: Patient): string {
  if (!view || view === "overview") {
    const prs = prsForPatient(patientId);
    const openPrs = prs.filter((p) => p.status !== "merged");
    if (openPrs.length === 0) return "No open PRs.";
    return [
      `## Open Pull Requests`,
      ...openPrs.map((p) => `- ${p.title} [${p.status}] — ${p.agentVerdict}`),
    ].join("\n");
  }

  if (view === "prs") {
    const prs = prsForPatient(patientId);
    return [
      `## All Pull Requests`,
      ...prs.map((p) => `- ${p.title} [${p.status}] — ${p.agentVerdict}`),
    ].join("\n");
  }

  if (view.startsWith("pr:")) {
    const pr = prById(view.slice(3));
    if (!pr) return "PR not found.";
    return formatPR(pr);
  }

  if (view.startsWith("meeting:")) {
    const meeting = meetingById(view.slice(8));
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

  if (view === "meetings") {
    const meetings = meetingsForPatient(patientId);
    return [
      `## Meetings`,
      ...meetings.map((m) => `- ${m.title} (${m.date}) [${m.status}]`),
    ].join("\n");
  }

  if (view === "plan") {
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
  }

  if (view === "guidelines") {
    const g = guidelinesFor(patientId);
    if (!g) return "No guidelines available for this cancer type.";
    const pathNodes = g.nodes.filter((n) => n.patientPath);
    return [
      `## Guideline Pathway: ${g.title}`,
      `Source: ${g.source}`,
      `Patient's path: ${pathNodes.map((n) => n.label.replace(/\n/g, " ")).join(" → ")}`,
    ].join("\n");
  }

  if (view === "followup") {
    const items = followupForPatient(patientId);
    return [
      `## Follow-up Schedule`,
      ...items.map((f) => `- ${f.date}: ${f.label} (${f.type}) [${f.status}]${f.prep ? ` — Prep: ${f.prep}` : ""}`),
    ].join("\n");
  }

  return "";
}

export function buildSystemPrompt(patient: Patient, view: string): string {
  const summary = buildPatientSummary(patient);
  const viewCtx = buildViewContext(patient.id, view, patient);

  return `You are the Cliniarc agent — an AI copilot embedded in an IDE for cancer care called Cliniarc.
You assist Dr. Mei Okonkwo with patient record review, conflict detection, and tumor board preparation.

Your responsibilities:
1. Conflict detection — flag contradictions in patient data (medication conflicts, staging mismatches, temporal inconsistencies)
2. Pattern detection — identify clinical patterns across recent data (rising markers + imaging findings = recurrence suspicion)
3. Case assembly — compile relevant information for tumor board review

${summary}

## Current View
The clinician is viewing: ${view || "overview"}
${viewCtx}

## Rules
- Cite data sources when referencing facts (e.g. "per the MRI report from 2026-04-22")
- Use Cliniarc vocabulary: PR (proposed change), merge, conflict, commit, sign off
- Flag contradictions proactively
- Be concise and clinical — short paragraphs, no filler
- When uncertain, say so and suggest which data to check
- Use your tools to look up additional patient data when the question goes beyond your current context
- Never fabricate clinical data — only reference what exists in the patient record
- Today is 2026-04-25.`;
}
