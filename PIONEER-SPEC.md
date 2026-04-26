# Pioneer & Tavily Integration Spec

Integrating Fastino Labs Pioneer platform and Tavily medical literature search into the Cliniarc chat agent. Azure OpenAI remains as a togglable fallback.

---

## 1. What Changed & Why

The original chat uses Azure OpenAI (gpt-5-mini) via the Responses API. This integration adds:

1. **Pioneer as primary chat LLM** — uses a serverless base model (e.g. Qwen3-235B, DeepSeek-V3.1) via Pioneer's OpenAI-compatible `/v1/chat/completions` endpoint. Free inference until Aug 2026.
2. **Pioneer NER tool** — colleague's fine-tuned `oncoagent-ner-v2-lr1e5` model for extracting clinical entities from uploaded documents. Wired as a chat tool, not the chat LLM itself.
3. **Tavily literature search tool** — searches recent oncology literature, clinical trials, and meta-analyses. Patient-specific queries built from cancer type, stage, biomarkers.
4. **Provider toggle** — `CHAT_PROVIDER` env var switches between `pioneer` and `azure` with zero code changes.

### Important distinction

The colleague's Pioneer model (`8ea2d887-b524-4b6a-b66d-1fd357c964d6`) is a **NER model** trained for entity extraction (patients, hospitals, medical records, etc.). It is NOT a general-purpose chat model. It uses Pioneer's native inference API:

```
POST https://api.pioneer.ai/v1/chat/completions
{
  "model": "8ea2d887-b524-4b6a-b66d-1fd357c964d6",
  "task": "extract_entities",
  "text": "...",
  "schema": ["patient", "hospital", "medical_record"],
  "threshold": 0.3
}
```

For chat, we use one of Pioneer's **serverless base models** via the same API but in standard OpenAI chat format.

---

## 2. Architecture

```
                    CHAT_PROVIDER env var
                    ┌─── "pioneer" ───┐  ┌─── "azure" ────┐
                    │                 │  │                 │
                    ▼                 │  ▼                 │
             ┌─────────────┐         │  ┌─────────────┐   │
             │  Pioneer    │         │  │  Azure       │   │
             │  Chat LLM   │         │  │  OpenAI      │   │
             │  (Qwen3 /   │         │  │  (gpt-5-mini │   │
             │  DeepSeek)  │         │  │  Responses)  │   │
             └──────┬──────┘         │  └──────┬───────┘   │
                    │                │         │           │
                    └───────┬────────┘         │           │
                            │                  │           │
                            ▼                  ▼           │
                    ┌──────────────────────────────┐       │
                    │      route.ts handler        │       │
                    │  Phase 1: tool resolution    │       │
                    │  Phase 2: stream final text  │       │
                    └──────────┬───────────────────┘       │
                               │                           │
                    ┌──────────▼───────────────────┐       │
                    │         13 Tools             │       │
                    │  ┌─────────────────────────┐ │       │
                    │  │ 11 existing tools       │ │       │
                    │  │ + extract_entities (NER) │ │       │
                    │  │ + search_literature      │ │       │
                    │  └─────────────────────────┘ │       │
                    └──────────────────────────────┘
```

### Provider layer

```
lib/chat/providers/
├── types.ts      — ChatProvider interface
├── azure.ts      — Azure Responses API (current logic, extracted)
├── pioneer.ts    — Pioneer OpenAI-compatible Chat Completions
└── index.ts      — factory: reads CHAT_PROVIDER, returns provider
```

Both providers implement:

```typescript
interface ChatProvider {
  name: string;
  resolveTools(
    systemPrompt: string,
    messages: Message[],
    tools: ToolDef[]
  ): Promise<{ reasoning: string; toolCalls: ToolCall[] }>;

  streamFinal(
    systemPrompt: string,
    messages: Message[]
  ): Promise<Response>;
}
```

The route handler (`app/api/chat/route.ts`) calls `provider.resolveTools()` in a loop, then `provider.streamFinal()` — identical control flow regardless of backend.

---

## 3. API Format Differences

### Azure OpenAI (Responses API)

