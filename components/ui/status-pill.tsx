import { cn } from "@/lib/utils";

type Tone = "active" | "warn" | "conflict" | "muted" | "info";

const TONES: Record<Tone, { dot: string; bg: string; fg: string }> = {
  active: { dot: "#10B981", bg: "rgba(16,185,129,0.10)", fg: "#047857" },
  warn: { dot: "#F59E0B", bg: "rgba(245,158,11,0.10)", fg: "#B45309" },
  conflict: { dot: "#EF4444", bg: "rgba(239,68,68,0.10)", fg: "#B91C1C" },
  muted: { dot: "#8A8F99", bg: "rgba(138,143,153,0.12)", fg: "#5A5F6A" },
  info: { dot: "#7C5BF7", bg: "rgba(124,91,247,0.10)", fg: "#4A2FA3" },
};

type Props = {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
};

export function StatusPill({ tone = "muted", children, className }: Props) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none",
        className
      )}
      style={{ background: t.bg, color: t.fg }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: t.dot }}
      />
      {children}
    </span>
  );
}
