import { ArrowRight } from "lucide-react";
import type { Conflict, FactDelta } from "@/lib/types";

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
      <p className="text-[13px] italic text-muted-foreground">
        No record changes proposed.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {deltas.map((d, i) => {
        const c = conflictByKey.get(d.factKey);
        return (
          <li
            key={i}
            className="border-t border-border py-5 first:border-t-0 first:pt-0"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="mono text-[12.5px] font-semibold tracking-tight text-foreground">
                {d.factKey}
              </span>
              {c && (
                <span className="mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#b91c1c]">
                  {c.severity} conflict
                </span>
              )}
            </div>
            <span className="mono text-[11px] text-muted-foreground/70">
              {d.label}
            </span>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
              <div
                className={`text-[13.5px] leading-relaxed ${
                  d.before
                    ? "text-foreground/60 line-through decoration-muted-foreground/40"
                    : "italic text-muted-foreground/60"
                }`}
              >
                {d.before ?? "(new)"}
              </div>
              <ArrowRight className="hidden h-4 w-4 self-center text-muted-foreground/40 sm:block" />
              <div className="text-[13.5px] leading-relaxed text-foreground">
                {d.after}
                {d.impact && (
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {d.impact}
                  </p>
                )}
              </div>
            </div>

            {c && (
              <p className="mt-3 border-l-2 border-[#b91c1c] pl-3 text-[12.5px] leading-relaxed text-[#7f1d1d]">
                {c.rationale}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
