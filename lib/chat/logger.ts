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
  systemPrompt: string;
  systemPromptTokenEstimate: number;
  reasoning: string[];
  toolRounds: {
    round: number;
    reasoning: string;
    calls: ToolCallLog[];
    durationMs: number;
  }[];
  finalResponse: string;
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
    systemPrompt,
    systemPromptTokenEstimate: estimateTokens(systemPrompt),
    reasoning: [],
    toolRounds: [],
    finalResponse: "",
    totalToolCalls: 0,
    streamDurationMs: 0,
    totalDurationMs: 0,
  };
}

export function logReasoning(trace: ChatTrace, text: string) {
  if (text.trim()) trace.reasoning.push(text.trim());
}

export function logToolRound(
  trace: ChatTrace,
  round: number,
  reasoning: string,
  calls: ToolCallLog[],
  durationMs: number
) {
  trace.toolRounds.push({ round, reasoning: reasoning.trim(), calls, durationMs });
  trace.totalToolCalls += calls.length;
  if (reasoning.trim()) trace.reasoning.push(reasoning.trim());
}

export function finalizeTrace(trace: ChatTrace, totalDurationMs: number, streamDurationMs: number, finalResponse: string) {
  trace.totalDurationMs = totalDurationMs;
  trace.streamDurationMs = streamDurationMs;
  trace.finalResponse = finalResponse;
}

export async function persistTrace(trace: ChatTrace) {
  const prefix = `[agent:${trace.requestId}]`;
  const bar = "═".repeat(70);

  console.log(`\n${bar}`);
  console.log(`${prefix} TRACE  ${trace.timestamp}`);
  console.log(`${prefix} session=${trace.sessionId}  patient=${trace.patientId}  view=${trace.view}`);
  console.log(`${bar}`);

  console.log(`${prefix} ▌USER: "${trace.userMessage}"`);
  console.log(`${prefix} ▌SYSTEM PROMPT (~${trace.systemPromptTokenEstimate} tokens):`);
  for (const line of trace.systemPrompt.split("\n").slice(0, 8)) {
    console.log(`${prefix}   ${line}`);
  }
  if (trace.systemPrompt.split("\n").length > 8) {
    console.log(`${prefix}   ... (${trace.systemPrompt.split("\n").length - 8} more lines)`);
  }

  if (trace.toolRounds.length === 0) {
    console.log(`${prefix} ▌NO TOOL CALLS — direct response`);
  } else {
    for (const round of trace.toolRounds) {
      console.log(`${prefix} ${"─".repeat(50)}`);
      console.log(`${prefix} ▌ROUND ${round.round}  (${round.durationMs}ms)`);
      if (round.reasoning) {
        console.log(`${prefix} ▌REASONING:`);
        for (const line of round.reasoning.split("\n")) {
          console.log(`${prefix}   💭 ${line}`);
        }
      }
      for (const call of round.calls) {
        console.log(`${prefix} ▌TOOL CALL: ${call.name}  [${call.durationMs}ms]`);
        console.log(`${prefix}   args: ${JSON.stringify(call.arguments)}`);
        const resultStr = JSON.stringify(call.result, null, 2);
        const resultLines = resultStr.split("\n");
        const maxLines = 12;
        for (const line of resultLines.slice(0, maxLines)) {
          console.log(`${prefix}   ← ${line}`);
        }
        if (resultLines.length > maxLines) {
          console.log(`${prefix}   ← ... (${resultLines.length - maxLines} more lines)`);
        }
      }
    }
  }

  console.log(`${prefix} ${"─".repeat(50)}`);
  console.log(`${prefix} ▌FINAL RESPONSE:`);
  if (trace.finalResponse) {
    const responseLines = trace.finalResponse.split("\n");
    for (const line of responseLines) {
      console.log(`${prefix}   📝 ${line}`);
    }
  } else {
    console.log(`${prefix}   (no response captured)`);
  }

  console.log(`${prefix} ${"─".repeat(50)}`);
  console.log(
    `${prefix} ▌SUMMARY: ${trace.totalToolCalls} tool calls across ${trace.toolRounds.length} rounds`
  );
  console.log(
    `${prefix}   tool phase: ${trace.totalDurationMs - trace.streamDurationMs}ms  |  ` +
    `stream: ${trace.streamDurationMs}ms  |  total: ${trace.totalDurationMs}ms`
  );
  console.log(bar);

  try {
    await mkdir(LOG_DIR, { recursive: true });
    const filename = `${trace.timestamp.slice(0, 10)}_${trace.sessionId}.json`;
    const line = JSON.stringify(trace, null, 2) + "\n\n";
    const base = path.resolve(LOG_DIR);
    const target = path.resolve(base, filename);
    const relative = path.relative(base, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('Invalid file path');
    }
    await writeFile(target, line, { flag: "a" });
  } catch {
    console.warn(`${prefix} failed to write log file`);
  }
}
