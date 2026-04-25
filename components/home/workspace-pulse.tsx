import { StatusPill } from "@/components/ui/status-pill";
import { activeAgents, dataSources } from "@/lib/mock-data/sources";
import { patients } from "@/lib/mock-data/patients";

/**
 * Replaces the floating-overlay tables. Inline, calm, single-color.
 * Two stacked stripes: agents at work + data sources, with shared visual rhythm.
 */
export function WorkspacePulse() {
  const patientName = (id: string) =>
    patients.find((p) => p.id === id)?.name.split(" ")[0] ?? "—";

  return (
    <section className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
      {/* Agents */}
      <div className="bg-paper">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="eyebrow">Agents at work</span>
          <span className="mono text-[10.5px] text-muted-foreground/80">
            {activeAgents.length}
          </span>
        </div>
        <ul className="divide-y divide-border">
          {activeAgents.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 px-5 py-3 text-[13px]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{a.name}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {patientName(a.patientId)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {a.task}
                </p>
              </div>
              <StatusPill tone={a.status === "active" ? "active" : a.status === "warn" ? "warn" : "muted"}>
                {a.status === "active"
                  ? "Active"
                  : a.status === "warn"
                  ? "Needs review"
                  : "Idle"}
              </StatusPill>
            </li>
          ))}
        </ul>
      </div>

      {/* Sources */}
      <div className="bg-paper">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="eyebrow">Data sources</span>
          <span className="mono text-[10.5px] text-muted-foreground/80">
            {dataSources.filter((s) => s.status === "active").length}/{dataSources.length} live
          </span>
        </div>
        <ul className="divide-y divide-border">
          {dataSources.slice(0, 4).map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 px-5 py-3 text-[13px]"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{s.label}</span>
                <p className="mt-0.5 mono text-[11px] text-muted-foreground">
                  {s.kind} · {s.frequency.toLowerCase()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <StatusPill
                  tone={s.status === "active" ? "active" : s.status === "warn" ? "warn" : "muted"}
                >
                  {s.status === "active" ? "Live" : s.status === "warn" ? "Stale" : "Idle"}
                </StatusPill>
                <span className="mono text-[10.5px] text-muted-foreground/80">
                  {s.lastSync}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
