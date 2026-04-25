import type { Fact } from "@/lib/types";
import { ProvenancePopover } from "./provenance-popover";

type Props = {
  title: string;
  facts: Fact[];
};

/**
 * Replaces the boxed "fact card". Just an eyebrow + a definition list with
 * hairline rows. Information first, frame second.
 */
export function FactSection({ title, facts }: Props) {
  if (facts.length === 0) return null;

  return (
    <section>
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="eyebrow">{title}</h3>
        <span className="mono text-[10.5px] text-muted-foreground">
          {facts.length}
        </span>
      </header>
      <dl className="border-t border-border">
        {facts.map((f) => (
          <div
            key={f.id}
            className="grid grid-cols-[160px_1fr_auto] items-baseline gap-4 border-b border-border py-2.5"
          >
            <dt className="text-[12.5px] text-muted-foreground">{f.label}</dt>
            <dd className="text-[13.5px] leading-snug text-foreground">
              {f.value}
            </dd>
            <ProvenancePopover fact={f} />
          </div>
        ))}
      </dl>
    </section>
  );
}
