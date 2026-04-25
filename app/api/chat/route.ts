import { getPatient } from "@/lib/data";
import { buildSystemPrompt } from "@/lib/chat/context";
import { toolDefinitions, executeTool } from "@/lib/chat/tools";
import {
  createTrace,
  logToolRound,
  finalizeTrace,
  persistTrace,
  type ToolCallLog,
} from "@/lib/chat/logger";

type InputMessage = { role: "user" | "assistant"; content: string };

type FunctionCallInput = {
  type: "function_call";
  name: string;
  call_id: string;
  arguments: string;
};

type FunctionCallOutputInput = {
  type: "function_call_output";
  call_id: string;
  output: string;
};

type ResponseInput = InputMessage | FunctionCallInput | FunctionCallOutputInput;

const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const API_KEY = process.env.AZURE_OPENAI_API_KEY!;
const MODEL = process.env.AZURE_OPENAI_MODEL ?? "gpt-5-mini";
const MAX_TOOL_ROUNDS = 5;

async function callAzure(
  instructions: string,
  input: ResponseInput[],
  stream: boolean,
  includeTools: boolean
) {
  const body: Record<string, unknown> = {
    model: MODEL,
    instructions,
    input,
    stream,
  };
  if (includeTools) body.tools = toolDefinitions;

  return fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });
}

type ToolCall = { name: string; call_id: string; arguments: string };

async function parseNonStreaming(
  res: Response
): Promise<{ text: string; toolCalls: ToolCall[] }> {
  const json = await res.json();
  let text = "";
  const toolCalls: ToolCall[] = [];

  for (const item of json.output ?? []) {
    if (item.type === "message") {
      for (const part of item.content ?? []) {
        if (part.type === "output_text") text += part.text;
      }
    } else if (item.type === "function_call") {
      toolCalls.push({
        name: item.name,
        call_id: item.call_id,
        arguments: item.arguments,
      });
    }
  }

  return { text, toolCalls };
}

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

  if (!API_KEY || !ENDPOINT) {
    return Response.json({ error: "Azure OpenAI not configured" }, { status: 500 });
  }

  const instructions = await buildSystemPrompt(patient, view);
  const userMessage = messages[messages.length - 1]?.content ?? "";
  const trace = createTrace(
    sessionId ?? "anonymous",
    patientId,
    view,
    userMessage,
    instructions
  );

  let input: ResponseInput[] = [...messages];

  // ── Phase 1: resolve tool calls (non-streaming for reliable parsing) ──
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const roundStart = performance.now();
    const res = await callAzure(instructions, input, false, true);

    if (!res.ok) {
      const errText = await res.text();
      return Response.json(
        { error: `Azure API error ${res.status}: ${errText}` },
        { status: 502 }
      );
    }

    const { toolCalls } = await parseNonStreaming(res);
    if (toolCalls.length === 0) break;

    const callLogs: ToolCallLog[] = [];

    for (const call of toolCalls) {
      const callStart = performance.now();
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.arguments);
      } catch {
        /* empty args */
      }

      const result = await executeTool(call.name, args, patientId);
      callLogs.push({
        name: call.name,
        arguments: args,
        result,
        durationMs: Math.round(performance.now() - callStart),
      });

      input.push(
        {
          type: "function_call",
          name: call.name,
          call_id: call.call_id,
          arguments: call.arguments,
        },
        {
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result),
        }
      );
    }

    logToolRound(trace, round + 1, callLogs, Math.round(performance.now() - roundStart));
  }

  // ── Phase 2: stream final text response (no tools — text only) ──
  const streamStart = performance.now();
  const streamRes = await callAzure(instructions, input, true, false);

  if (!streamRes.ok) {
    const errText = await streamRes.text();
    return Response.json(
      { error: `Azure API error ${streamRes.status}: ${errText}` },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();

  const outputStream = new ReadableStream({
    async start(controller) {
      const reader = streamRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") continue;

            let event: Record<string, unknown>;
            try {
              event = JSON.parse(payload);
            } catch {
              continue;
            }

            if (event.type === "response.output_text.delta") {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "delta", content: event.delta })}\n\n`
                )
              );
            }
          }
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
        Math.round(performance.now() - streamStart)
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
