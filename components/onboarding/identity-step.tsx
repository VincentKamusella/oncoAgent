"use client";

import { motion } from "motion/react";
import { ArrowRight, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type IdentityForm = {
  name: string;
  mrn: string;
  cancerType: string;
  tumorBoard: string;
};

const CANCER_TYPES = [
  "Breast",
  "Lung",
  "Prostate",
  "Colorectal",
  "Pancreatic",
  "Gastric",
  "Melanoma",
  "Lymphoma",
  "Leukemia",
  "Ovarian",
  "Hepatobiliary",
  "Other",
];

type Props = {
  value: IdentityForm;
  onChange: (next: IdentityForm) => void;
  onContinue: () => void;
};

export function IdentityStep({ value, onChange, onContinue }: Props) {
  const ready = value.name.trim().length > 1 && value.mrn.trim().length > 2 && value.cancerType.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full w-full items-center justify-center px-6 py-10"
    >
      <div className="w-full max-w-[560px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/20">
            <IdCard className="h-3.5 w-3.5" />
          </span>
          <span className="eyebrow">New patient · Step 1 of 3</span>
        </div>

        <h1 className="editorial mt-3 text-[34px] leading-[1.05] text-foreground">
          Set up the workspace.
        </h1>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
          Tell us who this vault is for. You&apos;ll add records in the next step — pathology,
          imaging, labs, notes, communications. Everything routes itself.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Patient name">
              <Input
                value={value.name}
                onChange={(e) => onChange({ ...value, name: e.target.value })}
                placeholder="e.g. Anna Lindqvist"
                className="h-9"
              />
            </Field>

            <Field label="MRN">
              <Input
                value={value.mrn}
                onChange={(e) => onChange({ ...value, mrn: e.target.value })}
                placeholder="e.g. MRN-204881"
                className="h-9 mono text-[12.5px]"
              />
            </Field>

            <Field label="Primary cancer type">
              <Select value={value.cancerType} onValueChange={(v) => onChange({ ...value, cancerType: v as string })}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select cancer type" />
                </SelectTrigger>
                <SelectContent>
                  {CANCER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Tumor board" optional>
              <Input
                value={value.tumorBoard}
                onChange={(e) => onChange({ ...value, tumorBoard: e.target.value })}
                placeholder="e.g. Breast TB · Wednesdays"
                className="h-9"
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            size="lg"
            disabled={!ready}
            onClick={onContinue}
            className="gap-1.5 bg-violet-500 px-4 text-[13px] font-medium hover:bg-violet-600"
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="eyebrow flex items-center gap-1.5">
        {label}
        {optional ? <span className="text-muted-foreground/70 normal-case tracking-normal">optional</span> : null}
      </span>
      {children}
    </label>
  );
}
