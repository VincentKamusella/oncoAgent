"use client";

import { Paperclip } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import type { Fact } from "@/lib/types";
import { FactMono } from "@/components/ui/fact-mono";

const KIND_LABEL: Record<string, string> = {
  pathology: "Pathology report",
  imaging: "Imaging report",
  lab: "Lab result",
  email: "Email",
  note: "Clinical note",
  report: "Document",
  pr: "Pull request",
  meeting: "Meeting minutes",
};

export function ProvenancePopover({ fact }: { fact: Fact }) {
  const { source, confidence } = fact;

  return (
    <Popover>
      <PopoverTrigger
        className="grid h-5 w-5 place-items-center rounded-md text-muted-foreground/70 transition-colors hover:bg-violet-50 hover:text-violet-700"
        aria-label="Show provenance"
      >
        <Paperclip className="h-3 w-3" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[340px] rounded-xl border border-border bg-popover p-0 shadow-[var(--shadow-lift)] ring-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="mono text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Source · {KIND_LABEL[source.kind] ?? source.kind}
          </span>
          <span className="mono text-[10.5px] text-muted-foreground">
            confidence {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className="px-4 py-3">
          <p className="text-[13px] font-semibold text-foreground">{source.label}</p>
          {source.author && (
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {source.author}
            </p>
          )}
          {source.excerpt && (
            <blockquote className="mt-2.5 rounded-md border-l-2 border-violet-300 bg-violet-50/60 p-2 text-[12px] leading-snug text-foreground/80">
              {source.excerpt}
            </blockquote>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-[11px]">
          <FactMono>
            captured {format(new Date(source.at), "yyyy-MM-dd HH:mm")}
          </FactMono>
          <button className="text-violet-700 hover:underline">Open source</button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
