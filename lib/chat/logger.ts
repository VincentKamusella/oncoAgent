import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export type ToolCallLog = {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
  durationMs: number;
};

export type ChatTrace = {
  sessionId: string;
  requestId: string;
  timestamp: string;
  patientId: string;
  view: string;
  userMessage: string;
  systemPromptTokenEstimate: number;
  toolRounds: {
    round: number;
    calls: ToolCallLog[];
    durationMs: number;
  }[];
  totalToolCalls: number;
  streamDurationMs: number;
  totalDurationMs: number;
};

const LOG_DIR = join(process.cwd(), ".logs");

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function createTrace(
  sessionId: string,
  patientId: string,
  view: string,
  userMessage: string,
  systemPrompt: string
): ChatTrace {
  return {
    sessionId,
    requestId: crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString(),
    patientId,
    view,
    userMessage,
    systemPromptTokenEstimate: estimateTokens(systemPrompt),
    toolRounds: [],
    totalToolCalls: 0,
    streamDurationMs: 0,
    totalDurationMs: 0,
  };
}

export function logToolRound(
  trace: ChatTrace,
  round: number,
  calls: ToolCallLog[],
  durationMs: number
) {
  trace.toolRounds.push({ round, calls, durationMs });
  trace.totalToolCalls += calls.length;
}

export function finalizeTrace(trace: ChatTrace, totalDurationMs: number, streamDurationMs: number) {
  trace.totalDurationMs = totalDurationMs;
  trace.streamDurationMs = streamDurationMs;
}

export async function persistTrace(trace: ChatTrace) {
  const prefix = `[agent:${trace.requestId}]`;

  console.log(`\n${"─".repeat(60)}`);
  console.log(`${prefix} ${trace.timestamp}`);
  console.log(`${prefix} session=${trace.sessionId} patient=${trace.patientId} view=${trace.view}`);
  console.log(`${prefix} user: "${trace.userMessage}"`);
  console.log(`${prefix} system prompt ~${trace.systemPromptTokenEstimate} tokens`);

  if (trace.toolRounds.length === 0) {
    console.log(`${prefix} no tool calls`);
  } else {
    for (const round of trace.toolRounds) {
      console.log(`${prefix} tool round ${round.round} (${round.durationMs}ms):`);
      for (const call of round.calls) {
        const resultPreview = JSON.stringify(call.result).slice(0, 200);
        console.log(`${prefix}   → ${call.name}(${JSON.stringify(call.arguments)}) [${call.durationMs}ms]`);
        console.log(`${prefix}     result: ${resultPreview}${resultPreview.length >= 200 ? "…" : ""}`);
      }
    }
  }

  console.log(
    `${prefix} total: ${trace.totalToolCalls} tool calls, ` +
    `stream ${trace.streamDurationMs}ms, ` +
    `total ${trace.totalDurationMs}ms`
  );
  console.log("─".repeat(60));

  try {
    await mkdir(LOG_DIR, { recursive: true });
    const filename = `${trace.timestamp.slice(0, 10)}_${trace.sessionId}.jsonl`;
    const line = JSON.stringify(trace) + "\n";
    await writeFile(join(LOG_DIR, filename), line, { flag: "a" });
  } catch {
    console.warn(`${prefix} failed to write log file`);
  }
}
