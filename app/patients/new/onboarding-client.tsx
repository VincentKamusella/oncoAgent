"use client";

import { AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { IdentityStep, type IdentityForm } from "@/components/onboarding/identity-step";
import { DropzoneStep, type DroppedFile } from "@/components/onboarding/dropzone-step";
import { PipelineStep } from "@/components/onboarding/pipeline-step";
import { SummaryStep } from "@/components/onboarding/summary-step";
import type { ClassifiedFile } from "@/lib/onboarding/build-patient";
import { parseIdentity } from "@/lib/onboarding/identity";
import { createPatientAction } from "./actions";

type Step = "identity" | "intake" | "pipeline" | "summary";

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identity");
  const [form, setForm] = useState<IdentityForm>({
    name: "",
    mrn: "",
    cancerType: "",
    tumorBoard: "",
  });
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [result, setResult] = useState<{ totalFacts: number; classified: ClassifiedFile[] } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  // Auto-fill identity from dropped filenames if user hasn't typed anything.
  useEffect(() => {
    if (step !== "intake" || files.length === 0) return;
    const detected = parseIdentity(files);
    setForm((prev) => ({
      name: prev.name || detected.name || prev.name,
      mrn: prev.mrn || detected.mrn || prev.mrn,
      cancerType: prev.cancerType || detected.cancerType || prev.cancerType,
      tumorBoard: prev.tumorBoard,
    }));
  }, [step, files]);

  // Visual stepper compresses pipeline + summary into a single "Vault" step.
  const visualStepIdx = step === "identity" ? 0 : step === "intake" ? 1 : 2;

  const initials = (() => {
    const parts = form.name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "·";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  const onOpen = () => {
    if (!result) return;
    startTransition(async () => {
      try {
        const id = await createPatientAction({
          name: form.name.trim(),
          mrn: form.mrn.trim(),
          cancerType: form.cancerType,
          tumorBoard: form.tumorBoard.trim() || undefined,
          files: result.classified,
        });
        router.push(`/patients/${id}`);
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <div className="bg-aurora-strong flex h-full w-full flex-col gap-2.5 overflow-hidden p-2.5">
      {/* Top frame — same shell idiom as the home page */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-soft)]">
        <ShellHeader stepIdx={visualStepIdx} />

        <main className="relative flex min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === "identity" && (
              <IdentityStep
                key="identity"
                value={form}
                onChange={setForm}
                onContinue={() => setStep("intake")}
              />
            )}
            {step === "intake" && (
              <DropzoneStep
                key="intake"
                files={files}
                onFilesChange={setFiles}
                onBack={() => setStep("identity")}
                onIngest={() => setStep("pipeline")}
              />
            )}
            {step === "pipeline" && (
              <PipelineStep
                key="pipeline"
                files={files}
                patientName={form.name || "—"}
                patientInitials={initials}
                onComplete={(r) => {
                  setResult(r);
                  // Small pause for the "Vault assembled" beat to land before flipping screens.
                  setTimeout(() => setStep("summary"), 1200);
                }}
              />
            )}
            {step === "summary" && result ? (
              <SummaryStep
                key="summary"
                patientName={form.name}
                cancerType={form.cancerType}
                totalFacts={result.totalFacts}
                classified={result.classified}
                busy={pending}
                onOpen={onOpen}
              />
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function ShellHeader({ stepIdx }: { stepIdx: number }) {
  return (
    <header className="relative z-10 flex items-center justify-between border-b border-border bg-background/60 px-6 py-3 backdrop-blur">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Workspace
      </Link>

      <Stepper stepIdx={stepIdx} />

      <Link
        href="/"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Cancel"
      >
        <X className="h-3.5 w-3.5" />
      </Link>
    </header>
  );
}

function Stepper({ stepIdx }: { stepIdx: number }) {
  const labels = ["Identify", "Records", "Vault"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const active = i === stepIdx;
        const done = i < stepIdx;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={[
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-semibold transition-colors",
                  done
                    ? "bg-violet-500 text-white"
                    : active
                      ? "bg-violet-500/15 text-violet-600 ring-1 ring-violet-500/40"
                      : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <span
                className={[
                  "mono text-[11px] uppercase tracking-wider transition-colors",
                  active || done ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 ? (
              <span className="h-px w-6 bg-border" aria-hidden />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
