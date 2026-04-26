import type {
  ChatMessage,
  ChatProvider,
  ToolCall,
  ToolCallItem,
  ToolDefinition,
} from "./types";

const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const API_KEY = process.env.AZURE_OPENAI_API_KEY!;
const MODEL = process.env.AZURE_OPENAI_MODEL ?? "gpt-5-mini";

type AzureInput =
  | { role: "user" | "assistant"; content: string }
  | { type: "function_call"; name: string; call_id: string; arguments: string }
  | { type: "function_call_output"; call_id: string; output: string };

function toAzureInput(messages: ChatMessage[]): AzureInput[] {
  const out: AzureInput[] = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      out.push({ role: "user", content: msg.content ?? "" });
    } else if (msg.role === "assistant") {
      if (msg.content) out.push({ role: "assistant", content: msg.content });
      if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          out.push({
            type: "function_call",
            name: tc.function.name,
            call_id: tc.id,
            arguments: tc.function.arguments,
          });
        }
      }
    } else if (msg.role === "tool") {
      out.push({
        type: "function_call_output",
        call_id: msg.tool_call_id,
        output: msg.content,
      });
    }
  }
  return out;
}

async function callAzure(
  instructions: string,
  input: AzureInput[],
  stream: boolean,
  tools?: ToolDefinition[]
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: MODEL,
    instructions,
    input,
    stream,
  };
  if (tools) body.tools = tools;

  return fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });
}

export const azureProvider: ChatProvider = {
  name: "azure",

  async callForToolResolution(systemPrompt, conversation, tools) {
    const input = toAzureInput(conversation);
    const res = await callAzure(systemPrompt, input, false, tools);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Azure API error ${res.status}: ${errText}`);
    }

    const json = await res.json();
    let reasoning = "";
    const toolCalls: ToolCall[] = [];

    for (const item of json.output ?? []) {
      if (item.type === "message") {
        for (const part of item.content ?? []) {
          if (part.type === "output_text") reasoning += part.text;
        }
      } else if (item.type === "function_call") {
        toolCalls.push({
          name: item.name,
          call_id: item.call_id,
          arguments: item.arguments,
        });
      }
    }

    return { reasoning, toolCalls };
  },

  async *streamFinalResponse(systemPrompt, conversation) {
    const input = toAzureInput(conversation);
    const res = await callAzure(systemPrompt, input, true);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Azure API error ${res.status}: ${errText}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

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
          yield event.delta as string;
        }
      }
    }
  },
};
