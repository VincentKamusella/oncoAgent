import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CircleDashed,
  CheckCircle2,
  HelpCircle,
  Plus,
} from "lucide-react";
import type { ReviewIssue, ReviewIssueState } from "./derive-issues";

const STATE_COLOR: Record<ReviewIssueState, string> = {
  fail: "#b91c1c",
  warn: "#b45309",
  missing: "#475569",
  info: "#0f1f4d",
  ok: "#15803d",
  question: "#0f1f4d",
};

const STATE_LABEL: Record<ReviewIssueState, string> = {
  fail: "Conflict",
  warn: "Review",
  missing: "Missing",
  info: "Recorded",
  ok: "Verified",
  question: "Question",
};

function StateGlyph({ state }: { state: ReviewIssueState }) {
  const color = STATE_COLOR[state];
  const Icon = {
    fail: AlertOctagon,
    warn: AlertTriangle,
    missing: CircleDashed,
    info: Plus,
    ok: CheckCircle2,
    question: HelpCircle,
  }[state];
  return (
    <span
      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center"
      style={{ color }}
      aria-hidden
    >
      <Icon className="h-4 w-4" strokeWidth={2.25} />
    </span>
  );
}

export function IssueRow({ issue }: { issue: ReviewIssue }) {
  const tag = STATE_LABEL[issue.state];
  const tone = STATE_COLOR[issue.state];

  return (
    <li className="flex items-start gap-4 border-t border-border py-4 first:border-t-0 first:pt-0">
      <StateGlyph state={issue.state} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="text-[14px] font-semibold leading-snug tracking-tight text-foreground">
            {issue.title}
          </h4>
          <span
            className="mono flex-shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: tone }}
          >
            {tag}
          </span>
        </div>

        {(issue.before || issue.after) && (
          <p className="mono mt-1.5 flex flex-wrap items-center gap-1.5 text-[12.5px] leading-relaxed">
            {issue.before && (
              <span className="text-foreground/55 line-through decoration-muted-foreground/40">
                {issue.before}
              </span>
            )}
            {issue.before && issue.after && (
              <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
            )}
            {issue.after && (
              <span className="text-foreground">{issue.after}</span>
            )}
          </p>
        )}

        {issue.detail && (
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            {issue.detail}
          </p>
        )}

        {issue.impact && (
          <p className="mt-2 text-[12.5px] italic leading-relaxed text-foreground/70">
            {issue.impact}
          </p>
        )}
      </div>
    </li>
  );
}
