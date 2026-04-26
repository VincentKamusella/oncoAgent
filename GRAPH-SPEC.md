# Graph & Review Hardening — Working Spec

Three goals: (1) repopulate the existing Neo4j Aura graph with our actual Supabase patients and connect the app to query it, (2) fix the gaps in the review system, (3) expand seed data so the graph and UI have enough substance to be useful.

---

## 1. Current state

### What we have

| System | State | Problem |
|--------|-------|---------|
| **Supabase** | 3 patients, 34 facts, 6 PRs, 3 meetings, full schema | Maria has 10 specialty types; Thomas/Anna are thin (9 facts each, 4 specialties) |
| **Neo4j Aura** | 5 mock patients (Linda, Greta, Sofia, Britta, Eszter) — none match Supabase | Database exists with good relationship schema (`SUPERSEDES`, `CONTRADICTS_FACT`, `DERIVED_FROM`, `AUTHORED_BY`, `GUIDED_BY`, etc.) but populated with wrong patients. App has zero code connecting to it — env vars are set but no driver client exists |
| **FactsGraph component** | Uses Neo4j NVL library for viz but builds graph from Supabase facts in-browser | Not connected to the actual Neo4j database. One hop deep (patient → group → fact → source). No cross-entity edges |
| **Review system** | Sign-off and decline work, conflict blocking works | No transactions, no audit trail, no amendments, no comments. See §5 |
| **Chat agent** | 10 tools, all flat Supabase queries | No graph traversal. Can't answer "what depends on this fact?" or "trace the evidence chain" |

### What we want

- Neo4j cleared of mock patients and repopulated with Maria, Thomas, Anna from Supabase — reusing the existing relationship types (SUPERSEDES, CONTRADICTS, DERIVED_FROM, etc.) with the correct data
- All 3 patients normalized to 4 specialty folders (Pathology, Radiology, Medical oncology, Nursing & intake)
- Richer seed data (≥25 facts per patient, more PRs, more meetings)
- Chat agent with a `traverse_graph` tool for relationship queries
- FactsGraph upgraded to show cross-entity edges from Neo4j
- Review system hardened (transactions, audit trail, amendments)

---

## 2. Specialty normalization

### The 4 folders

Every patient shows exactly these 4 specialty folders in the sidebar:

| Folder | Specialty key | What goes here |
|--------|--------------|----------------|
| Pathology | `pathology` | Histology, IHC, FISH, receptor status, biopsy results, surgical pathology, molecular/genomic results |
| Radiology | `radiology` | All imaging — MRI, CT, mammogram, PET, ultrasound, nuclear medicine, interventional procedures |
| Medical oncology | `med-onc` | Diagnosis, staging, treatment plans, systemic therapy, labs, tumor markers, clinical assessments, pharmacy reviews, genomic interpretation, trial eligibility |
| Nursing & intake | `nursing` | Demographics, intake, vitals, patient-reported outcomes, infusion notes, care coordination, follow-up scheduling |

### Reassignment rules for Maria's current facts

| Current specialty | Current facts | Reassign to |
|---|---|---|
| `pathology` | diagnosis.primary, diagnosis.receptors | Keep `pathology` |
| `radiology` | staging.clinical | Keep `radiology` |
| `med-onc` | medication.neoadjuvant, medication.cycle, lab.lvef, lab.cbc | Keep `med-onc` |
| `surg-onc` | history.surg-consult | → `med-onc` (consult notes are clinical assessments) |
| `rad-onc` | history.rt-consult | → `med-onc` (consult notes are clinical assessments) |
| `molecular` | genomics.panel, genomics.oncokb | → `pathology` (molecular results are pathology subspecialty) |
| `pharmacy` | medication.pharmacy-review | → `med-onc` (pharmacy review is part of treatment planning) |
| `nursing` | demographics.name, demographics.dob, demographics.mrn, medication.cycle | Keep `nursing` |
| `patient` | history.event.first-presentation | → `nursing` (patient-reported intake) |

