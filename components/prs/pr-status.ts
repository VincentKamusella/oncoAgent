import type { PRStatus } from "@/lib/types";

export const PR_STATUS_TONE: Record<PRStatus, "active" | "warn" | "conflict" | "info"> = {
  merged: "active",
  open: "info",
  "needs-review": "warn",
  conflict: "conflict",
};

export const PR_STATUS_LABEL: Record<PRStatus, string> = {
  merged: "Merged",
  open: "Open",
  "needs-review": "Needs review",
  conflict: "Conflict",
};
