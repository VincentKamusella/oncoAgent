"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuestionActions({
  questionId,
  options,
}: {
  questionId: string;
  options: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  if (answered) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1a7f37]">
        Answered
      </span>
    );
  }

  async function handleClick(option: string) {
    setLoading(option);
    try {
      const res = await fetch("/api/review/answer-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer: option }),
      });
      if (res.ok) {
        setAnswered(true);
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {options.map((o, i) => (
        <button
          key={i}
          type="button"
          disabled={loading !== null}
          onClick={() => handleClick(o)}
          className={
            i === 0
              ? "h-7 rounded-md bg-[#0f1f4d] px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-[#0a1740] disabled:opacity-50"
              : "h-7 rounded-md border border-border bg-paper px-2.5 text-[12px] font-medium text-foreground/75 transition-colors hover:bg-muted/60 disabled:opacity-50"
          }
        >
          {loading === o ? "..." : o}
        </button>
      ))}
    </div>
  );
}