### Code changes required

- **`lib/types.ts`**: Narrow `Specialty` type to `"pathology" | "radiology" | "med-onc" | "nursing"`
- **`components/vault/specialist-tree.tsx`**: Remove the 8 extra folder definitions (surg-onc, rad-onc, molecular, genetics, nuc-med, ir, pharmacy, patient)
- **`supabase/migrations/003_normalize.sql`**: UPDATE facts SET specialty = ... for reassigned facts
- **`lib/mock-data/patients.ts`**: Update mock data to match (for when `USE_SUPABASE=false`)

---

## 3. Seed data expansion

### Target: ≥25 facts per patient across all 4 specialties

The current data:

| Patient | Current facts | Pathology | Radiology | Med-onc | Nursing |
|---------|--------------|-----------|-----------|---------|---------|
| Maria | 16 | 2 | 1 | 8 (after reassignment) | 5 (after reassignment) |
| Thomas | 9 | 1 | 2 | 4 | 2 |
| Anna | 9 | 3 | 1 | 3 | 2 |

### What to add per patient

**Thomas Berger** (rectal adenocarcinoma, TNT in progress) — needs +16 facts:
- Pathology: microsatellite status, KRAS/NRAS/BRAF, tumor grade, circumferential resection margin prediction
- Radiology: baseline CT chest/abdomen, PET-CT if done, MRI measurement details, EMVI status
- Med-onc: ECOG performance status, CEA trend (pre/post induction), liver/renal function, neuropathy grading, treatment response assessment, clinical trial screening
- Nursing: allergies, height/weight/BSA, social history, infusion tolerance notes

**Anna Lindqvist** (ER+ surveillance, 23 months) — needs +16 facts:
- Pathology: Oncotype DX or similar recurrence score, Ki-67, margin details, BRCA status
- Radiology: baseline post-surgical mammogram, bone density (if on AI), chest imaging
- Med-onc: adherence to tamoxifen, menopausal status (relevant for AI switch), lipid panel, bone health assessment, endocrine side effects
- Nursing: patient-reported QOL, appointment adherence, prescription refill history, contact preferences

**Maria Kowalski** — needs +9 facts to reach 25:
- Pathology: Ki-67, tumor size on core, LVI status
- Radiology: baseline CT staging, PET if done
- Med-onc: ECOG, height/weight/BSA, comorbidities
- Nursing: allergies, social history

### Additional review items (PRs)

Add 2-3 more PRs per patient to exercise all statuses:
- Thomas: a `needs-review` PR for neuropathy assessment post-FOLFOX, a `declined` PR for a superseded lab value
- Anna: a `needs-review` PR for overdue mammogram scheduling, an `open` PR for tamoxifen adherence note
- Maria: an `open` PR for mid-treatment MRI results (pending)

### Additional meetings

- Thomas: add transcript lines to the scheduled tumor board (make it `completed` with a staging discussion)
- Anna: add a surveillance check-in meeting
- Maria: add a cycle 4 follow-up meeting with neuropathy discussion

---

## 4. Neo4j graph design

### Step 1: Clear mock data

The existing Neo4j instance already has a good relationship schema (SUPERSEDES, CONTRADICTS_FACT, DERIVED_FROM, AUTHORED_BY, CONTAINS_DRUG, GUIDED_BY, etc.) but is populated with wrong patients (Linda Hoffmann et al.). Clear everything and repopulate with our 3 Supabase patients.

```cypher
MATCH (n) DETACH DELETE n
```

### Step 2: Node types

Reuse relationship types from the existing schema where they match. All nodes carry a `supabase_id` property (the UUID from Supabase) for sync.

