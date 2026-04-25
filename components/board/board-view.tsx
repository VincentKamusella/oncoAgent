"use client";

import { useMemo, useState } from "react";
import { Sparkles, Radio, Users2, CheckCircle2 } from "lucide-react";
import type { BoardCase, Patient, TreatmentOption } from "@/lib/types";
import { OptionCard, rankOptions } from "./option-card";
import { PatientPreview } from "./patient-preview";
import { cn } from "@/lib/utils";

type Mode = "team" | "patient" | "decided";

export function BoardView({
  patient,
}: {
  patient: Patient;
}) {
  const options = patient.options ?? [];
  const initialChosen = patient.chosenOptionId ?? null;

  const [chosenId, setChosenId] = useState<string | null>(initialChosen);
  const [preferredId, setPreferredId] = useState<string | null>(initialChosen);
  const [mode, setMode] = useState<Mode>(
    initialChosen ? "decided" : "team"
  );
  const [live, setLive] = useState(false);

  const ranked = useMemo(() => rankOptions(options), [options]);

  if (options.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center px-8">
        <div className="surface max-w-lg px-6 py-8 text-center">
          <Sparkles className="mx-auto h-5 w-5 text-violet-500" />
          <h3 className="mt-3 text-[15px] font-semibold tracking-tight">
            No board case open
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            When the agent detects a pattern that needs the team, it will
            propose a case here. The case ships with ranked treatment options,
            ready for live discussion and patient sign-off.
          </p>
        </div>
      </div>
    );
  }

  if (mode === "patient") {
    return (
      <PatientPreview
        patient={patient}
        options={ranked}
        recommendedId={preferredId ?? ranked[0]?.id ?? null}
        onPick={(id) => {
          setChosenId(id);
          setMode("decided");
        }}
        onBack={() => setMode("team")}
      />
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto">
      <BoardHeader
        boardCase={patient.boardCase}
        live={live}
        onToggleLive={() => setLive((v) => !v)}
        decided={mode === "decided" && chosenId !== null}
      />

      <section className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-6 py-6">
        {ranked.map((opt, i) => (
          <OptionCard
            key={opt.id}
            option={opt}
            index={i}
            isChosen={chosenId === opt.id}
            onPreferred={(id) => setPreferredId(id)}
            onSendToPatient={(id) => {
              setPreferredId(id);
              setMode("patient");
            }}
            onChoose={
              mode === "decided" || (preferredId === opt.id && mode === "team")
                ? (id) => {
                    setChosenId(id);
                    setMode("decided");
                  }
                : undefined
            }
          />
        ))}
      </section>

      <ArchivedBanner
        chosenId={chosenId}
        options={ranked}
      />
    </div>
  );
}

function BoardHeader({
  boardCase,
  live,
  onToggleLive,
  decided,
}: {
  boardCase?: BoardCase;
  live: boolean;
  onToggleLive: () => void;
  decided: boolean;
}) {
  return (
    <header className="border-b border-border bg-background/60 px-6 py-5 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="mono text-[11px] uppercase tracking-[0.16em] text-violet-600">
              Tumor board
            </span>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight">
              {boardCase?.question ?? "Treatment options"}
            </h2>
            {boardCase?.attendees && (
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
                <Users2 className="h-3 w-3" />
                {boardCase.attendees.map((a, i) => (
                  <span key={a.name}>
                    <span className="font-medium text-foreground/85">
                      {a.name}
                    </span>
                    <span className="text-muted-foreground/80"> ({a.role})</span>
                    {i < boardCase.attendees.length - 1 && (
                      <span className="text-muted-foreground/50"> · </span>
                    )}
                  </span>
                ))}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {decided ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 mono text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Decided
              </span>
            ) : (
              <button
                type="button"
                onClick={onToggleLive}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors",
                  live
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "border border-border bg-card text-foreground/80 hover:bg-muted/60"
                )}
              >
                <Radio className={cn("h-3.5 w-3.5", live && "animate-pulse")} />
                {live ? "Live · session active" : "Start live session"}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function ArchivedBanner({
  chosenId,
  options,
}: {
  chosenId: string | null;
  options: TreatmentOption[];
}) {
  if (!chosenId) return null;
  const archived = options.filter((o) => o.id !== chosenId);
  if (archived.length === 0) return null;

  return (
    <div className="mx-auto mt-2 mb-8 flex w-full max-w-[1100px] flex-col gap-2 px-6">
      <span className="mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Archived (not chosen)
      </span>
      <ul className="flex flex-col gap-1.5">
        {archived.map((o) => (
          <li
            key={o.id}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px]"
          >
            <span className="text-foreground/80">{o.name}</span>
            <span className="mono text-[10.5px] text-muted-foreground">
              archived · patient preferred a different path
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

