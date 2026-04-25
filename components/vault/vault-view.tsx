"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Upload } from "lucide-react";
import type { Fact, Specialty } from "@/lib/types";
import { specialtyMeta } from "./specialist-tree";
import { ProvenancePopover } from "@/components/overview/provenance-popover";
import { cn } from "@/lib/utils";

const GROUP_LABEL: Record<NonNullable<Fact["group"]>, string> = {
  demographics: "Demographics",
  diagnosis: "Diagnosis",
  staging: "Staging",
  medication: "Medication",
  imaging: "Imaging",
  lab: "Lab",
  history: "History",
  genomics: "Genomics",
};

const VALID_SPECIALTIES: Specialty[] = [
  "pathology",
  "radiology",
  "med-onc",
  "surg-onc",
  "rad-onc",
  "molecular",
  "nuc-med",
  "ir",
  "pharmacy",
  "nursing",
  "genetics",
  "patient",
];

export function VaultView({ facts }: { facts: Fact[] }) {
  const params = useSearchParams();
  const raw = params.get("specialty");
  const active: Specialty | "all" =
    raw && (VALID_SPECIALTIES as string[]).includes(raw)
      ? (raw as Specialty)
      : "all";

  const filtered = useMemo(() => {
    if (active === "all") return facts;
    return facts.filter((f) => f.specialty === active);
  }, [facts, active]);

  const grouped = useMemo(() => {
    const m = new Map<NonNullable<Fact["group"]>, Fact[]>();
    for (const f of filtered) {
      const arr = m.get(f.group) ?? [];
      arr.push(f);
      m.set(f.group, arr);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const meta = specialtyMeta(active);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-6 py-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <span className="mono text-[10.5px] uppercase tracking-[0.16em] text-violet-600">
            {active === "all" ? "Vault" : "Specialist folder"}
          </span>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
            {meta?.label ?? "All facts"}
          </h2>
          <p className="mt-1 max-w-xl text-[13px] leading-snug text-muted-foreground">
            {meta?.blurb ??
              "Every fact in this patient's context base, with the source it came from."}
          </p>
        </div>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12px] font-medium text-foreground/80 transition-colors hover:bg-muted/60"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
      </header>

      <div className="mt-6 flex flex-col gap-5">
        {grouped.length === 0 ? (
          <p className="text-[13px] italic text-muted-foreground">
            No facts in this folder yet.
          </p>
        ) : (
          grouped.map(([group, items]) => (
            <section
              key={group}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <span className="mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {GROUP_LABEL[group]}
                </span>
                <span className="mono text-[10.5px] text-muted-foreground/80">
                  {items.length} {items.length === 1 ? "fact" : "facts"}
                </span>
              </header>
              <ol className="divide-y divide-border">
                {items.map((f) => (
                  <li
                    key={f.id}
                    className="grid grid-cols-[160px_1fr_auto_auto] items-baseline gap-3 px-4 py-3"
                  >
                    <span className="text-[12px] text-muted-foreground">
                      {f.label}
                    </span>
                    <span className="text-[13px] leading-snug text-foreground">
                      {f.value}
                    </span>
                    <span
                      className={cn(
                        "mono text-[10.5px] tabular-nums",
                        f.confidence < 0.9
                          ? "text-amber-700"
                          : "text-muted-foreground"
                      )}
                      title={`Confidence ${Math.round(f.confidence * 100)}%`}
                    >
                      {Math.round(f.confidence * 100)}%
                    </span>
                    <ProvenancePopover fact={f} />
                  </li>
                ))}
              </ol>
              <footer className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-1.5 text-[10.5px] text-muted-foreground">
                <span>
                  last update{" "}
                  {format(
                    new Date(
                      Math.max(
                        ...items.map((i) => new Date(i.updatedAt).getTime())
                      )
                    ),
                    "yyyy-MM-dd"
                  )}
                </span>
                <button className="text-violet-700 hover:underline">
                  open all sources
                </button>
              </footer>
            </section>
          ))
        )}
      </div>
    </section>
  );
}