| Label | Source table | Key properties |
|-------|-------------|----------------|
| `:Patient` | `patients` | supabase_id, slug, name, cancer_type, status |
| `:Fact` | `facts` | supabase_id, key, label, value, group, specialty, confidence |
| `:Clinician` | `clinicians` | supabase_id, name, role, specialty |
| `:ReviewItem` | `review_items` | supabase_id, title, status, opened_at |
| `:Meeting` | `meetings` | supabase_id, title, date, status |
| `:TreatmentPhase` | `treatment_phases` | supabase_id, name, type, status, regimen |
| `:TreatmentOption` | `treatment_options` | supabase_id, name, intent, short_label |
| `:GuidelineNode` | `guideline_nodes` | supabase_id, node_key, label, kind |
| `:Drug` | (extracted from regimens) | name, class |
| `:Document` | (extracted from source_* fields on facts) | source_id, label, kind, author, date |

### Step 3: Relationship types

**Core ownership:**
```
(Patient)-[:HAS_FACT]->(Fact)
(Patient)-[:ON_PLAN]->(TreatmentPhase)
(Patient)-[:HAS_OPTION]->(TreatmentOption)
```

**Provenance (where did this fact come from?):**
```
(Fact)-[:DERIVED_FROM]->(Document)
(Document)-[:AUTHORED_BY]->(Clinician)
```

**Version control (the killer feature):**
```
(Fact)-[:SUPERSEDES]->(Fact)        — new value replaces old
(Fact)-[:CONTRADICTS]->(Fact)       — two values can't both be true
```
Thomas's staging is the perfect example: `staging.clinical = "cT4a"` SUPERSEDES and CONTRADICTS `staging.clinical = "cT3"`.

**Review flow:**
```
(ReviewItem)-[:PROPOSES_CHANGE_TO]->(Fact)
(ReviewItem)-[:SOURCED_FROM]->(Document)
(ReviewItem)-[:DISCUSSED_IN]->(Meeting)
(ReviewItem)-[:AUTHORED_BY]->(Clinician)
```

**Evidence chain (connects treatment decisions to supporting facts):**
```
(TreatmentOption)-[:SUPPORTED_BY]->(Fact)    — rationaleFactIds link
(TreatmentOption)-[:GUIDED_BY]->(GuidelineNode)
(TreatmentPhase)-[:USES_DRUG]->(Drug)
```

**Care team:**
```
(Clinician)-[:TREATS {role, specialty}]->(Patient)
(Clinician)-[:ATTENDED]->(Meeting)
(Clinician)-[:RANKED {rank, confidence}]->(TreatmentOption)
```

**Guidelines:**
```
(Fact)-[:MAPS_TO]->(GuidelineNode)           — where this patient sits on the pathway
(GuidelineNode)-[:LEADS_TO]->(GuidelineNode) — pathway edges
```

### Step 4: Sync strategy

**Direction:** Supabase → Neo4j (one-way sync). Supabase is the source of truth for data; Neo4j is the relationship index.

**When to sync:**
- On sign-off: after facts are updated in Supabase, push new/updated Fact nodes and edges to Neo4j
- On seed: bulk sync script reads all Supabase tables, creates nodes and edges in Neo4j

**Implementation:**
- `lib/neo4j/client.ts` — Neo4j driver singleton
- `lib/neo4j/sync.ts` — functions to sync entities: `syncPatient(id)`, `syncFact(id)`, `syncReviewItem(id)`
- `app/api/neo4j/sync/route.ts` — manual trigger endpoint for full resync
- Hook into sign-off route: after Supabase writes succeed, fire Neo4j sync

---

## 5. Review system hardening

### 5a. Transaction safety (sign-off route)

**Problem:** The current sign-off route does 3-5 sequential DB calls with no atomicity. A failure after updating facts but before creating the commit leaves orphaned changes.

**Fix:** Wrap the entire sign-off in a Supabase RPC (Postgres function) that runs in a single transaction:

```sql
CREATE FUNCTION sign_off_review_item(
  p_review_item_id UUID,
  p_now TIMESTAMPTZ
) RETURNS JSON AS $$
DECLARE
  -- single transaction: update facts, insert history, create commit, update status
END;
$$ LANGUAGE plpgsql;
```

