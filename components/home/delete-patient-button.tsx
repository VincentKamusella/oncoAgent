"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deletePatientAction } from "@/app/actions";

export function DeletePatientButton({
  slug,
  patientName,
}: {
  slug: string;
  patientName: string;
}) {
  const [pending, start] = useTransition();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    if (!window.confirm(`Delete ${patientName}? This removes them from the workspace and drops any open Review items.`)) {
      return;
    }
    start(() => {
      void deletePatientAction(slug);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={`Delete ${patientName}`}
      className="absolute right-3 top-3 z-10 hidden h-7 w-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-[var(--shadow-soft)] ring-1 ring-border backdrop-blur transition-colors hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200 group-hover:flex disabled:opacity-60"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
