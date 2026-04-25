import type { AgentNote, TranscriptLine } from "@/lib/types";
import { Sparkles } from "lucide-react";

const AVATAR_TONE: Record<string, string> = {
  violet: "bg-violet-100 text-violet-700",
  rose: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
};

export function Transcript({
  lines,
  agentNotes,
}: {
  lines: TranscriptLine[];
  agentNotes: AgentNote[];
}) {
  const ordered: (
    | { type: "line"; line: TranscriptLine }
    | { type: "note"; note: AgentNote }
  )[] = [];

  for (const line of lines) {
    ordered.push({ type: "line", line });
    for (const n of agentNotes) {
      if (n.attachedToLineId === line.id) ordered.push({ type: "note", note: n });
    }
  }
  for (const n of agentNotes) {
    if (!n.attachedToLineId) ordered.push({ type: "note", note: n });
  }

  return (
    <ol className="flex flex-col gap-3.5">
      {ordered.map((item, idx) => {
        if (item.type === "note") {
          const n = item.note;
          return (
            <li key={`n-${n.id}-${idx}`} className="ml-12">
              <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/50 px-3.5 py-2.5">
                <div className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-md bg-violet-200 text-violet-800">
                  <Sparkles className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mono text-[10px] font-semibold uppercase tracking-wider text-violet-700">
                    Agent · {n.at}
                  </div>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-foreground">
                    {n.text}
                  </p>
                </div>
              </div>
            </li>
          );
        }
        const l = item.line;
        const initials = l.speaker
          .split(" ")
          .map((s) => s[0])
          .join("")
          .replace(".", "")
          .slice(0, 2);
        return (
          <li key={`l-${l.id}`} className="flex items-start gap-3">
            <div
              className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full mono text-[11px] font-semibold ${
                AVATAR_TONE[l.tone ?? "violet"]
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold tracking-tight">
                  {l.speaker}
                </span>
                <span className="text-[11px] text-muted-foreground">{l.role}</span>
                <span className="mono text-[10.5px] text-muted-foreground/80">
                  {l.at}
                </span>
              </div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/90">
                {l.text}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