The API route calls `db.rpc('sign_off_review_item', { ... })` — one call, all-or-nothing.

### 5b. Audit trail

**Problem:** `signed_off_by`, `merged_by`, `declined_by` fields exist in the schema but are never populated.

**Fix:** For now (no auth), use a hardcoded clinician ID or accept a `clinicianId` parameter in the API request. The fields should be populated even if the value is a default. When auth is added later, this becomes the logged-in user's ID.

- Sign-off route: set `merged_by` and `record_commits.signed_off_by`
- Decline route: set `declined_by`

### 5c. ConflictCallout integration

**Problem:** `components/prs/conflict-callout.tsx` exists with detailed side-by-side conflict display but is never imported or rendered.

**Fix:** Import and render ConflictCallout on the PR detail page (`[prId]/page.tsx`) when `pr.conflicts.length > 0`, above the issues list. The detailed view supplements the issue rows — it shows severity, before/after, and rationale in a prominent callout.

### 5d. Amendment workflow

**Problem:** `is_amendment` and `amends_commit_id` fields exist on `review_items` and `record_commits` but have zero implementation.

**Phase 1 (this sprint):** Add a "Re-submit as amendment" button on declined PRs. When clicked:
- Creates a new `review_item` with `is_amendment = true` and `amends_commit_id` pointing to the original
- Copies the original's deltas into new `review_deltas`
- Opens the new PR in the detail view for editing before submission

**Phase 2 (later):** Amendment chain visualization — show the history of original → amendment 1 → amendment 2.

### 5e. Question answer handlers

**Problem:** Agent questions render option buttons in the inbox but they have no `onClick` handlers.

**Fix:**
- Create `app/api/review/answer-question/route.ts` — POST endpoint accepting `{ questionId, answer }`
- Updates `agent_questions` row: `answered = true`, `answered_at = now()`, stores the selected option
- Wire up the buttons in the inbox QuestionRow component

### 5f. Decorative checkboxes

**Problem:** Checkboxes in inbox PR rows and question rows are rendered but non-functional.

**Fix (this sprint):** Remove the checkboxes. They set a UX expectation (bulk actions) that we're not implementing. If bulk sign-off is needed later, add it then with real functionality.

---

## 6. Chat agent graph traversal

### New tool: `traverse_graph`

Add to `lib/chat/tools.ts`:

```typescript
{
  type: "function",
  name: "traverse_graph",
  description: "Traverse the patient knowledge graph to find related entities. Start from a fact, PR, meeting, clinician, or treatment option and explore connections: what supersedes it, what contradicts it, what depends on it, who authored it, what meeting discussed it.",
  parameters: {
    type: "object",
    properties: {
      start_node: {
        type: "string",
        description: "The key or ID of the starting node (e.g., 'staging.clinical', a PR ID, a clinician name)"
      },
      node_type: {
        type: "string",
        enum: ["fact", "review_item", "meeting", "clinician", "treatment_option", "drug"],
        description: "The type of the starting node"
      },
      direction: {
        type: "string",
        enum: ["outgoing", "incoming", "both"],
        description: "Which direction to traverse. Default: both"
      },
      max_depth: {
        type: "integer",
        description: "How many hops to traverse. Default: 2, max: 4"
      }
    },
    required: ["start_node", "node_type"]
  }
}
```

### Implementation

