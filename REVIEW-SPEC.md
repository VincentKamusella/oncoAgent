# Review System — Spec

How specialists propose, review, and merge changes to a patient record. The version-control model applied to cancer care.

---

## 1. The concept

Every patient record is a versioned document. Nobody edits it directly. Instead:

1. **A specialist or data source proposes a change** — this creates a Review item
2. **The system runs conflict checks** — flags contradictions, missing data, temporal issues
3. **The responsible clinician reviews** — sees the diff, resolves conflicts, signs off or rejects
4. **The change merges** — the patient record updates, a commit is logged, the audit trail grows

This is the same model as GitHub pull requests, but the "code" is structured clinical data and the "reviewers" are oncologists.

---

## 2. Vocabulary

We avoid Git jargon in the UI. The mapping:

| Internal / Git term | UI-facing term | Why |
|---|---|---|
| Pull request | **Review item** | Clinicians understand "this needs your review" |
| Merge | **Sign off** | Clinical sign-off is the established action |
| Close / reject | **Decline** | Clear intent without Git baggage |
| Conflict | **Conflict** | Same word, same meaning — keep it |
| Revert | **Amend** | Medical records use "amendment" for corrections |
| Commit | **Record update** | What actually happened to the patient file |
| Diff | **Changes** | Self-explanatory |
| Branch | N/A | Not used — single main record per patient |

The tab is called **Review**. The section shows items that need attention.

---

## 3. Who creates review items

### Automatic (system-generated)
- **Lab feeds** — Quest, hospital LIS push results → system creates a review item with the new lab values
- **Imaging feeds** — PACS/radiology reports arrive → review item with findings and proposed status changes
- **Pharmacy feeds** — e-Prescriptions via Surescripts → review item with new medication
- **Pathology feeds** — biopsy results → review item with histology, receptor status, staging implications

### Manual (specialist-initiated)
- **Specialist submits a change** — a radiologist re-reads a scan and wants to update findings
- **Oncologist proposes treatment change** — new regimen, dose adjustment, phase transition
- **Agent drafts a change** — the AI notices a pattern and proposes an update (e.g., "disease status should change to equivocal based on recent imaging + rising markers")

Each review item tracks its `author` (name + role + specialty) and `source` (where the data came from).

---

## 4. What a review item contains

```
Review Item
├── metadata (id, title, status, author, openedAt, priority)
├── proposed changes
│   ├── adds[] — new facts being introduced
│   └── modifies[] — existing facts being changed (before → after)
├── agent checks[]
│   ├── severity (block / warn / info)
│   ├── message + evidence
│   └── proposed resolutions[]
└── review state
    ├── reviewers[] — who needs to sign off
    ├── resolutions{} — which checks have been resolved and how
    └── status (open / needs-review / conflict / signed-off / declined)
```

### Status lifecycle

```
open → needs-review → signed-off
                    → declined
     → conflict     → (resolve conflicts) → needs-review → ...
```

- **open** — just created, agent checks running
- **needs-review** — checks complete, no unresolved blockers, ready for clinician
- **conflict** — has unresolved blocking checks
- **signed-off** — clinician approved, changes applied to record
- **declined** — clinician rejected, no changes applied

---

## 5. Conflict detection

The agent runs checks against every review item. Three types:

### (a) Internal coherence
Does the proposed change contradict another current fact?

**Examples:**
- PR adds tamoxifen → but patient is on anastrozole (concurrent endocrine therapy conflict)
- PR sets stage to IIA → but recent imaging shows metastatic lesion (staging inconsistency)
- PR adds a drug the patient has a documented allergy to

### (b) Temporal coherence
Does the proposed change's timing make sense against the record?

**Examples:**
- PR adds a chemo cycle dated after the treatment phase end date
- PR references a lab value from before the patient's case was opened
- Follow-up scheduled during a treatment phase that hasn't started yet

### (c) Missing data
Does this change depend on data that doesn't exist in the record?

**Examples:**
- Imaging report says "compared to prior" but no prior imaging of that modality exists
- Treatment plan references a genomic marker that hasn't been tested
- Medication dose assumes a recent weight/BSA that isn't on file

### Severity levels

| Severity | Meaning | Blocks sign-off? |
|---|---|---|
| **block** | Cannot proceed without resolution | Yes — sign-off button disabled |
| **warn** | Clinician should be aware | No — shown but doesn't block |
| **info** | Informational context | No — collapsible, low priority |

### Resolution options

