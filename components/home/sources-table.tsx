import { StatusPill } from "@/components/ui/status-pill";
import type { DataSource } from "@/lib/types";
import {
  ScanLine,
  Database,
  FlaskConical,
  Microscope,
  Mail,
  StickyNote,
} from "lucide-react";

const ICON: Record<DataSource["kind"], React.ReactNode> = {
  PACS: <ScanLine className="h-3.5 w-3.5 text-violet-500" />,
  EHR: <Database className="h-3.5 w-3.5 text-sky-500" />,
  LIS: <FlaskConical className="h-3.5 w-3.5 text-emerald-500" />,
  PathologyDB: <Microscope className="h-3.5 w-3.5 text-rose-500" />,
  Email: <Mail className="h-3.5 w-3.5 text-amber-500" />,
  Notes: <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />,
};

const TONE_BG: Record<DataSource["kind"], string> = {
  PACS: "bg-violet-50",
  EHR: "bg-sky-50",
  LIS: "bg-emerald-50",
  PathologyDB: "bg-rose-50",
  Email: "bg-amber-50",
  Notes: "bg-muted",
};

const STATUS_COPY: Record<DataSource["status"], string> = {
  active: "Active",
  warn: "Stale",
  muted: "Idle",
};

export function SourcesTable({ sources }: { sources: DataSource[] }) {
  return (
    <div className="surface-lift w-[440px] overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          Data sources
        </span>
        <span className="mono text-[11px] text-muted-foreground/80">
          {sources.length} connected
        </span>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-2.5 font-medium">Source</th>
            <th className="py-2.5 font-medium">Status</th>
            <th className="py-2.5 font-medium">Last sync</th>
            <th className="py-2.5 pr-5 font-medium">Frequency</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sources.map((s) => (
            <tr key={s.id} className="bg-card">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`grid h-7 w-7 place-items-center rounded-lg ${TONE_BG[s.kind]}`}
                  >
                    {ICON[s.kind]}
                  </div>
                  <span className="font-medium text-foreground">{s.label}</span>
                </div>
              </td>
              <td className="py-3">
                <StatusPill tone={s.status}>{STATUS_COPY[s.status]}</StatusPill>
              </td>
              <td className="py-3 text-muted-foreground">{s.lastSync}</td>
              <td className="py-3 pr-5 text-muted-foreground">{s.frequency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
