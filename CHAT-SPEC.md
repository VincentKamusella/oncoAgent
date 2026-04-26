# Agent Chat — Architecture & Integration Spec

The Cliniarc agent is a context-aware AI copilot embedded in the right panel of the IDE. It assists Dr. Okonkwo with patient record review, conflict detection, and tumor board preparation.

This spec documents the current implementation and how to extend it when the UI changes.

---

## 1. Architecture

```
┌──────────────┐     POST /api/chat      ┌──────────────────────┐
│  AgentChat   │ ─── (SSE stream) ─────▶ │   route.ts handler   │
│  component   │ ◀── data: {delta}  ──── │                      │
└──────────────┘                          │  Phase 1: tool calls │
                                          │  Phase 2: stream text│
                                          └──────────┬───────────┘
                                                     │
                                          ┌──────────▼───────────┐
                                          │  Provider Layer      │
                                          │  (CHAT_PROVIDER env) │
                                          ├──────────┬───────────┤
                                          │ Pioneer  │  Azure    │
                                          │ Chat     │  OpenAI   │
                                          │ Complet. │  Resp.API │
                                          └──────────┴───────────┘
```

**Two-phase API pattern:**

- **Phase 1** — Non-streaming calls with tools enabled. The model can make up to 5 rounds of tool calls to gather data. Non-streaming is used here for reliable tool call parsing.
- **Phase 2** — Streaming call without tools. Takes the full conversation (including tool results) and streams the final text response. This gives the typewriter effect in the UI.

**Provider toggle:** Set `CHAT_PROVIDER=pioneer` or `CHAT_PROVIDER=azure` in `.env.local`. See `PIONEER-SPEC.md` for full integration details.

---

## 2. Context Injection (Tiered)

Context is injected in three tiers to keep prompts focused and token-efficient.

### Tier 1 — Patient summary (always included)
Built by `buildPatientSummary(patient)` in `lib/chat/context.ts`. Always present in the system prompt regardless of which view the user is on. ~400-600 tokens.

Includes:
- Demographics, MRN, status, diagnosis, staging, cancer type
- Primary oncologist
- Active treatment phase (name, type, regimen, cycle progress)
- Current agent activity
- Pending decisions (agent questions needing clinician input)
- Active board case (question, status, decision)

### Tier 2 — View context (route-aware)
Built by `buildViewContext(patientId, view, patient)`. Injects context specific to what the clinician is currently looking at. This is the key insight — the chat knows which page you're on and pre-loads relevant data.

### Tier 3 — Tool calling (on-demand)
When the user asks about data not in the current view, the model calls tools to fetch it. Tools are patient-scoped — they can only access the current patient's data.

---

## 3. View Mapping

The frontend derives the current view from the URL and sends it to the API. The context builder uses this to inject the right Tier 2 data.

### How view derivation works

```
URL path                              → view string
/patients/{id}                        → "vault"
/patients/{id}?specialty=pathology    → "vault:pathology"
/patients/{id}?specialty=radiology    → "vault:radiology"
/patients/{id}/inbox                  → "inbox"
/patients/{id}/prs/{prId}            → "pr:{prId}"
/patients/{id}/board                  → "board"
/patients/{id}/meetings               → "meetings"
/patients/{id}/meetings/{mId}        → "meeting:{mId}"
/patients/{id}/plan                   → "plan"
/patients/{id}/followup               → "followup"
/patients/{id}/guidelines             → "guidelines"
```

`deriveView()` in `agent-chat.tsx` works dynamically:
1. Strips the `/patients/{id}` prefix
2. Checks for detail routes (`/prs/{id}`, `/meetings/{id}`) via regex
3. Reads `?specialty=` query param for vault filtering
4. Falls back to using the remaining path segment as the view name

This means **new top-level routes automatically work** — if the UI adds `/patients/{id}/timeline`, the chat receives `view = "timeline"` without any code changes to `deriveView`.

### Current view builders