Each blocking check can offer resolution options:
- **Accept the agent's recommendation** — e.g., "Update disease status to equivocal"
- **Override with note** — clinician provides a reason to proceed despite conflict
- **Reject the review item** — the proposed change is wrong (e.g., transcription error)
- **Defer** — "not resolving now, pending more data" (leaves check unresolved)

---

## 6. Multi-specialist review

Some changes need sign-off from more than one specialist.

### Scope-based authority

Each fact belongs to a specialty (pathology, radiology, med-onc, etc.). The system assigns reviewers based on which facts are being changed:

| Change type | Required reviewer(s) |
|---|---|
| Imaging findings | Radiologist + treating oncologist |
| Pathology results | Pathologist + treating oncologist |
| Medication change | Prescribing clinician + pharmacy |
| Staging update | Treating oncologist (sole authority) |
| Treatment plan change | Treating oncologist + relevant specialist |
| Lab results (routine, normal range) | Auto-sign-off (no review needed) |
| Lab results (abnormal or clinically significant) | Treating oncologist |

### Sign-off states

```
Review item with 2 required reviewers:
  ☐ Dr. Okonkwo (med-onc) — pending
  ☐ Dr. Park (radiology) — pending
  
After radiologist signs:
  ☐ Dr. Okonkwo (med-onc) — pending
  ☑ Dr. Park (radiology) — signed off Apr 25

After oncologist signs:
  ☑ Dr. Okonkwo (med-onc) — signed off Apr 25
  ☑ Dr. Park (radiology) — signed off Apr 25
  → Changes merged into record
```

### For the hackathon

Simplify to single-reviewer: the logged-in clinician (Dr. Okonkwo) is always the reviewer. Multi-reviewer is a data model consideration for production.

---

## 7. Version history & amendments

### Commit log

Every signed-off review item becomes a **record update** (commit) on the patient's timeline:

```
Record Updates (most recent first)
─────────────────────────────────
Apr 25, 2026  Disease status → equivocal
              Signed off by Dr. Okonkwo
              Source: Surveillance CT (Bay Imaging Center)
              Review: #pr-2026-04-11-surv-ct

Apr 14, 2026  Added CEA 6.8, CA 15-3 52
              Signed off by Dr. Okonkwo
              Source: Quest Diagnostics
              Review: #pr-2026-04-14-tumor-markers

Feb 10, 2026  CEA 2.1 (routine surveillance)
              Auto-merged (normal range)
              Source: Quest Diagnostics
```

Each commit stores:
- The full diff (what changed, before/after)
- Who signed off
- When
- Which review item it came from
- The source of the data

### Snapshots

After each merge, the system stores a snapshot of the full patient record state. This enables:
- **Point-in-time view** — "show me this patient's record as of March 1"
- **Diff between dates** — "what changed between the last two tumor boards?"
- **Audit trail** — regulatory requirement for medical records

### Amendments (reverts)

To undo a previous change, the clinician creates an **amendment** — which is itself a new review item:

```
Amendment: Revert disease status change from Apr 25
─────────────────────────────────────────────────────
Reverting review #pr-2026-04-11-surv-ct

Changes:
  diagnosis.diseaseStatus: equivocal → NED
  
Reason: Liver biopsy came back benign. Lesion confirmed as
        hemangioma, not metastasis. Restoring NED status.

Author: Dr. Okonkwo
```

Key principle: **amendments go through the same review flow as any other change.** You can't silently roll back a medical record. The amendment is reviewed, signed off, and logged — creating a full audit trail of the correction.

### Blame

For any fact in the vault, you can trace:
- Which review item set it to its current value
- Who signed off
- What the source was
- What the previous value was
- When it changed

This is critical for clinical accountability and regulatory compliance.

---

## 8. Auto-merge rules

Not everything needs manual review. Low-risk, routine data can auto-merge:

| Data type | Condition | Action |
|---|---|---|
| Lab results | Within normal range, routine panel | Auto-merge, log as info |
| Lab results | Outside normal range OR trending | Open for review with warn/block |
| Vitals | Standard visit vitals | Auto-merge |
| Appointment notes | Routine visit note | Auto-merge, notify |
| Imaging | Any new imaging | Always open for review |
| Medication | Any change | Always open for review |
| Pathology | Any result | Always open for review |
| Staging | Any change | Always open for review (block severity) |

Auto-merged items still appear in the commit log — they just skip the review step. The clinician can always retrospectively amend an auto-merged change.

---

## 9. Pattern detection (cross-review intelligence)

After each sign-off, the agent runs a cross-review pattern check:

