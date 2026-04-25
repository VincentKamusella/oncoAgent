import type { PullRequest } from "@/lib/types";

export type ReviewIssueState =
  | "fail"
  | "warn"
  | "missing"
  | "info"
  | "ok"
  | "question";

export type ReviewIssue = {
  id: string;
  state: ReviewIssueState;
  title: string;
  detail?: string;
  before?: string;
  after?: string;
  impact?: string;
};

const ACTION_HINT = /required|board|escalat|monitor|consult|review|confirm/i;

export function deriveIssues(pr: PullRequest): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  for (const c of pr.conflicts) {
    issues.push({
      id: `conflict-${c.factKey}`,
      state: "fail",
      title: c.label,
      before: c.before,
      after: c.after,
      detail: c.rationale,
    });
  }

  const conflictKeys = new Set(pr.conflicts.map((c) => c.factKey));
  for (const d of pr.proposed) {
    if (conflictKeys.has(d.factKey)) continue;
    const looksLikeAction = d.impact && ACTION_HINT.test(d.impact);
    issues.push({
      id: `delta-${d.factKey}`,
      state: looksLikeAction ? "warn" : "info",
      title: d.label,
      before: d.before,
      after: d.after,
      impact: d.impact,
    });
  }

  for (const [i, gap] of (pr.gaps ?? []).entries()) {
    issues.push({
      id: `gap-${i}`,
      state: "missing",
      title: gap,
    });
  }

  if (pr.status === "merged" && issues.every((i) => i.state === "info")) {
    issues.unshift({
      id: "verified",
      state: "ok",
      title: "Verified — no concerns",
      detail: pr.agentVerdict,
    });
  }

  return issues;
}

export type IssueSummary = {
  total: number;
  high: number;
  tone: "fail" | "warn" | "missing" | "ok" | "info";
  label: string;
};

export function summarizeIssues(pr: PullRequest): IssueSummary {
  const issues = deriveIssues(pr);
  const fail = issues.filter((i) => i.state === "fail").length;
  const warn = issues.filter((i) => i.state === "warn").length;
  const missing = issues.filter((i) => i.state === "missing").length;

  if (fail > 0) {
    return {
      total: issues.length,
      high: fail,
      tone: "fail",
      label: `${fail} conflict${fail === 1 ? "" : "s"}`,
    };
  }
  if (warn > 0) {
    return {
      total: issues.length,
      high: 0,
      tone: "warn",
      label: `${warn} to review`,
    };
  }
  if (missing > 0) {
    return {
      total: issues.length,
      high: 0,
      tone: "missing",
      label: missing === 1 ? "data gap" : `${missing} data gaps`,
    };
  }
  if (pr.status === "merged") {
    return { total: issues.length, high: 0, tone: "ok", label: "verified" };
  }
  const informational = issues.filter((i) => i.state === "info").length;
  return {
    total: informational,
    high: 0,
    tone: "info",
    label: `${informational} change${informational === 1 ? "" : "s"}`,
  };
}
