"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function seed(patient: Patient): Message[] {
  const q = patient.agent.needsYou[0];
  if (q) {
    return [
      {
        id: "m0",
        role: "assistant",
        content: `Hi — I'm watching ${patient.name.split(" ")[0]}'s vault. One decision needs your call: ${q.question}. Ask me anything about the case.`,
      },
    ];
  }
  return [
    {
      id: "m0",
      role: "assistant",
      content: `Hi — I'm watching ${patient.name.split(" ")[0]}'s vault. Ask me anything about the case.`,
    },
  ];
}

function cannedResponse(input: string, patient: Patient): string {
  const q = input.toLowerCase();

  if (q.includes("conflict") || q.includes("staging") || q.includes("cT4")) {
    return "The restaging MRI (2026-04-22) contradicts the baseline cT3 from 2026-03-08. I've blocked auto-merge on PR #3. Recommended action: tumor board on 2026-04-26 — already on the calendar.";
  }
  if (q.includes("plan") || q.includes("treatment") || q.includes("regimen")) {
    return `Current plan: ${patient.plan
      .map((p) => p.name)
      .join(" → ")}. ${
      patient.plan.find((p) => p.status === "in-progress")?.name ?? "First phase"
    } is active.`;
  }
  if (q.includes("merge") || q.includes("accept")) {
    return "I can't auto-merge that change — it materially shifts prognosis and surgical plan. Multidisciplinary review is required. I've drafted talking points for the tumor board.";
  }
  if (q.includes("source") || q.includes("provenance") || q.includes("where")) {
    return "Every fact in the vault traces to a source — pathology report, imaging, lab feed, or a clinician note. Click any 📎 in the overview to see the underlying excerpt.";
  }
  if (q.includes("schedule") || q.includes("book") || q.includes("appointment")) {
    return "I can auto-book imaging, labs, or visits. Want me to add something to the followup schedule?";
  }
  return `Looking through ${patient.name.split(" ")[0]}'s vault for context on that. Each fact is structured and provenance-linked — I'll cite sources when I respond.`;
}

export function AgentChat({ patient }: { patient: Patient }) {
  const [messages, setMessages] = useState<Message[]>(() => seed(patient));
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // re-seed on patient change
  useEffect(() => {
    setMessages(seed(patient));
    setInput("");
  }, [patient.id, patient]);

  // auto-scroll to bottom on new message
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const send = () => {
    const text = input.trim();
    if (!text || pending) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPending(true);
    setTimeout(() => {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: cannedResponse(text, patient),
      };
      setMessages((m) => [...m, reply]);
      setPending(false);
    }, 600);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <aside className="hidden w-[340px] flex-shrink-0 flex-col border-l border-border bg-card/50 xl:flex">
      <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-violet-100">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight">Agent</span>
        </div>
        <span className="mono text-[10px] text-muted-foreground">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
          online
        </span>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <ol className="flex flex-col gap-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-snug",
                  m.role === "user"
                    ? "rounded-br-md bg-violet-500 text-white"
                    : "rounded-bl-md border border-border bg-card text-foreground"
                )}
              >
                {m.content}
              </div>
            </li>
          ))}
          {pending && (
            <li className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2.5">
                <span className="flex items-center gap-1">
                  <Dot delay={0} />
                  <Dot delay={150} />
                  <Dot delay={300} />
                </span>
              </div>
            </li>
          )}
        </ol>
      </div>

      <footer className="border-t border-border bg-card/80 p-3">
        <div className="relative flex items-end gap-2 rounded-xl border border-border bg-background pl-3 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-violet-200">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about this patient…"
            rows={1}
            className="min-h-0 max-h-32 flex-1 resize-none border-0 bg-transparent px-0 py-1.5 text-[13px] shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/70"
          />
          <Button
            type="button"
            onClick={send}
            disabled={!input.trim() || pending}
            size="icon-sm"
            className="h-7 w-7 flex-shrink-0 rounded-lg bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="mt-2 px-1 text-[10.5px] text-muted-foreground/70">
          Mock agent · responses are canned for the demo.
        </p>
      </footer>
    </aside>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
      style={{
        animation: "agentBlink 1.2s ease-in-out infinite",
        animationDelay: `${delay}ms`,
      }}
    />
  );
}
