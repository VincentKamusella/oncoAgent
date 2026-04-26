"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Microscope,
  ScanLine,
  Stethoscope,
  Scissors,
  Zap,
  Dna,
  Atom,
  Syringe,
  Pill,
  HeartPulse,
  UserSquare,
  Layers,
} from "lucide-react";
import type { Fact, Specialty } from "@/lib/types";
import { cn } from "@/lib/utils";

type SpecialistFolder = {
  key: Specialty;
  label: string;
  icon: React.ReactNode;
  blurb: string;
};

const FOLDERS: SpecialistFolder[] = [
  {
    key: "pathology",
    label: "Pathology",
    icon: <Microscope className="h-3.5 w-3.5" />,
    blurb: "Histology, IHC/FISH, margins.",
  },
  {
    key: "radiology",
    label: "Radiology",
    icon: <ScanLine className="h-3.5 w-3.5" />,
    blurb: "Staging imaging, RECIST, response.",
  },
  {
    key: "med-onc",
    label: "Medical oncology",
    icon: <Stethoscope className="h-3.5 w-3.5" />,
    blurb: "Systemic therapy, labs, performance.",
  },
  {
    key: "surg-onc",
    label: "Surgical oncology",
    icon: <Scissors className="h-3.5 w-3.5" />,
    blurb: "Resectability, op-reports, margins.",
  },
  {
    key: "rad-onc",
    label: "Radiation oncology",
    icon: <Zap className="h-3.5 w-3.5" />,
    blurb: "RT modality, dose, fields.",
  },
  {
    key: "molecular",
    label: "Molecular pathology",
    icon: <Dna className="h-3.5 w-3.5" />,
    blurb: "NGS, variants, OncoKB tier.",
  },
  {
    key: "genetics",
    label: "Genetics",
    icon: <Atom className="h-3.5 w-3.5" />,
    blurb: "Germline panels, pedigree.",
  },
  {
    key: "nuc-med",
    label: "Nuclear medicine",
    icon: <Atom className="h-3.5 w-3.5" />,
    blurb: "PET / theranostics.",
  },
  {
    key: "ir",
    label: "Interventional radiology",
    icon: <Syringe className="h-3.5 w-3.5" />,
    blurb: "Biopsy, ablation, ports.",
  },
  {
    key: "pharmacy",
    label: "Pharmacy",
    icon: <Pill className="h-3.5 w-3.5" />,
    blurb: "Dose, interactions, eMAR.",
  },
  {
    key: "nursing",
    label: "Nursing & intake",
    icon: <HeartPulse className="h-3.5 w-3.5" />,
    blurb: "ECOG, infusions, intake.",
  },
  {
    key: "patient",
    label: "Patient-reported",
    icon: <UserSquare className="h-3.5 w-3.5" />,
    blurb: "History, symptoms, preferences.",
  },
];

export function SpecialistTreeNav({
  facts,
  patientId,
}: {
  facts: Fact[];
  patientId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const onVault = pathname === `/patients/${patientId}`;
  const current = params.get("specialty");
  const selectedSpecialty: Specialty | "all" = onVault
    ? ((current as Specialty | null) ?? "all")
    : "all";

  const onSelect = (s: Specialty | "all") => {
    const target = `/patients/${patientId}`;
    const url = s === "all" ? target : `${target}?specialty=${s}`;
    router.push(url);
  };

  return (
    <SpecialistTree
      facts={facts}
      selectedSpecialty={selectedSpecialty}
      onSelect={onSelect}
    />
  );
}

export function SpecialistTree({
  facts,
  selectedSpecialty,
  onSelect,
}: {
  facts: Fact[];
  selectedSpecialty?: Specialty | "all";
  onSelect: (s: Specialty | "all") => void;
}) {
  const counts = useMemo(() => {
    const m = new Map<Specialty, number>();
    for (const f of facts) {
      if (!f.specialty) continue;
      m.set(f.specialty, (m.get(f.specialty) ?? 0) + 1);
    }
    return m;
  }, [facts]);

  const visible = FOLDERS.filter((f) => (counts.get(f.key) ?? 0) > 0);
  const isActive = (key: Specialty | "all") =>
    (selectedSpecialty ?? "all") === key;

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      <div className="px-2 py-1.5">
        <span className="mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Records
        </span>
      </div>

      <button
        type="button"
        onClick={() => onSelect("all")}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-medium transition-colors",
          isActive("all")
            ? "bg-violet-50 text-violet-700"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <span
          className={cn(
            "grid h-4 w-4 flex-shrink-0 place-items-center",
            isActive("all") ? "text-violet-600" : "text-muted-foreground"
          )}
        >
          <Layers className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 truncate">Overview</span>
        <span className="mono text-[10.5px]">{facts.length}</span>
      </button>

      <ol className="mt-1 flex flex-col gap-0.5">
        {visible.map((f) => {
          const count = counts.get(f.key) ?? 0;
          const active = isActive(f.key);
          return (
            <li key={f.key}>
              <button
                type="button"
                onClick={() => onSelect(f.key)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition-colors",
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-foreground/85 hover:bg-muted/60"
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 flex-shrink-0 place-items-center",
                    active ? "text-violet-600" : "text-muted-foreground"
                  )}
                >
                  {f.icon}
                </span>
                <span className="flex-1 truncate font-medium">{f.label}</span>
                <span className="mono text-[10.5px] text-muted-foreground/80">
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function specialtyMeta(s: Specialty | "all"): SpecialistFolder | null {
  if (s === "all") return null;
  return FOLDERS.find((f) => f.key === s) ?? null;
}

export const ALL_FOLDERS = FOLDERS;
