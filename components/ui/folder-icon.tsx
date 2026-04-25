import { cn } from "@/lib/utils";

type Avatar = { initials: string; tone?: "violet" | "rose" | "amber" | "emerald" | "sky" };

const TONE: Record<NonNullable<Avatar["tone"]>, { bg: string; ring: string; fg: string }> = {
  violet: { bg: "#ECE8FF", ring: "#FFFFFF", fg: "#5A39C9" },
  rose: { bg: "#FFE4EC", ring: "#FFFFFF", fg: "#9F1239" },
  amber: { bg: "#FEF3C7", ring: "#FFFFFF", fg: "#92400E" },
  emerald: { bg: "#D1FAE5", ring: "#FFFFFF", fg: "#065F46" },
  sky: { bg: "#DBEAFE", ring: "#FFFFFF", fg: "#1E40AF" },
};

type Props = {
  avatars?: Avatar[];
  className?: string;
  size?: number;
};

export function FolderIcon({ avatars = [], className, size = 144 }: Props) {
  const w = size;
  const h = Math.round(size * 0.78);
  const slots = avatars.slice(0, 4);

  return (
    <div className={cn("relative", className)} style={{ width: w, height: h }}>
      <svg
        viewBox="0 0 200 156"
        width={w}
        height={h}
        className="block drop-shadow-[0_18px_30px_rgba(124,91,247,0.25)]"
        aria-hidden
      >
        <defs>
          <linearGradient id="folder-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9A7CFF" />
            <stop offset="100%" stopColor="#6A47E8" />
          </linearGradient>
          <linearGradient id="folder-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C5BF7" />
            <stop offset="100%" stopColor="#5A39C9" />
          </linearGradient>
          <linearGradient id="folder-tab" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B9AAFF" />
            <stop offset="100%" stopColor="#9A7CFF" />
          </linearGradient>
          <linearGradient id="folder-sheet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5F3FF" />
          </linearGradient>
        </defs>

        <path
          d="M14 38 Q14 22 30 22 H78 L92 36 H170 Q186 36 186 52 V128 Q186 144 170 144 H30 Q14 144 14 128 Z"
          fill="url(#folder-back)"
        />
        <path d="M30 22 H78 L92 36 H30 Z" fill="url(#folder-tab)" opacity="0.95" />

        <rect x="30" y="48" width="140" height="68" rx="6" fill="url(#folder-sheet)" opacity="0.95" />
        <line x1="42" y1="64" x2="120" y2="64" stroke="#D8D0FF" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="76" x2="100" y2="76" stroke="#E8E2FF" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="88" x2="140" y2="88" stroke="#E8E2FF" strokeWidth="2" strokeLinecap="round" />

        <path
          d="M14 64 Q14 50 30 50 H170 Q186 50 186 64 V130 Q186 146 170 146 H30 Q14 146 14 130 Z"
          fill="url(#folder-body)"
        />
        <path
          d="M14 64 Q14 50 30 50 H170 Q186 50 186 64 V72 Q186 86 170 86 H30 Q14 86 14 72 Z"
          fill="#FFFFFF"
          opacity="0.12"
        />
      </svg>

      {slots.length > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: Math.round(h * 0.4) }}>
          <div className="flex -space-x-2">
            {slots.map((a, i) => {
              const tone = TONE[a.tone ?? "violet"];
              return (
                <div
                  key={i}
                  className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold mono"
                  style={{
                    background: tone.bg,
                    color: tone.fg,
                    boxShadow: `0 0 0 2px ${tone.ring}`,
                  }}
                >
                  {a.initials}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
