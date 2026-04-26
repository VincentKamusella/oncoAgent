import type {
  ChatMessage,
  ChatProvider,
  ToolCall,
  ToolDefinition,
} from "./types";

const API_KEY = process.env.PIONEER_API_KEY!;
const BASE_URL = process.env.PIONEER_BASE_URL ?? "https://api.pioneer.ai/v1";
const MODEL = process.env.PIONEER_CHAT_MODEL ?? "Qwen/Qwen3-235B-A22B";

type OpenAIMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] }
  | { role: "tool"; tool_call_id: string; content: string };

function toOpenAIMessages(
  systemPrompt: string,
  conversation: ChatMessage[]
): OpenAIMessage[] {
  const out: OpenAIMessage[] = [{ role: "system", content: systemPrompt }];
  for (const msg of conversation) {
    if (msg.role === "user") {
      out.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      const entry: OpenAIMessage = {
        role: "assistant",
        content: msg.content,
      };
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        (entry as Record<string, unknown>).tool_calls = msg.tool_calls;
      }
      out.push(entry);
    } else if (msg.role === "tool") {
      out.push({
        role: "tool",
        tool_call_id: msg.tool_call_id,
        content: msg.content,
      });
    }
  }
  return out;
}

function toOpenAITools(tools: ToolDefinition[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

async function callPioneer(
  messages: OpenAIMessage[],
  stream: boolean,
  tools?: ToolDefinition[]
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    stream,
  };
  if (tools) body.tools = toOpenAITools(tools);

  return fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });
}

export const pioneerProvider: ChatProvider = {
  name: "pioneer",

  async callForToolResolution(systemPrompt, conversation, tools) {
    const messages = toOpenAIMessages(systemPrompt, conversation);
    const res = await callPioneer(messages, false, tools);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Pioneer API error ${res.status}: ${errText}`);
    }

    const json = await res.json();
    const choice = json.choices?.[0]?.message;
    if (!choice) return { reasoning: "", toolCalls: [] };

    const reasoning = choice.content ?? "";
    const toolCalls: ToolCall[] = (choice.tool_calls ?? []).map(
      (tc: { id: string; function: { name: string; arguments: string } }) => ({
        name: tc.function.name,
        call_id: tc.id,
        arguments: tc.function.arguments,
      })
    );

    return { reasoning, toolCalls };
  },

  async *streamFinalResponse(systemPrompt, conversation) {
    const messages = toOpenAIMessages(systemPrompt, conversation);
    const res = await callPioneer(messages, true);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Pioneer API error ${res.status}: ${errText}`);
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

        const choices = event.choices as
          | { delta: { content?: string } }[]
          | undefined;
        const delta = choices?.[0]?.delta?.content;
        if (delta) yield delta;
      }
    }
  },
};