| View | Context injected |
|------|-----------------|
| `vault` | All patient facts grouped by category, tagged with specialty |
| `vault:{specialty}` | Facts filtered to the selected specialty only |
| `inbox` | Open PRs (title, status, verdict) + agent questions + upcoming follow-ups |
| `board` | Active board case + treatment options under review + meetings |
| `pr:{id}` | Full PR detail: proposed changes, conflicts with severity, agent verdict |
| `meeting:{id}` | Meeting metadata + full transcript + agent notes + summary |
| `prs` | All PRs list (title, status, verdict) |
| `plan` | Treatment phases with type, regimen, status, cycles, rationale |
| `meetings` | All meetings (title, date, status) |
| `followup` | Follow-up schedule with dates, types, prep instructions |
| `guidelines` | Guideline pathway title, source, and patient's path through decision nodes |
| Unknown view | Minimal context + open PRs list + instruction to use tools |

### Adding a new view

To add context for a new route (e.g. `/patients/{id}/timeline`):

1. **No changes needed in `agent-chat.tsx`** — `deriveView` already returns `"timeline"` dynamically
2. **Add a builder in `context.ts`** — add `timeline: (patientId, patient) => { ... }` to the `viewBuilders` record
3. **Optionally add a tool in `tools.ts`** — if the view has data the model should be able to fetch on-demand from other views

If you skip step 2, the unknown-view fallback kicks in — the chat still works, just with less context.

---

## 4. Tools (Tier 3)

13 tools available to the model. All are patient-scoped — `patientId` is injected server-side, never exposed to the model.

| Tool | Args | Returns |
|------|------|---------|
| `get_patient_facts` | `group?` (demographics, diagnosis, staging, medication, imaging, lab, history, genomics) | Facts with key, label, value, group, confidence, source, updatedAt, specialty |
| `get_pull_requests` | `status?` (open, merged, conflict, needs-review) | PR list with id, title, status, summary, author, verdict, conflict count |
| `get_pr_details` | `pr_id` (required) | Full PR: proposed changes, conflicts with severity/rationale, verdict |
| `get_treatment_plan` | — | All treatment phases with type, regimen, status, cycles, rationale |
| `get_meetings` | — | Meeting list with id, title, date, status, attendees, hasTranscript |
| `get_meeting_transcript` | `meeting_id` (required) | Transcript lines, agent notes, summary |
| `get_followup_schedule` | — | Follow-up items with date, type, label, status, prep |
| `get_guidelines` | — | Guideline pathway with patient's path through decision nodes |
| `get_board_case` | — | Active board case: question, status, attendees, decision info |
| `get_treatment_options` | — | Treatment options: intent, phases, rationale, outcomes, toxicities, evidence, clinician rankings |
| `traverse_graph` | `start_node`, `node_type`, `direction?`, `max_depth?` | Graph traversal results — relationships, connected entities |
| `extract_entities` | `text`, `schema?` | NER extraction via Pioneer fine-tuned model — entities with types and confidence |
| `search_literature` | `query`, `max_results?` | Tavily search — answer summary + ranked results from medical literature |

### Adding a new tool

1. Add the definition to `toolDefinitions[]` in `lib/chat/tools.ts` (follows Azure function calling schema)
2. Add the executor case in `executeTool()` switch statement
3. Import any new mock-data functions needed

### Security model

- Tools receive `patientId` from the server, not from the model's arguments
- The model cannot request data for a different patient
- Cross-patient queries return "not found" or scoped-to-current-patient results
- No write operations — all tools are read-only

---

## 5. Session Management

- Each patient gets an independent chat session with a unique `sessionId`
- Sessions persist in-memory when switching between patients (Map keyed by patient ID)
- Returning to a patient restores the previous conversation
- "Clear chat" resets messages and generates a new session ID
- Session IDs are passed to the API for log correlation

### Seed messages

On first load (or after clear), the chat shows a contextual greeting:
- If the patient has pending agent questions: highlights the first question
- Otherwise: generic "Ask me anything about the case"

---

## 6. Logging & Tracing

Every API request produces a `ChatTrace` logged to console and `.logs/` (JSONL).

Each trace includes:
- `sessionId`, `requestId`, `timestamp`
- `patientId`, `view`, `userMessage`
- `systemPromptTokenEstimate`
- `toolRounds[]` — each round lists tool calls with arguments, results, and timing
- `totalToolCalls`, `streamDurationMs`, `totalDurationMs`

