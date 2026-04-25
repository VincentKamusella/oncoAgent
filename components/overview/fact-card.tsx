import type { Fact } from "@/lib/types";
import { ProvenancePopover } from "./provenance-popover";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  facts: Fact[];
  className?: string;
  emptyHint?: string;
  icon?: React.ReactNode;
};

export function FactCard({ title, facts, className, emptyHint, icon }: Props) {
  return (
    <section
      className={cn(
        "surface px-5 py-4",
        className
      )}
    >
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <h3 className="mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </h3>
        </div>
        <span className="mono text-[10.5px] text-muted-foreground/70">
          {facts.length} {facts.length === 1 ? "record" : "records"}
        </span>
      </header>

      {facts.length === 0 ? (
        <p className="text-[12.5px] italic text-muted-foreground">
          {emptyHint ?? "No records yet."}
        </p>
      ) : (
        <dl className="flex flex-col">
          {facts.map((f, i) => (
            <div
              key={f.id}
              className={cn(
                "grid grid-cols-[140px_1fr_auto] items-baseline gap-3 py-2.5",
                i !== facts.length - 1 && "border-b border-border"
              )}
            >
              <dt className="text-[12px] text-muted-foreground">{f.label}</dt>
              <dd className="text-[13px] leading-snug text-foreground">{f.value}</dd>
              <ProvenancePopover fact={f} />
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
