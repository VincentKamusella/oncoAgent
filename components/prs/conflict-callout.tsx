import { AlertOctagon } from "lucide-react";
import type { Conflict } from "@/lib/types";
import { FactMono } from "@/components/ui/fact-mono";
import { StatusPill } from "@/components/ui/status-pill";

const SEVERITY_TONE = {
  high: "conflict",
  medium: "warn",
  low: "info",
} as const;

export function ConflictCallout({ conflicts }: { conflicts: Conflict[] }) {
  if (!conflicts.length) return null;

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
      <header className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-100">
          <AlertOctagon className="h-4 w-4 text-rose-600" />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-rose-900">
            {conflicts.length} conflict{conflicts.length === 1 ? "" : "s"} block auto-merge
          </h3>
          <p className="text-[12px] text-rose-900/70">
            These changes contradict facts already in the vault. Resolve before merging.
          </p>
        </div>
      </header>

      <ul className="mt-4 flex flex-col gap-3">
        {conflicts.map((c, i) => (
          <li key={i} className="rounded-xl border border-rose-200 bg-white p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FactMono className="text-foreground/80">{c.factKey}</FactMono>
                <span className="text-[11.5px] text-muted-foreground">{c.label}</span>
              </div>
              <StatusPill tone={SEVERITY_TONE[c.severity]}>
                {c.severity} severity
              </StatusPill>
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-[12.5px]">
                <div className="mb-0.5 mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  In vault
                </div>
                {c.before}
              </div>
              <div className="rounded-md border border-rose-200 bg-rose-50/40 px-2.5 py-1.5 text-[12.5px]">
                <div className="mb-0.5 mono text-[10px] uppercase tracking-wider text-rose-700/80">
                  Proposed
                </div>
                {c.after}
              </div>
            </div>
            <p className="mt-2.5 text-[12px] leading-snug text-rose-900/80">{c.rationale}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
