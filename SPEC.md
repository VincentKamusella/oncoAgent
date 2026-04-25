# Cliniarc — Agentic Tumor Board

**An IDE for cancer care.** Patients are files. Medical events are commits. New data arrives as pull requests. Conflicts block merges. The tumor board is where the team reviews and signs off.

This document is the build spec for the hackathon. It supersedes the earlier "digital health companion" framing.

---

## 1. The pitch (30 seconds)

> Cancer patients accumulate years of fragmented data across ten-plus specialists. Today, tumor boards spend half their meeting reconstructing the case before they can discuss it.
>
> Cliniarc is an IDE for cancer care. Each patient is a versioned record. New data — a path report, a scan, a med change — arrives as a pull request. Our agent checks it for conflicts against the rest of the record and against treatment guidelines, surfaces what needs human review, and assembles the case for tumor board automatically. The board reviews, signs the recommendation, and that decision becomes the next commit on the record.

The differentiation: *we treat the patient record like source code, with version control, conflict detection, and review semantics.*

---

## 2. Core concepts (the IDE metaphor)

| IDE concept            | Cliniarc concept                                                                                   |
|------------------------|----------------------------------------------------------------------------------------------------|
| Repository             | A patient                                                                                          |
| Files / folders        | Resource categories: diagnosis, medications, observations, imaging, encounters, biomarkers         |
| Commit                 | A signed change to the record (e.g. "stage upgraded to IV by Dr. Okonkwo on Apr 26")               |
| Branch                 | Optional. We don't need branches for the demo; main only.                                          |
| Pull request           | A proposed change packaged from a new data source (path report, lab, scan, agent draft)            |
| Reviewer               | The clinician(s) responsible for the affected resource(s)                                          |
| CI / checks            | Agent-run conflict checks (internal coherence, guideline check, missing-data check)                |
| Merge conflict         | An incompatibility the agent can't auto-resolve (covered in §5)                                    |
| Issue                  | An agent-raised question the responsible clinician needs to answer                                 |
| Tag / release          | A signed tumor-board recommendation                                                                |

The metaphor is the entire UX. Use it consistently in copy, button labels, and visual language.

---

## 3. Demo storyline (3-minute version)

We use Maya Alvarez (existing seed). Run order:

1. **Open the workspace.** Left sidebar shows the patient roster — Maya is highlighted because she has 3 open PRs and a tumor board in 8 minutes.
2. **Click Maya.** Patient overview loads: timeline of past commits, current state of each "file" (diagnosis, meds, observations…), and an inbox of 3 open PRs at the top.
3. **Open `pr-2026-04-25-tamoxifen` first.** This is the safety-catch moment. e-Prescription for tamoxifen 20mg has come in from Surescripts. The agent blocks the merge: *"Patient is currently on anastrozole — these two are not used concurrently. Likely transcription error."* Three resolution options offered: switch agents, reject, or override with a clinician note. Demo move: leave it open and say "we'll come back to this — but notice it caught a real prescribing risk." This is the agent moment that sticks.
4. **Open `pr-2026-04-11-surv-ct`.** Surveillance CT just came back. Diff shows the new imaging study + report, and a proposed update of `disease status` from NED → equivocal. The agent has flagged this as a `block` because the disease status field is now stale relative to the new evidence. Click "Update diseaseStatus to equivocal" → conflict clears → merge.
5. **Open `pr-2026-04-14-tumor-markers`.** Two new lab observations (CEA + CA 15-3, both rising). No conflicts — agent flags only `info`-severity notes about the marker rise pattern. Click merge.
6. **Watch the agent surface a new issue.** With both the CT PR and tumor markers PR now merged, the pattern check runs and `iss-recurrence-pattern` appears in the inbox: *"Recurrence-suspicion pattern detected — recommend opening tumor board case."*
7. **Click the issue's "Open tumor board case" action.** The case is pre-assembled by the agent — relevant prior commits pulled in, draft question composed. Live multidisciplinary discussion (already-built view).
8. **Sign the recommendation.** It becomes the next commit on Maya's record, with all five attendees as co-authors.

Total clicks: ~10. Total demo time: ~3 min. Three PRs, three different agent behaviors:

| PR                              | Behavior demonstrated                                       |
|---------------------------------|-------------------------------------------------------------|
| `pr-2026-04-25-tamoxifen`       | Hard internal-coherence conflict (medication contradiction) |
| `pr-2026-04-11-surv-ct`         | Soft state-update conflict (stale field value)              |
| `pr-2026-04-14-tumor-markers`   | Clean merge that triggers cross-PR pattern detection        |

---

## 4. What we're building (scope)

### 4.1 In scope for the hackathon

**Workspace shell.** Three-pane IDE layout: patient roster (left), patient detail (center), context/agent panel (right).

**Patient detail view.** Replaces the previous Dashboard. Shows commit timeline + open PRs + current state of each resource category. The existing detail views (imaging, lab, phase, medication) become drill-downs from the resource files.

**PR view.** New. Diff between current record and proposed change, agent check report below.

