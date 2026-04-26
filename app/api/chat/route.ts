import { getPatient } from "@/lib/data";
import { buildSystemPrompt } from "@/lib/chat/context";
import { toolDefinitions, executeTool } from "@/lib/chat/tools";
import { getChatProvider, type ChatMessage } from "@/lib/chat/providers";
import {
  createTrace,
  logToolRound,
  finalizeTrace,
  persistTrace,
  type ToolCallLog,
} from "@/lib/chat/logger";

type InputMessage = { role: "user" | "assistant"; content: string };

const MAX_TOOL_ROUNDS = 5;

export async function POST(request: Request) {
  const t0 = performance.now();
  const body = await request.json();
  const { messages, patientId, view, sessionId } = body as {
    messages: InputMessage[];
    patientId: string;
    view: string;
    sessionId?: string;
  };

  const patient = await getPatient(patientId);
  if (!patient) {
    return Response.json({ error: "Patient not found" }, { status: 404 });
  }

  const provider = getChatProvider();

  const instructions = await buildSystemPrompt(patient, view);
  const userMessage = messages[messages.length - 1]?.content ?? "";
  const trace = createTrace(
    sessionId ?? "anonymous",
    patientId,
    view,
    userMessage,
    instructions
  );

  console.log(`[chat] Using provider: ${provider.name}`);

  const conversation: ChatMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // ── Phase 1: resolve tool calls (non-streaming for reliable parsing) ──
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const roundStart = performance.now();

    let result: { reasoning: string; toolCalls: { name: string; call_id: string; arguments: string }[] };
    try {
      result = await provider.callForToolResolution(
        instructions,
        conversation,
        toolDefinitions
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json({ error: msg }, { status: 502 });
    }

    const { reasoning: roundReasoning, toolCalls } = result;
    if (toolCalls.length === 0) break;

    const callLogs: ToolCallLog[] = [];

    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: roundReasoning || null,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.call_id,
        type: "function" as const,
        function: { name: tc.name, arguments: tc.arguments },
      })),
    };
    conversation.push(assistantMsg);

    for (const call of toolCalls) {
      const callStart = performance.now();
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.arguments);
      } catch {
        /* empty args */
      }

      const toolResult = await executeTool(call.name, args, patientId);
      const resultStr = JSON.stringify(toolResult);

      callLogs.push({
        name: call.name,
        arguments: args,
        result: toolResult,
        durationMs: Math.round(performance.now() - callStart),
      });

      conversation.push({
        role: "tool",
        tool_call_id: call.call_id,
        content: resultStr,
      });
    }

    logToolRound(trace, round + 1, roundReasoning, callLogs, Math.round(performance.now() - roundStart));
  }

  // ── Phase 2: stream final text response ──
  const streamStart = performance.now();
  const encoder = new TextEncoder();

  const outputStream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      try {
        for await (const delta of provider.streamFinalResponse(instructions, conversation)) {
          fullResponse += delta;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`
            )
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: msg })}\n\n`
          )
        );
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();

      finalizeTrace(
        trace,
        Math.round(performance.now() - t0),
        Math.round(performance.now() - streamStart),
        fullResponse
      );
      persistTrace(trace);
    },
  });

  return new Response(outputStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
