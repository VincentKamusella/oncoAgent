import { StatusPill } from "@/components/ui/status-pill";
import type { ActiveAgent, Patient } from "@/lib/types";
import { Bot, Sparkles, ShieldCheck, ListChecks } from "lucide-react";

const TYPE_ICON: Record<ActiveAgent["type"], React.ReactNode> = {
  Claude: <Sparkles className="h-3.5 w-3.5 text-violet-500" />,
  Specialist: <Bot className="h-3.5 w-3.5 text-violet-500" />,
  Compliance: <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />,
  Triage: <ListChecks className="h-3.5 w-3.5 text-amber-500" />,
};

type Props = {
  agents: ActiveAgent[];
  patients: Patient[];
};

export function AgentsTable({ agents, patients }: Props) {
  const patientName = (id: string) => patients.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="surface-lift w-[420px] overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          Active agents
        </span>
        <span className="mono text-[11px] text-muted-foreground/80">
          {agents.length} running
        </span>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-2.5 font-medium">Agent</th>
            <th className="py-2.5 font-medium">Patient</th>
            <th className="py-2.5 pr-5 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {agents.map((a) => (
            <tr key={a.id} className="bg-card">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-violet-50">
                    {TYPE_ICON[a.type]}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="font-medium text-foreground">{a.name}</span>
                    <span className="text-[11.5px] text-muted-foreground">{a.task}</span>
                  </div>
                </div>
              </td>
              <td className="py-3 text-muted-foreground">{patientName(a.patientId)}</td>
              <td className="py-3 pr-5 text-right">
                <StatusPill tone={a.status}>
                  {a.status === "active"
                    ? "Active"
                    : a.status === "warn"
                    ? "Needs review"
                    : "Idle"}
                </StatusPill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