**Conflict resolution UI.** When the agent's check finds an incompatibility, the PR shows a "needs review" banner with options to accept the agent's proposed resolution, override manually, or defer.

**Tumor board view.** Already built. Becomes the destination after the recurrence pattern is detected.

**Version control modal.** Already partially specced. Click any versioned field to see commit history. (Stage and disease status remain the two demoed versioned fields.)

### 4.2 Explicitly out of scope

- Branching, force-push, rebase. We have main only.
- Multi-patient cross-references.
- Real ingestion from PDFs / DICOM / HL7. PRs are pre-cooked from the seed JSON.
- Real authentication. Logged in as Dr. Okonkwo.
- Real notifications. Issues raised by the agent are visible in the inbox; no email.
- Patient-facing app. Mentioned in pitch only.

### 4.3 Stretch goals (build only if ahead of schedule)

- Guideline-checking against a canned NCCN snippet for breast cancer surveillance. Adds a second class of agent check.
- Agent-authored draft PRs (e.g. "Agent proposes reclassifying disease status to equivocal based on recent imaging") with human review before merge.
- Signing the tumor board recommendation actually closes the case PR and creates the commit.

---

## 5. The agent's job, precisely

The agent has three responsibilities. Each maps to a visible UI surface.

**(a) Conflict detection on every PR.** When a PR opens, the agent runs a check pass:

- *Internal coherence.* Does the proposed change contradict another current value in the record? (Example: PR adds "tamoxifen" to medications but `treatmentPhases.phase-hormone.regimen` is "anastrozole." Block merge.)
- *Temporal coherence.* Does the proposed event's date conflict with the current state? (Example: PR adds a chemo cycle dated after `phase-chemo.endDate`. Flag for review.)
- *Missing-data check.* Does this PR reference data the record needs but doesn't have? (Example: imaging PR mentions "compared to prior" but no prior of that modality exists.)

For each finding, the agent emits a structured object: `{ severity: "block" | "warn" | "info", message, proposedResolution }`. The UI renders these as a checklist below the diff.

**(b) Pattern detection across recent commits.** After every merge, the agent runs a higher-level check: are recent commits collectively suggestive of a clinical pattern that warrants escalation? For Maya's demo: rising tumor markers + new imaging finding = "recurrence-suspicion" pattern → propose tumor board case. This runs as a background job; output appears in the patient's inbox.

**(c) Case assembly for tumor board.** When a tumor board case is opened, the agent assembles the relevant prior commits, generates the case summary, drafts the question to be discussed, and pre-stages the recommendation skeleton. During the live session, it transcribes contributions and updates the consensus draft (existing tumor board view).

The agent does *not* autonomously contact clinicians. It files **issues** in the patient's inbox, tagged with `@assignee`. Clinicians see issues alongside open PRs when they enter the workspace.

---

## 6. Data model changes

The seed JSON (`maya-alvarez.json`) has been extended with two new top-level structures: `pullRequests[]` and `issues[]`. The `tumorBoard.activeSessions[0]` now also carries a backreference (`openedFromIssue`) to the issue that opened it.

**`pullRequests[]`** — three open PRs are seeded:

- `pr-2026-04-25-tamoxifen` — hard medication conflict (block, 1 check)
- `pr-2026-04-11-surv-ct` — soft status update conflict (block, 1 check; warn, 1 check)
- `pr-2026-04-14-tumor-markers` — clean merge (info, 2 checks)

