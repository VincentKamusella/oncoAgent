import { ArrowRight, Plus, Minus } from "lucide-react";
import type { Conflict, FactDelta } from "@/lib/types";
import { FactMono } from "@/components/ui/fact-mono";

/**
 * Side-by-side before/after diff with conflicts annotated inline (no separate
 * red panel — keeps things compact while preserving the qontext card frame).
 */
export function PRDiff({
  deltas,
  conflicts = [],
}: {
  deltas: FactDelta[];
  conflicts?: Conflict[];
}) {
  const conflictByKey = new Map(conflicts.map((c) => [c.factKey, c]));

  if (deltas.length === 0) {
    return (
      <p className="text-[13px] italic text-muted-foreground">No record changes proposed.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-[160px_1fr_1fr] border-b border-border bg-muted/40 px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>Record</span>
        <span className="flex items-center gap-1.5">
          <Minus className="h-3 w-3 text-rose-500" />
          Before
        </span>
        <span className="flex items-center gap-1.5">
          <Plus className="h-3 w-3 text-emerald-500" />
          After
        </span>
      </div>
      <ul className="divide-y divide-border">
        {deltas.map((d, i) => {
          const c = conflictByKey.get(d.factKey);
          return (
            <li key={i} className="grid grid-cols-[160px_1fr_1fr] items-start gap-3 px-4 py-3.5">
              <FactMono className="text-[12px] leading-snug text-muted-foreground">
                {d.factKey}
                <div className="mt-0.5 text-[11.5px] text-muted-foreground/70 normal-case">
                  {d.label}
                </div>
                {c && (
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                    <span className="block h-1.5 w-1.5 rounded-full bg-rose-500" />
                    {c.severity} conflict
                  </div>
                )}
              </FactMono>
              <div
                className={`rounded-md border px-2.5 py-1.5 text-[12.5px] leading-snug ${
                  d.before
                    ? "border-rose-100 bg-rose-50/60 text-foreground/80 line-through decoration-rose-300/60"
                    : "border-dashed border-border bg-muted/40 text-muted-foreground italic"
                }`}
              >
                {d.before ?? "(new)"}
              </div>
              <div className="rounded-md border border-emerald-100 bg-emerald-50/50 px-2.5 py-1.5 text-[12.5px] font-medium leading-snug text-emerald-900">
                <div className="flex items-start gap-1.5">
                  <ArrowRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-600" />
                  <div>
                    {d.after}
                    {d.impact && (
                      <p className="mt-1 text-[11.5px] font-normal text-emerald-800/70">
                        {d.impact}
                      </p>
                    )}
                    {c && (
                      <p className="mt-1.5 rounded-md border border-rose-200 bg-rose-50/70 px-2 py-1 text-[11px] leading-snug text-rose-900/90">
                        {c.rationale}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
