import type { ChatProvider } from "./types";
import { azureProvider } from "./azure";
import { pioneerProvider } from "./pioneer";

export type { ChatProvider, ChatMessage, ToolCall, ToolDefinition } from "./types";

export function getChatProvider(): ChatProvider {
  const name = process.env.CHAT_PROVIDER ?? "azure";
  switch (name) {
    case "pioneer":
      return pioneerProvider;
    case "azure":
      return azureProvider;
    default:
      console.warn(`Unknown CHAT_PROVIDER "${name}", falling back to azure`);
      return azureProvider;
  }
}