- `lib/neo4j/client.ts` — driver singleton using env vars (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`)
- `lib/neo4j/traverse.ts` — executes Cypher queries based on tool parameters, returns structured neighborhood
- Tool executor in `lib/chat/tools.ts` — calls traverse function, formats results for the LLM

### Example queries the agent can now answer

| User question | Graph traversal |
|---|---|
| "What depends on Thomas's staging?" | `MATCH (f:Fact {key:'staging.clinical'})<-[:PROPOSES_CHANGE_TO]-(pr) MATCH (f)<-[:SUPPORTED_BY]-(opt) RETURN ...` |
| "Trace the evidence for TCHP" | `MATCH (opt:TreatmentOption {name:'Standard of care'})<-[:SUPPORTED_BY]-(f)-[:DERIVED_FROM]->(doc)-[:AUTHORED_BY]->(c) RETURN ...` |
| "Who has contributed to Maria's care?" | `MATCH (p:Patient {slug:'maria-k'})<-[:TREATS]-(c:Clinician) RETURN ...` |
| "What changed since the tumor board?" | `MATCH (m:Meeting)-[:DISCUSSED_IN]-(pr)-[:PROPOSES_CHANGE_TO]->(f) WHERE m.date > ... RETURN ...` |
| "Show me all conflicts in the system" | `MATCH (a:Fact)-[:CONTRADICTS]->(b:Fact) RETURN ...` |

---

## 7. FactsGraph upgrade

### Current state

`components/vault/facts-graph.tsx` builds a simple tree in-browser: Patient → Group → Fact → Source. Uses NVL but no Neo4j connection.

### Target state

Replace the in-browser graph building with a Neo4j query that returns the real relationship graph:

```cypher
MATCH (p:Patient {slug: $slug})-[:HAS_FACT]->(f:Fact)
OPTIONAL MATCH (f)-[:DERIVED_FROM]->(doc:Document)
OPTIONAL MATCH (f)-[:SUPERSEDES]->(old:Fact)
OPTIONAL MATCH (f)-[:CONTRADICTS]->(conflict:Fact)
OPTIONAL MATCH (f)<-[:PROPOSES_CHANGE_TO]-(pr:ReviewItem)
OPTIONAL MATCH (f)<-[:SUPPORTED_BY]-(opt:TreatmentOption)
RETURN f, doc, old, conflict, pr, opt
```

### New edge types visible in the graph

| Edge | Visual | What it shows |
|------|--------|---------------|
| `DERIVED_FROM` | Fact → Document | Where the fact came from |
| `SUPERSEDES` | Fact → OldFact | Version history (old fact dimmed) |
| `CONTRADICTS` | Fact ↔ Fact | Red dashed edge — active conflict |
| `PROPOSES_CHANGE_TO` | PR → Fact | Pending changes (PR node in amber) |
| `SUPPORTED_BY` | Option → Fact | Evidence links (option node in violet) |

### Implementation

- `lib/neo4j/graph.ts` — `getPatientGraph(slug)` function returns nodes + edges for NVL
- `app/api/graph/[slug]/route.ts` — API route to fetch graph data (client component can't call Neo4j directly)
- `components/vault/facts-graph.tsx` — fetch from API route instead of building in-browser
- Node click → navigate to the entity (fact → provenance popover, PR → PR detail, option → board view)

---

## 8. Execution plan — parallelizable work streams

### Stream A: Data & Schema (no UI changes)

Independent. Can run first or in parallel with B.

| Step | Task | Files | Depends on |
|------|------|-------|------------|
| A1 | Write `003_normalize_specialties.sql` — UPDATE facts to reassign specialties + CREATE attachments table (for future ingestion pipeline) | `supabase/migrations/003_normalize.sql` | — |
| A2 | Write `004_expand_seed.sql` — INSERT new facts, PRs, meetings for all 3 patients | `supabase/migrations/004_expand_seed.sql` | A1 |
| A3 | Narrow `Specialty` type to 4 values, update specialist-tree folders | `lib/types.ts`, `components/vault/specialist-tree.tsx` | A1 |
| A4 | Update mock data to match new specialties and expanded facts | `lib/mock-data/patients.ts`, `lib/mock-data/prs.ts`, `lib/mock-data/meetings.ts` | A2, A3 |

### Stream B: Neo4j Setup (backend only)

Independent of A except needs the expanded data for best results. Can start the driver/schema work immediately.

| Step | Task | Files | Depends on |
|------|------|-------|------------|
| B1 | Create `lib/neo4j/client.ts` — driver singleton | `lib/neo4j/client.ts` | — |
| B2 | Clear Neo4j: `MATCH (n) DETACH DELETE n` | Script or API route | B1 |
| B3 | Create `lib/neo4j/sync.ts` — bulk sync from Supabase | `lib/neo4j/sync.ts` | B1 |
| B4 | Create `app/api/neo4j/sync/route.ts` — trigger endpoint | `app/api/neo4j/sync/route.ts` | B3 |
| B5 | Run full sync (after A2 seed data is in Supabase) | — | B4, A2 |

### Stream C: Review System Fixes (API + UI)

Independent of A and B. Can run fully in parallel.

| Step | Task | Files | Depends on |
|------|------|-------|------------|
| C1 | Write `005_sign_off_rpc.sql` — Postgres function for atomic sign-off | `supabase/migrations/005_sign_off_rpc.sql` | — |
| C2 | Refactor sign-off route to use RPC, populate `merged_by` and `signed_off_by` | `app/api/review/sign-off/route.ts` | C1 |
| C3 | Update decline route to populate `declined_by` | `app/api/review/decline/route.ts` | — |
| C4 | Render ConflictCallout on PR detail page | `app/patients/[id]/prs/[prId]/page.tsx` | — |
| C5 | Create answer-question API route | `app/api/review/answer-question/route.ts` | — |
| C6 | Wire up question option buttons in inbox | `app/patients/[id]/inbox/page.tsx` | C5 |
| C7 | Remove decorative checkboxes from inbox | `app/patients/[id]/inbox/page.tsx` | — |

### Stream D: Graph Traversal for Chat (depends on B)

| Step | Task | Files | Depends on |
|------|------|-------|------------|
| D1 | Create `lib/neo4j/traverse.ts` — Cypher query builder | `lib/neo4j/traverse.ts` | B1 |
| D2 | Add `traverse_graph` tool definition and executor | `lib/chat/tools.ts` | D1 |
| D3 | Update chat context to mention graph traversal capability | `lib/chat/context.ts` | D2 |

### Stream E: FactsGraph Upgrade (depends on B)

| Step | Task | Files | Depends on |
|------|------|-------|------------|
| E1 | Create `lib/neo4j/graph.ts` — patient graph query | `lib/neo4j/graph.ts` | B1 |
| E2 | Create `app/api/graph/[slug]/route.ts` — API endpoint | `app/api/graph/[slug]/route.ts` | E1 |
| E3 | Rewrite `components/vault/facts-graph.tsx` to use API data | `components/vault/facts-graph.tsx` | E2 |
| E4 | Add node click navigation | `components/vault/facts-graph.tsx` | E3 |

### Parallelism diagram

```
Time →

Stream A: [A1] → [A2] → [A3, A4]
Stream B: [B1] → [B2, B3] → [B4] → [B5 waits for A2]
Stream C: [C1, C3, C4, C5, C7] → [C2, C6]     ← all independent, max parallel
Stream D:                          [D1] → [D2] → [D3]  ← after B1
Stream E:                          [E1] → [E2] → [E3] → [E4]  ← after B1
```

Streams A, B, C can all start simultaneously. D and E start as soon as B1 (Neo4j client) is done.

### Agent assignment (for parallel execution)

| Agent | Stream | Why isolated |
|-------|--------|-------------|
| Agent 1 | **A** (Data & Schema) | Pure SQL + type changes. No overlap with other streams. |
| Agent 2 | **B** (Neo4j Setup) | New files only (`lib/neo4j/*`, one API route). No conflict with existing code. |
| Agent 3 | **C** (Review Fixes) | Touches API routes and PR components. Isolated from graph work. |
| Agent 4 | **D + E** (Graph Traversal + FactsGraph) | Both depend on B1. Can start after Agent 2 finishes the client. Touches `lib/chat/tools.ts` and `facts-graph.tsx`. |

---

## 9. Document ingestion pipeline — handoff notes for colleague

### The flow

Files (PDFs, images, lab tables, reports) are dropped into the app per specialty, parsed by an LLM, and the extracted data lands in Supabase → Neo4j automatically.

The end-to-end pipeline:

```
Upload file → Classify by specialty → Store attachment row → Parse/extract → Create review item → Sign-off → Facts in Supabase → POST /api/neo4j/sync → Graph updated
```

Steps 5-8 are **done**. Steps 1-4 are partially done (upload + classify work; parsing is what the colleague builds).

### What is already done

- **`attachments` table** — DONE, see migration 003. Schema includes `patient_id`, `specialty`, `kind`, `name`, `storage_path`, `size_kb`, `mime_type`, `parsed`, `review_item_id`, `uploaded_by`, `uploaded_at`.
- **40 seed attachments** — DONE, see migration 006. All 3 patients (Maria, Thomas, Anna) have seed files across specialties.
- **`lib/data.ts`** — `buildPatient()` now queries attachments from Supabase and includes them in the patient object.
- **Specialist folder file display** — DONE. Each specialty folder shows files from the `attachments` table.
- **`POST /api/upload`** — DONE. Persists attachment metadata to Supabase.
- **Neo4j sync pipeline** — DONE. `lib/neo4j/sync.ts` populates the graph from Supabase. `POST /api/neo4j/sync` triggers a full sync (clears and rebuilds).
- **Review sign-off** — DONE. Atomic sign-off via Postgres RPC (migration 005). `POST /api/review/sign-off` handles approval → fact persistence in a single transaction.
- **Answer-question API** — DONE. `POST /api/review/answer-question` handles agent question responses.
- **Chat agent graph traversal** — DONE. The chat agent has a `traverse_graph` tool for Neo4j queries.
- **Trace logging** — Full trace logging writes to `.logs/` directory.
- **`source_*` fields** on the `facts` table — `source_kind`, `source_id`, `source_label`, `source_excerpt`, `source_author` already track provenance.
- **4 specialty folders** — each folder is a natural drop target for files of that type.
- **`FileCard` component** — `components/vault/file-card.tsx` renders attachment metadata in the vault.
- **Onboarding flow** — `/patients/new` creates patients with name, MRN, cancer type + file drop with automatic specialty classification.

### Getting started (for colleague)

#### 1. Creating a new patient

Use the onboarding flow at `/patients/new`. Enter name, MRN, and cancer type. Drop files — the system classifies them by specialty automatically. This creates the patient in Supabase and attachment rows for any uploaded files.

#### 2. Data management options

| Goal | How |
|------|-----|
| **Fresh start** (wipe everything) | Run `TRUNCATE patients CASCADE;` in Supabase SQL Editor. This clears all patients, facts, attachments, review items, meetings, etc. Then re-run migrations 002 + 004 if you want seed data back. |
| **Keep existing + add new** | Just create a new patient via onboarding. Existing Maria/Thomas/Anna stay untouched. |
| **Remove a specific patient** | `DELETE FROM patients WHERE slug = 'patient-slug';` — CASCADE handles cleanup of facts, attachments, review items, etc. |

#### 3. What you need to build

The **parser** is the missing piece. Files can already be uploaded and stored as `attachments` rows. You need to build the extraction layer that turns file content into structured facts.

| Component | Path | What it does |
|-----------|------|--------------|
| **Parser** | `lib/ingest/parser.ts` | LLM-based extraction: send file text + patient context → structured facts matching our schema (`key`, `label`, `value`, `group`, `confidence`). Different prompts per `source_kind`. |
| **Ingest API** | `app/api/ingest/route.ts` | POST endpoint: accepts `attachmentId`, runs the parser, creates a `review_item` + `review_deltas` (proposed fact changes). If a fact already exists, the delta shows before/after. If it is new, before is null. |
| **Storage bucket** (optional) | Supabase Storage setup | For raw file storage. You can start with just metadata in the `attachments` table and add blob storage later. |

#### 4. Parser strategy per file type

| File type | Parse approach | Output |
|-----------|---------------|--------|
| **PDF report** (pathology, radiology) | OCR if needed → LLM extraction with structured output schema | Array of `{key, label, value, confidence}` |
| **Lab table** (CSV, Excel) | Structured parsing → map columns to fact keys | One fact per lab value (e.g., `lab.cbc`, `lab.cea`) |
| **Image** (IHC stain, mammogram, MRI) | Store as attachment only — no automatic fact extraction. Clinician annotates manually or LLM describes. | Attachment metadata only, unless vision model extracts findings |
| **Clinical note** (text/dictation) | LLM extraction with patient context | Facts + potential PR for treatment changes |

#### 5. How parsing connects to the existing review + graph pipeline

After you build the parser, the data flows through infrastructure that already works:

1. **Parse** — `lib/ingest/parser.ts` extracts structured facts from the file
2. **Create review item** — `app/api/ingest/route.ts` writes `review_items` + `review_deltas` to Supabase
3. **Conflict detection** — if a parsed value contradicts an existing high-confidence fact, create a `review_conflict`. The conflict blocking flow already handles this.
4. **Clinician reviews** — the review item appears in the patient inbox for sign-off or decline
5. **Sign-off** — `POST /api/review/sign-off` atomically approves the deltas → facts are persisted in Supabase
6. **Graph sync** — call `POST /api/neo4j/sync` to rebuild the Neo4j graph from Supabase

Every fact in the graph traces back to its source document via `DERIVED_FROM` edges. When sync runs, `:Document` nodes are created from attachment metadata, and `(Fact)-[:DERIVED_FROM]->(Document)` edges link facts to the files they came from.

#### 6. Available API endpoints

| Endpoint | Method | What it does |
|----------|--------|--------------|
| `/api/neo4j/sync` | POST | Full Supabase → Neo4j sync (clears and rebuilds the graph) |
| `/api/upload` | POST | Persist attachment metadata to Supabase |
| `/api/review/sign-off` | POST | Atomic sign-off via Postgres RPC — approves deltas, persists facts |
| `/api/review/answer-question` | POST | Answer agent questions on review items |
| `/api/chat` | POST | Chat with the graph traversal agent |

---

## 10. Files created or modified (full manifest)

### New files
- `lib/neo4j/client.ts` — Neo4j driver singleton
- `lib/neo4j/sync.ts` — Supabase → Neo4j sync
- `lib/neo4j/traverse.ts` — Cypher query builder for chat tool
- `lib/neo4j/graph.ts` — patient graph query for FactsGraph
- `app/api/neo4j/sync/route.ts` — manual sync trigger
- `app/api/graph/[slug]/route.ts` — graph data endpoint
- `app/api/review/answer-question/route.ts` — question answering
- `supabase/migrations/003_normalize.sql` — specialty reassignment + attachments table
- `supabase/migrations/004_expand_seed.sql` — expanded seed data
- `supabase/migrations/005_sign_off_rpc.sql` — atomic sign-off function

### Modified files
- `lib/types.ts` — narrow Specialty type
- `lib/chat/tools.ts` — add traverse_graph tool
- `lib/chat/context.ts` — mention graph capability in system prompt
- `components/vault/specialist-tree.tsx` — remove extra folders
- `components/vault/facts-graph.tsx` — rewrite to use Neo4j data
- `app/api/review/sign-off/route.ts` — use RPC, populate audit fields
- `app/api/review/decline/route.ts` — populate declined_by
- `app/patients/[id]/prs/[prId]/page.tsx` — render ConflictCallout
- `app/patients/[id]/inbox/page.tsx` — wire question buttons, remove checkboxes
- `lib/mock-data/patients.ts` — match new specialties
- `lib/mock-data/prs.ts` — additional PRs
- `lib/mock-data/meetings.ts` — additional meetings
