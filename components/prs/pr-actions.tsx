"use client";

import { Check, MessageSquare, X, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PullRequest } from "@/lib/types";

export function PRActions({ pr }: { pr: PullRequest }) {
  const blocked = pr.status === "conflict";
  const merged = pr.status === "merged";

  return (
    <div className="surface flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="text-[12.5px] text-muted-foreground">
        {merged ? (
          <span>Merged automatically · {pr.agentVerdict}</span>
        ) : blocked ? (
          <span className="flex items-center gap-1.5 font-medium text-rose-700">
            <AlertOctagon className="h-3.5 w-3.5" />
            Auto-merge blocked — clinician decision required
          </span>
        ) : (
          <span>{pr.agentVerdict}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-md bg-card text-[12.5px]"
        >
          <MessageSquare className="h-3.5 w-3.5" /> <span>Comment</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-md bg-card text-[12.5px]"
        >
          <X className="h-3.5 w-3.5" /> <span>Request changes</span>
        </Button>
        <Button
          size="sm"
          disabled={blocked || merged}
          className={`h-8 gap-1.5 rounded-md text-[12.5px] ${
            blocked || merged
              ? "bg-muted text-muted-foreground hover:bg-muted"
              : "bg-violet-500 text-white hover:bg-violet-600"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          <span>{merged ? "Merged" : blocked ? "Merge blocked" : "Merge into vault"}</span>
        </Button>
      </div>
    </div>
  );
}
