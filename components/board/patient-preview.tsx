"use client";

import { ArrowLeft, Heart, CheckCircle2 } from "lucide-react";
import type { Patient, TreatmentOption } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PatientPreview({
  patient,
  options,
  recommendedId,
  onPick,
  onBack,
}: {
  patient: Patient;
  options: TreatmentOption[];
  recommendedId: string | null;
  onPick: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto bg-aurora-strong">
      <header className="border-b border-border bg-background/70 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[840px] items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[12px] font-medium text-foreground/80 hover:bg-muted/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to team view
          </button>
          <span className="mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Patient view · {patient.name.split(" ")[0]}
          </span>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[840px] flex-col gap-6 px-6 py-8">
        <div>
          <span className="mono text-[11px] uppercase tracking-[0.16em] text-violet-600">
            Your treatment options
          </span>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight">
            Three paths your team agrees on, {patient.name.split(" ")[0]}.
          </h2>
          <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-muted-foreground">
            We&apos;ve summarized each one in plain language. You don&apos;t need
            to decide today — talk it through with whoever you trust, then come
            back when you&apos;re ready. Whatever you choose, your team will
            support it.
          </p>
        </div>

        <ol className="flex flex-col gap-4">
          {options.map((o, i) => {
            const recommended = recommendedId === o.id;
            const letter = String.fromCharCode(65 + i);
            return (
              <li
                key={o.id}
                className={cn(
                  "surface relative flex flex-col gap-3 px-6 py-5",
                  recommended && "ring-2 ring-violet-300"
                )}
              >
                {recommended && (
                  <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full bg-violet-500 px-2.5 py-0.5 mono text-[10px] font-semibold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(15,31,77,0.18)]">
                    <Heart className="h-3 w-3" /> team&apos;s recommendation
                  </span>
                )}

                <header className="flex items-start gap-3">
                  <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-violet-500 mono text-[14px] font-semibold text-white">
                    {letter}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
                      {o.patientFacing?.name ?? o.name}
                    </h3>
                  </div>
                </header>

                <p className="text-[14px] leading-relaxed text-foreground/85">
                  {o.patientFacing?.summary ?? o.shortLabel}
                </p>

                {o.patientFacing?.livesLikeThis && (
                  <div className="rounded-lg bg-violet-50/60 px-4 py-3 text-[13px] leading-relaxed text-foreground/80">
                    <p className="mono mb-1 text-[10px] uppercase tracking-wider text-violet-700">
                      What life looks like
                    </p>
                    {o.patientFacing.livesLikeThis}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onPick(o.id)}
                  className="mt-1 flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-violet-600"
                >
                  <CheckCircle2 className="h-4 w-4" /> I&apos;d like this option
                </button>
              </li>
            );
          })}
        </ol>

        <p className="mt-2 text-[12px] italic text-muted-foreground">
          Demo note · pressing a button here records the choice as a new commit
          on the patient&apos;s vault. In production this would be a separate
          patient app.
        </p>
      </section>
    </div>
  );
}