```json
POST /openai/responses?api-version=2025-04-01-preview
{
  "model": "gpt-5-mini",
  "instructions": "system prompt here",
  "input": [
    { "role": "user", "content": "..." },
    { "type": "function_call", "name": "...", "call_id": "...", "arguments": "..." },
    { "type": "function_call_output", "call_id": "...", "output": "..." }
  ],
  "tools": [...],
  "stream": true
}
```

- Uses `instructions` field for system prompt
- Uses `input` array with typed items (messages, function calls, function outputs)
- Auth: `api-key` header
- Streaming events: `response.output_text.delta`

### Pioneer (OpenAI-compatible Chat Completions)

```json
POST https://api.pioneer.ai/v1/chat/completions
{
  "model": "Qwen/Qwen3-235B-A22B",
  "messages": [
    { "role": "system", "content": "system prompt here" },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": null, "tool_calls": [...] },
    { "role": "tool", "tool_call_id": "...", "content": "..." }
  ],
  "tools": [...],
  "stream": true
}
```

- Uses standard `messages` array with `system` role
- Tool calls use `tool_calls` array on assistant messages
- Tool results use `role: "tool"` messages
- Auth: `Authorization: Bearer <key>` OR `X-API-Key` header
- Streaming events: standard OpenAI SSE (`choices[0].delta`)

### Key mapping

| Concept | Azure Responses API | Pioneer Chat Completions |
|---------|-------------------|------------------------|
| System prompt | `instructions` field | `{ role: "system" }` message |
| Tool call | `{ type: "function_call", call_id, name, arguments }` | `assistant.tool_calls[{ id, function: { name, arguments } }]` |
| Tool result | `{ type: "function_call_output", call_id, output }` | `{ role: "tool", tool_call_id, content }` |
| Stream delta | `response.output_text.delta` | `choices[0].delta.content` |
| Tool in stream | `response.function_call_arguments.delta` | `choices[0].delta.tool_calls[0].function.arguments` |
| Auth header | `api-key: <key>` | `Authorization: Bearer <key>` |

---

## 4. New Tools

### 4a. `extract_entities` — Pioneer NER

Calls the colleague's fine-tuned NER model to extract clinical entities from text.

**Tool definition:**
```json
{
  "name": "extract_entities",
  "description": "Extract clinical entities (patients, hospitals, diagnoses, medications, biomarkers) from unstructured clinical text using the fine-tuned NER model.",
  "parameters": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "The clinical text to extract entities from."
      },
      "schema": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Entity types to extract. Options: patient, hospital, medical_record, diagnosis, medication, biomarker, procedure, lab_result"
      }
    },
    "required": ["text"]
  }
}
```

**Executor:** Calls Pioneer native inference API directly:
```
POST https://api.pioneer.ai/v1/chat/completions
{
  "model": "8ea2d887-b524-4b6a-b66d-1fd357c964d6",
  "task": "extract_entities",
  "text": "...",
  "schema": [...],
  "threshold": 0.3
}
```

### 4b. `search_literature` — Tavily

Searches recent oncology literature, clinical trials, and guidelines.

**Tool definition:**
```json
{
  "name": "search_literature",
  "description": "Search recent medical literature, clinical trials, and meta-analyses for oncology-related queries. Returns ranked results with titles, URLs, and content excerpts. Use when the clinician asks about recent evidence, treatment guidelines, or clinical trial results.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query. Be specific — include cancer type, stage, biomarkers, treatment names."
      },
      "max_results": {
        "type": "integer",
        "description": "Maximum results to return. Default: 5."
      }
    },
    "required": ["query"]
  }
}
```

**Executor:** Calls Tavily search API:
```
POST https://api.tavily.com/search
{
  "api_key": "...",
  "query": "...",
  "search_depth": "advanced",
  "include_answer": true,
  "max_results": 5,
  "include_domains": ["pubmed.ncbi.nlm.nih.gov", "clinicaltrials.gov", "nccn.org", "asco.org", "nejm.org", "thelancet.com"]
}
```

Returns: `{ answer, results: [{ title, url, content, score }] }`

---

## 5. Tool Calling Risk (Pioneer)

Pioneer's docs do not explicitly confirm function/tool calling support on the OpenAI-compatible endpoint. Possible outcomes:

1. **Works** — Pioneer proxies the `tools` parameter to the underlying base model (Qwen3, DeepSeek support tool calling natively). Most likely scenario.
2. **Ignored** — Pioneer strips the `tools` parameter. The model responds with text only, never makes tool calls. Chat works but without tool access.
3. **Errors** — Pioneer rejects the request with a 400/422. Easy to detect.

