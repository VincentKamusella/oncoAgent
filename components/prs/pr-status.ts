import {
  GitPullRequest,
  GitMerge,
  AlertOctagon,
  Eye,
  XCircle,
} from "lucide-react";
import type { PRStatus } from "@/lib/types";

export const PR_STATUS_TONE: Record<PRStatus, "active" | "warn" | "conflict" | "info"> = {
  merged: "active",
  open: "info",
  "needs-review": "warn",
  conflict: "conflict",
  declined: "info",
};

export const PR_STATUS_LABEL: Record<PRStatus, string> = {
  merged: "Signed off",
  open: "Open",
  "needs-review": "Needs review",
  conflict: "Conflict",
  declined: "Declined",
};

export const PR_STATUS_COLOR: Record<PRStatus, string> = {
  open: "#1a7f37",
  conflict: "#cf222e",
  "needs-review": "#9a6700",
  merged: "#8250df",
  declined: "#57606a",
};

export const PR_STATUS_ICON: Record<
  PRStatus,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  open: GitPullRequest,
  conflict: AlertOctagon,
  "needs-review": Eye,
  merged: GitMerge,
  declined: XCircle,
};
