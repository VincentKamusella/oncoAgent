export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCallItem[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ToolCallItem = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ToolCall = {
  name: string;
  call_id: string;
  arguments: string;
};

export type ToolDefinition = {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export interface ChatProvider {
  name: string;

  callForToolResolution(
    systemPrompt: string,
    conversation: ChatMessage[],
    tools: ToolDefinition[]
  ): Promise<{ reasoning: string; toolCalls: ToolCall[] }>;

  streamFinalResponse(
    systemPrompt: string,
    conversation: ChatMessage[]
  ): AsyncGenerator<string>;
}