**Fallback strategy:** If Pioneer doesn't support tool calling, use a **hybrid approach**:
- Phase 1 (tool resolution): Always use Azure (reliable tool calling)
- Phase 2 (final response): Use Pioneer (better for the demo)
- Toggle: `CHAT_TOOL_PROVIDER=azure` + `CHAT_STREAM_PROVIDER=pioneer`

Implementation detects this automatically — if the first Pioneer tool call returns no tool calls and the model tries to describe what it would do instead, we fall back to Azure for that phase.

---

## 6. Environment Variables

```bash
# ── Provider toggle ──
CHAT_PROVIDER=pioneer          # "pioneer" | "azure"

# ── Pioneer — Chat LLM (serverless base model) ──
PIONEER_API_KEY=pio_sk_...
PIONEER_BASE_URL=https://api.pioneer.ai/v1
PIONEER_CHAT_MODEL=Qwen/Qwen3-235B-A22B   # or: deepseek-ai/DeepSeek-V3.1, meta-llama/Llama-3.3-70B-Instruct

# ── Pioneer — NER tool (colleague's fine-tuned model) ──
PIONEER_NER_MODEL=8ea2d887-b524-4b6a-b66d-1fd357c964d6
PIONEER_NER_THRESHOLD=0.3

# ── Tavily — literature search ──
TAVILY_API_KEY=tvly-...

# ── Azure OpenAI — fallback ──
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_ENDPOINT=<endpoint>
AZURE_OPENAI_MODEL=gpt-5-mini
```

---

## 7. Available Pioneer Serverless Models

These are zero-cold-start, free until Aug 1, 2026:

| Model | Size | Good for |
|-------|------|----------|
| `Qwen/Qwen3-235B-A22B` | 235B (MoE) | Best reasoning, largest model available |
| `deepseek-ai/DeepSeek-V3.1` | Large | Strong coding + reasoning |
| `openai/gpt-oss-120b` | 120B | General purpose |
| `meta-llama/Llama-3.3-70B-Instruct` | 70B | Well-tested, reliable tool calling |
| `Qwen/Qwen3-8B` | 8B | Fast, lightweight |

**Recommendation:** Start with `Qwen/Qwen3-235B-A22B` (most capable) or `meta-llama/Llama-3.3-70B-Instruct` (most reliable for tool calling). Switch if you hit issues.

---

## 8. Implementation Files

| File | Change |
|------|--------|
| `lib/chat/providers/types.ts` | NEW — `ChatProvider` interface, shared types |
| `lib/chat/providers/azure.ts` | NEW — extracted from current `route.ts` |
| `lib/chat/providers/pioneer.ts` | NEW — OpenAI Chat Completions format |
| `lib/chat/providers/index.ts` | NEW — factory function |
| `app/api/chat/route.ts` | MODIFIED — uses provider abstraction instead of direct Azure calls |
| `lib/chat/tools.ts` | MODIFIED — add `extract_entities` and `search_literature` tools |
| `.env.local` | MODIFIED — add Pioneer + Tavily keys |
| `CHAT-SPEC.md` | UPDATE — reference this spec for provider details |

---

## 9. What's Preserved

Everything from the current chat implementation carries over:

- 11 existing tools (now 13 with NER + literature)
- Two-phase pattern (tool resolution loop → streaming final response)
- Full trace logging to `.logs/` with pretty-printed JSON
- System prompt with patient summary + view context
- Session management (in-memory, per-patient)
- Patient-scoped security (tools can only access current patient)
- SSE streaming to the frontend (`data: {delta}` format)
- Graph traversal via `traverse_graph` tool

---

## 10. Colleague's Tavily Research Script

The standalone Python script at `.tavily/research.py` builds patient-specific search queries and scores results. The `search_literature` chat tool follows the same approach but runs inside the chat pipeline:

- De-identified queries (no names, MRNs, DOB)
- Prioritizes clinical trial keywords (randomized, phase II/III, meta-analysis)
- Domain-restricted to medical literature sources
- Returns ranked results with relevance scores

The Python script can continue to be used independently for batch research. The chat tool is for real-time, conversational literature lookups.