Log files: `.logs/{date}_{sessionId}.jsonl`

---

## 7. Future-Proofing Strategy

The chat is designed to survive UI changes without breaking.

### What happens automatically

- **New top-level routes** — `deriveView` extracts the path segment dynamically, so `/patients/{id}/anything` becomes `view = "anything"` with no code changes. The unknown-view fallback provides minimal context.
- **New query params on vault** — any `?specialty=X` value is forwarded as `vault:X`.
- **New detail routes** — routes matching `/prs/{id}` or `/meetings/{id}` are already handled. Other detail patterns would need a regex addition in `deriveView`.

### What needs manual updates

- **New data types on Patient** — if the Patient type gains new fields (e.g. `patient.timeline`), add a view builder in `context.ts` and optionally a tool in `tools.ts`.
- **New detail route patterns** — if a new drillable entity is added (e.g. `/patients/{id}/issues/{issueId}`), add a regex case in `deriveView` and a handler in `buildViewContext`.
- **Specialty list changes** — the vault specialty filter passes whatever string the URL contains, so new specialties work automatically. The `get_patient_facts` tool's group enum may need updating if new groups are added to the Fact type.
- **New mock-data modules** — create the module, import it in `tools.ts`, wire up a tool.

### Extension checklist

When the UI changes, walk through:

1. **Routes** — did any new routes get added? Check `app/patients/[id]/` for new `page.tsx` files.
2. **Data types** — did `lib/types.ts` gain new types or fields? Update tools and context builders.
3. **Sidebar** — did the sidebar structure change? Check if new filtering dimensions were added (like specialty).
4. **Mock data** — are there new files in `lib/mock-data/`? Wire them into tools.

---

## 8. Files

| File | Purpose |
|------|---------|
| `components/agent-chat/agent-chat.tsx` | Chat UI component — streaming, session management, view derivation |
| `app/api/chat/route.ts` | API route — two-phase provider-agnostic integration, SSE streaming |
| `lib/chat/context.ts` | System prompt builder — patient summary, view context, persona |
| `lib/chat/tools.ts` | Tool definitions and executors — 13 patient-scoped tools |
| `lib/chat/logger.ts` | Structured tracing — console + JSON file output |
| `lib/chat/providers/types.ts` | ChatProvider interface and shared types |
| `lib/chat/providers/azure.ts` | Azure OpenAI Responses API provider |
| `lib/chat/providers/pioneer.ts` | Pioneer (Fastino) OpenAI-compatible Chat Completions provider |
| `lib/chat/providers/index.ts` | Provider factory — reads `CHAT_PROVIDER` env var |
| `.env.local` | API keys and provider toggle (gitignored) |
| `PIONEER-SPEC.md` | Full Pioneer & Tavily integration spec |

---

## 9. Environment

```bash
# Provider toggle
CHAT_PROVIDER=pioneer          # "pioneer" | "azure"

# Pioneer (Fastino Labs)
PIONEER_API_KEY=pio_sk_...
PIONEER_BASE_URL=https://api.pioneer.ai/v1
PIONEER_CHAT_MODEL=Qwen/Qwen3-235B-A22B
PIONEER_NER_MODEL=<job-id>     # colleague's fine-tuned NER model
PIONEER_NER_THRESHOLD=0.3

# Tavily
TAVILY_API_KEY=tvly-...

# Azure OpenAI (fallback)
AZURE_OPENAI_ENDPOINT=<endpoint>
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_MODEL=gpt-5-mini
```

---

## 10. Known Limitations

- **In-memory sessions** — sessions are lost on page refresh or server restart. Acceptable for hackathon. Production would use a session store.
- **No write tools** — the agent can read all patient data but cannot merge PRs, close issues, or modify the record. This is intentional for the demo (clinician always in control).
- **Provider toggle** — switching between Pioneer and Azure requires a server restart (env vars read at startup). A future improvement could make this a runtime toggle.
- **No conversation history on the API side** — full message history is sent with each request. Long conversations will hit token limits. Production would implement sliding-window truncation.
- **Mock data only** — all tools hit `lib/mock-data/` modules. No real EHR/PACS/LIS integration.