**Current patterns detected:**
- Rising tumor markers + suspicious imaging = recurrence suspicion → propose tumor board case
- Multiple declined reviews from same source = possible data quality issue → flag
- Staging change + no treatment plan update = potential gap → warn

**Future patterns:**
- Drug interaction across reviews merged on different dates
- Guideline deviation (treatment doesn't match recommended pathway)
- Missing follow-up (imaging overdue based on protocol)

Pattern detection output is an **agent issue** that appears in the Review tab alongside regular review items, but tagged differently:

```
🤖 Agent observation — Recurrence suspicion pattern
   Rising CEA + CA 15-3 combined with equivocal CT findings
   suggest recurrence workup. Recommend opening tumor board case.
   [Open board case] [Dismiss]
```

---

## 10. Data model additions

### New fields on existing types

```typescript
// On PullRequest (renamed to ReviewItem in UI)
resolvedChecks: Record<string, string>;  // checkId → resolutionId
requiredReviewers: string[];             // specialist IDs who must sign off
signOffs: SignOff[];                     // who has signed off so far
mergedBy?: string;                       // who performed final sign-off
mergedAt?: string;
declinedBy?: string;
declinedAt?: string;
declineReason?: string;

// New type
type SignOff = {
  reviewerId: string;
  reviewerName: string;
  specialty: Specialty;
  at: string;
  note?: string;
};

// New type for version history
type RecordCommit = {
  id: string;
  patientId: string;
  reviewItemId: string;        // which review item this came from
  at: string;
  signedOffBy: string;
  changes: FactDelta[];        // what changed
  snapshotId?: string;         // reference to full record snapshot
  isAmendment: boolean;        // true if this reverts a previous commit
  amendsCommitId?: string;     // which commit this amends
};

// New type for snapshots
type RecordSnapshot = {
  id: string;
  patientId: string;
  commitId: string;            // the commit that produced this snapshot
  at: string;
  facts: Fact[];               // full fact state at this point
  plan: TreatmentPhase[];      // full plan state
};
```

---

## 11. UI layout (Review tab)

```
┌─────────────────────────────────────────────────────┐
│  Review                                    3 open   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ⚠ NEEDS ATTENTION (1)                              │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🔴 New prescription — tamoxifen 20mg          │  │
│  │    1 blocking check · Surescripts · Today     │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  READY FOR REVIEW (2)                               │
│  ┌───────────────────────────────────────────────┐  │
│  │ Surveillance CT C/A/P — Apr 11                │  │
│  │    1 warn · Bay Imaging · 14 days ago         │  │
│  ├───────────────────────────────────────────────┤  │
│  │ Tumor markers — CEA + CA 15-3                 │  │
│  │    2 info · Quest · 11 days ago               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  🤖 AGENT OBSERVATIONS (1)                          │
│  ┌───────────────────────────────────────────────┐  │
│  │ Recurrence suspicion pattern detected         │  │
│  │    [Open board case]  [Dismiss]               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  RECENTLY SIGNED OFF (2)                            │
│  ┌───────────────────────────────────────────────┐  │
│  │ ✓ HER2 FISH results — Apr 8                   │  │
│  │ ✓ Routine CBC — Apr 5                          │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 12. Integration with existing modules

| Module | How it connects to Review |
|---|---|
| **Vault** | Facts are the target of review items. Signing off updates facts. Each fact links back to its source review item. |
| **Board** | Pattern detection can propose opening a board case. Board decisions can generate new review items (e.g., "team decided to switch to regimen X"). |
| **Agent chat** | Chat can query review items via tools. Chat knows which review items are open when providing context. |
| **Timeline** | Signed-off review items appear as commits on the patient timeline. |
| **Guidelines** | Agent checks can reference guideline pathways to flag deviations. |

---

## 13. Build priority

### Phase 1 — Core review flow (hackathon)
- Review item list with status grouping
- Detail view with diff + agent checks + sign-off/decline
- Sign-off applies changes to patient record
- 3 demo review items (medication conflict, imaging status change, clean merge)

### Phase 2 — Version history
- Commit log showing signed-off changes over time
- Point-in-time view of patient record
- Amendment flow (revert as new review item)

### Phase 3 — Multi-reviewer & auto-merge
- Scope-based reviewer assignment
- Multi-sign-off gating
- Auto-merge rules for routine data
- Pattern detection after merge

### Phase 4 — Real data sources
- Supabase persistence
- Webhook receivers for lab/imaging/pharmacy feeds
- Real-time notifications when new review items arrive