Each PR has: `addsResources[]` (new resources being added — either by reference to existing seed IDs, or inline data for resources that don't exist yet), `modifiesFields[]` (in-place changes to versioned fields), `agentChecks[]` (the structured findings the UI renders), `reviewers[]` (assigned clinicians), and `checkSummary` (precomputed counts for the badge).

**`issues[]`** — one issue is seeded: `iss-recurrence-pattern`. Its `openedAt` is `null` in the seed because conceptually it doesn't exist until the agent's pattern-detection runs after the relevant PRs merge. The frontend can either pre-stage it visible (simpler demo) or gate its appearance on merge actions (richer demo). Recommend pre-staging and using a small "✨ new" indicator.

**Agent tool additions** for the layer to call against this data:

- `list_open_prs()` → all open PRs
- `get_pr(prId)` → single PR with full agentChecks
- `run_pr_checks(prId)` → recompute checks against current state
- `merge_pr(prId, resolutions?)` → applies the changes, triggers pattern detection
- `list_open_issues(assignee?)` → open issues
- `detect_patterns(sinceDate?)` → returns proposed issues based on recent commits

For the hackathon, `merge_pr` and `detect_patterns` can be hardcoded for the demoed PRs rather than implementing real diff/conflict logic. The visible behavior is what matters; the underlying engine can be a switch statement.

---

## 7. UI changes from current Cliniarc.jsx

| Component               | Status                                                                                              |
|-------------------------|-----------------------------------------------------------------------------------------------------|
| `Cliniarc` (root)       | Becomes a 3-pane layout. State machine grows: `'workspace'` view replaces `'dashboard'`.            |
| `Dashboard`             | Repurpose as the patient detail (center pane). Add an "Open PRs" card at the top above the timeline.|
| Patient roster          | New left-side component. List of patients with PR/issue badges.                                     |
| `PRDetailView`          | New. Diff + agent check list + merge button.                                                        |
| `IssueDetailView`       | New. Lighter — title, body, proposed action button.                                                 |
| `TimelineCard`          | Now renders commits, not curated events. Each timeline item is the merge of a past PR.              |
| `TimelineItem`          | Add a small commit-hash-style ID and an authoring avatar.                                           |
| `TumorBoardView`        | Mostly unchanged. Add a "Linked from issue iss-recurrence-pattern" chip in the case banner.         |
| Detail views (existing) | Unchanged. Still triggered by clicking a resource file.                                             |

The center pane gets a small tabs strip at the top: `Overview · PRs (3) · Issues (1) · Files`. Default to Overview.

---

## 8. Branding and copy

Lock the name as **Cliniarc**. Tagline: *"Version control for cancer care."*

Color: keep the violet/purple as the agent accent (already in the build). Add a single accent color for "live" / "needs attention" — we've been using red sparingly; lean into it for the live tumor board indicator and PR conflict badges.

Copy guidance:
- "Pull request" not "submission" or "update."
- "Merge" not "accept" or "save."
- "Conflict" not "warning" or "issue" (issue is reserved for agent-raised questions).
- "Sign off" only for the tumor board recommendation (it's a release tag).

---

## 9. Build order and ownership

Assumes 4 people, ~12 hours remaining (we've burned ~3).

**Phase 1 — data + skeleton (2 hrs, parallel)**
- *Med student:* extend `maya-alvarez.json` with the three demoed PRs and the recurrence-suspicion issue. Pressure-test the conflict messages for clinical realism.
- *Med-tech student:* draft the agent check definitions (the 6–8 checks the agent can run, with example outputs for each).
- *All-rounder 1:* refactor `Cliniarc.jsx` into the 3-pane layout. Move `Dashboard` content into the center pane.
- *All-rounder 2:* set up the agent endpoint stub. Implement one tool — `get_pr(prId)` — end-to-end, hardcoded response, just to prove the pipe works.

**Phase 2 — PR view + conflict UI (3 hrs)**
- *Frontend:* `PRDetailView` with diff rendering and check list.
- *Agent:* implement conflict-checking against the seed JSON for the three demoed PRs. This is hardcoded logic for the demo, not a general checker.

**Phase 3 — workspace polish + tumor board glue (3 hrs)**
- *Frontend:* patient roster, inbox of PRs/issues, commit-style timeline.
- *Agent:* pattern-detection trigger that opens the tumor board case when both the CT PR and tumor markers PR are merged.

**Phase 4 — demo prep (2 hrs)**
- Walk through the 3-minute storyline 5 times.
- Build a "demo mode" toggle that pre-stages the right PRs as open vs merged so the demo always starts from the right state.
- Backup screenshot deck in case live demo breaks.

**Phase 5 — buffer (2 hrs)**
- Stretch goals or polish.

---

## 10. Risks and how we mitigate

**The conflict-detection logic looks fake under scrutiny.** Mitigation: the three demo PRs each exercise a *different* check type (internal coherence, temporal coherence, missing data). Judges who poke see variety, not one trick.

**The IDE metaphor confuses non-technical judges.** Mitigation: the first ten seconds of the pitch frame it ("we treat the medical record like source code"). The visual language carries it from there. We don't lean on jargon — call them "pull requests" but explain "proposed change" parenthetically the first time.

**Live demo flakes.** Mitigation: demo mode toggle, screenshot deck backup, narrate confidently through any glitch.

**Out-of-scope creep on the agent.** Mitigation: the agent does three things (§5). Anything else is a stretch goal. Don't let "wouldn't it be cool if…" derail.

---

## 11. Decisions (resolved)

- **Product framing.** Cliniarc is positioned as IDE-for-cancer-care primarily. The digital companion / patient-share angle is dropped from the pitch.
- **Data source.** Starting from the existing `maya-alvarez.json` seed; team will extend with additional patients / qontext-derived data as needed.
- **Agent autonomy.** Agent files **issues** tagged with `@assignee` rather than autonomously contacting clinicians. Issues appear in the inbox alongside open PRs.
- **Conflict types demoed.** Three PRs, three different agent behaviors:
  - Hard medication conflict (tamoxifen vs anastrozole) — the safety-catch moment.
  - Soft state-update conflict (CT impression supersedes NED status) — the recurrence inciting incident.
  - Clean merge that triggers cross-PR pattern detection (rising tumor markers) — the agent doing aggregate reasoning.
- **Tumor board persona.** Dr. Mei Okonkwo (medical oncology) is the user. Dr. Sarah Chen is referring GP, backgrounded.
- **Live tumor board.** Styled snapshot, not real-time STT. UI demos identically to a real live system.
- **Versioned fields.** `diagnosis.primary.stage` and `diagnosis.primary.diseaseStatus`. Full history arrays already in the seed.
