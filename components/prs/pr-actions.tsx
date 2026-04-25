"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  AlertOctagon,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PullRequest } from "@/lib/types";

export function PRActions({ pr }: { pr: PullRequest }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"sign-off" | "decline" | null>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const blocked = pr.status === "conflict";
  const merged = pr.status === "merged";
  const declined = pr.status === "declined";
  const done = merged || declined;

  async function handleSignOff() {
    setLoading("sign-off");
    setResult(null);
    try {
      const res = await fetch("/api/review/sign-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewItemId: pr.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: "error", message: data.error });
      } else {
        setResult({
          type: "success",
          message: `Signed off — ${data.changesApplied} change${data.changesApplied === 1 ? "" : "s"} applied to vault`,
        });
        router.refresh();
      }
    } catch {
      setResult({ type: "error", message: "Network error" });
    }
    setLoading(null);
  }

  async function handleDecline() {
    setLoading("decline");
    setResult(null);
    try {
      const res = await fetch("/api/review/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewItemId: pr.id,
          reason: declineReason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: "error", message: data.error });
      } else {
        setResult({ type: "success", message: "Declined" });
        setShowDecline(false);
        router.refresh();
      }
    } catch {
      setResult({ type: "error", message: "Network error" });
    }
    setLoading(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {showDecline && (
        <div className="surface flex flex-col gap-3 px-5 py-4">
          <label className="mono text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Decline reason (optional)
          </label>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Why are you declining this change?"
            rows={2}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={loading === "decline"}
              onClick={handleDecline}
              className="h-8 gap-1.5 rounded-md bg-rose-500 text-[12.5px] text-white hover:bg-rose-600"
            >
              {loading === "decline" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              <span>Confirm decline</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDecline(false)}
              className="h-8 rounded-md bg-card text-[12.5px]"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="surface flex items-center justify-between gap-4 px-5 py-3.5">
        <div className="text-[12.5px] text-muted-foreground">
          {result ? (
            <span
              className={`flex items-center gap-1.5 font-medium ${
                result.type === "success" ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {result.type === "success" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {result.message}
            </span>
          ) : merged ? (
            <span className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Signed off · changes applied to vault
            </span>
          ) : declined ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <XCircle className="h-3.5 w-3.5" />
              Declined
            </span>
          ) : blocked ? (
            <span className="flex items-center gap-1.5 font-medium text-rose-700">
              <AlertOctagon className="h-3.5 w-3.5" />
              Conflicts block sign-off — resolve before proceeding
            </span>
          ) : (
            <span>{pr.agentVerdict}</span>
          )}
        </div>
        {!done && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() => setShowDecline(!showDecline)}
              className="h-8 gap-1.5 rounded-md bg-card text-[12.5px]"
            >
              <X className="h-3.5 w-3.5" /> <span>Decline</span>
            </Button>
            <Button
              size="sm"
              disabled={blocked || !!loading}
              onClick={handleSignOff}
              className={`h-8 gap-1.5 rounded-md text-[12.5px] ${
                blocked
                  ? "bg-muted text-muted-foreground hover:bg-muted"
                  : "bg-violet-500 text-white hover:bg-violet-600"
              }`}
            >
              {loading === "sign-off" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>Sign off</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
