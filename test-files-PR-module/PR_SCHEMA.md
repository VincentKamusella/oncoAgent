# PR Module — Spec

A standalone React module for **pull requests over structured data**. The mental model: instead of editing a record directly, an author (human or agent) opens a *PR* describing the change. An agent or other automation runs *checks* against the PR. The reviewer sees a diff, sees the checks, resolves anything blocking, and either merges (changes apply) or closes (changes discarded).

The module is UI + state. It does not assume what the underlying record represents. It works for any JSON-shaped object — patient records, project configs, company policies, anything where you want a review-and-merge workflow in front of mutations.

---

## At a glance

The module ships with sample data inlined (three PRs + a sample record), so this works out of the box:

```jsx
import { PRWorkspace } from './PRModule';

<PRWorkspace />
```

That gets you the same three Maya Alvarez PRs the original Cliniarc demo had: a blocking medication-conflict PR, a state-update PR with downstream impact, and a clean-merge PR with informational checks. Click in, see the diff, resolve checks, merge. The sample record state mutates as you go.

To drive it with your own data:

```jsx
import { PRWorkspace } from './PRModule';

<PRWorkspace
  initialPRs={[ /* PR objects, see schema below */ ]}
  initialRecord={{ /* the JSON object the PRs propose changes to */ }}
  recordLabel="the project config"
  reviewerName="Alex Chen"
  onMerged={({ pr, nextRecord }) => {
    // optional: persist the new record state to your backend
  }}
/>
```

List view, detail view, diff rendering, agent checks, merge/close logic, and state mutation are all wired up.

The sample data is also exported (`SAMPLE_PRS`, `SAMPLE_RECORD`) if you want to inspect it or use it as a starting template for shaping your own PRs.

---

## Concepts

### PR
A proposed change to the record. Has a status (`open` / `merged` / `closed`), a list of *adds* (new resources), a list of *modifies* (path-based field updates), and a list of *agent checks*.

### Check
A finding that an agent or automation surfaces against the PR. Has a severity:

- **`block`** — Cannot merge until resolved. The merge button stays disabled.
- **`warn`** — Surfaced for attention; doesn't prevent merging.
- **`info`** — Informational; never blocks.

A check can come with `proposedResolutions` — buttons the reviewer clicks to acknowledge or resolve. Picking the special resolution id `'reject'` short-circuits to closing the entire PR.

### Resolution
The reviewer's choice on a single check. Stored as `{ [prId]: { [checkId]: resolutionId } }`. Once a block check has any resolution, it no longer blocks the merge.

### Merge
Applies the PR's `modifiesFields` to a deep clone of the record. Sets PR status to `merged`. Emits an `onMerged` callback with the new record.

### Close
Sets PR status to `closed` without applying changes.

---

## Data shape

### PR object

```ts
type PR = {
  id: string;                          // e.g. "pr-2026-04-22-dose-reduce"
  title: string;                       // human-readable, ~6-10 words
  summary?: string;                    // 1-3 sentences, shown on detail page
  status: 'open' | 'merged' | 'closed';
  openedAt?: string;                   // ISO-8601
  openedBy?: string;                   // e.g. "user:alex" or "system:agent"
  mergedAt?: string;                   // set automatically on merge
  priority?: 'low' | 'medium' | 'high';

  // Quick-glance counts shown on the list row.
  // The module does not compute these; you supply them.
  checkSummary?: { block: number; warn: number; info: number };

  // The actual proposed changes — at least one of these should be non-empty.
  addsResources?: AddResource[];
  modifiesFields?: ModifyField[];

  // Agent findings about this PR.
  agentChecks?: AgentCheck[];

  // Free-form, used however your app wants.
  reviewers?: string[];
  labels?: string[];
};

type AddResource = {
  type: string;                        // e.g. "medication", "encounter", "envVar"
  ref?: string;                        // e.g. "med-abc123"
  data?: Record<string, any>;          // the resource payload
};

type ModifyField = {
  path: string;                        // dot-separated, e.g. "diagnosis.primary.stage"
  from: any;                           // current value (shown as "- old")
  to: any;                             // proposed value (shown as "+ new")
  rationale?: string;                  // optional explanation, shown as italic note
};

type AgentCheck = {
  id: string;                          // unique within the PR
  severity: 'block' | 'warn' | 'info';
  title: string;                       // ~5-8 words
  message: string;                     // 1-3 sentences
  evidence?: Array<{
    ref?: string;                      // resource id this evidence cites
    path?: string;                     // or a path inside the record
    text: string;                      // human-readable explanation
  }>;
  proposedResolutions?: Array<{
    id: string;                        // 'accept' | 'reject' | custom
    label: string;                     // button text
    isDefault?: boolean;               // highlighted with a star
    requires?: string;                 // shown in muted text after label
  }>;
};
```

### Path-based modifications

`modifiesFields` use a dot-separated path string into the record. Example:

```js
{
  path: "diagnosis.primary.stage.current",
  from: "IIA (pT2 pN0 M0)",
  to: "IV (recurrent disease)",
  rationale: "Liver biopsy confirmed metastatic recurrence"
}
```

`applyPRMods(record, modifiesFields)` returns a deep clone of `record` with each path written to its `to` value. Missing intermediate objects are created on the fly. Arrays-by-index are not supported (use full keys, or restructure your data).

---

## Components

The module exports six things:

| Export | What it is |
|---|---|
| `PRWorkspace` | **Default export.** Top-level "easy button". List view + detail view + state. Renders sample data if no props are passed. Use this if you want the whole thing. |
| `PRListView` | Just the list (Open / Merged / Closed sections). Render-only. |
| `PRDetailView` | Just the detail page. Render-only. |
| `CheckCard` | A single agent check. Useful if you want to compose a custom PR layout. |
| `usePRReducer` | The state hook `PRWorkspace` is built on. Drive your own UI from it. |
| `applyPRMods` | Pure function: deep-clone + apply mods. Useful server-side too. |
| `SAMPLE_PRS` | The three demo PRs (Maya Alvarez oncology workflow). Useful as templates when shaping your own PRs. |
| `SAMPLE_RECORD` | The base record the sample PRs reference. |

### PRWorkspace props

| Prop | Type | Notes |
|---|---|---|
| `initialPRs` | `PR[]` | Required. The list of PRs to manage. |
| `initialRecord` | `object` | Required. The record that PRs propose changes to. |
| `reviewerName` | `string?` | Shown in the PR detail header. Optional. |
| `recordLabel` | `string?` | Shown in the merged-confirmation banner: "Changes applied to *recordLabel*." Default: `"the record"`. |
| `onMerged` | `({ pr, nextRecord }) => void` | Fired after each successful merge. Use this to persist the new record. |

### `PRListView` props

`prs`, `onSelectPR(prId)`, `emptyMessage?`.

### `PRDetailView` props

`pr`, `resolutions`, `onResolve(prId, checkId, resolutionId)`, `onMerge(prId)`, `onClose(prId)`, `onBack?`, `reviewerName?`, `recordLabel?`.

### `usePRReducer({ initialPRs, initialRecord })`

Returns:

```js
{
  prs,            // current PR list with status updates applied
  record,         // current mutated record
  resolutions,    // { [prId]: { [checkId]: resolutionId } }
  resolveCheck,   // (prId, checkId, resolutionId) => void
  mergePR,        // (prId) => void
  closePR,        // (prId) => void
}
```

`resolveCheck` with `resolutionId === 'reject'` is treated as a close.

---

## Integration steps

### 0. Try it first

After dropping the file in, just render `<PRWorkspace />` with no props. You'll see the three sample PRs immediately. Confirm the styling and interaction model fit before wiring your own data.

### 1. Drop in the file

Copy `PRModule.jsx` into your project. It is single-file and depends only on React 18+ and (optionally) Tailwind for styling.

### 2. Shape your PRs

Build PR objects matching the schema above. Use `SAMPLE_PRS` from the module as templates — they exercise every shape: blocking checks with proposed resolutions, modifying fields with from/to diffs, adding new resources, and informational-only checks.

Minimum viable PR:

```js
{
  id: 'pr-001',
  title: 'Update primary contact email',
  status: 'open',
  modifiesFields: [
    { path: 'contact.email', from: 'old@example.com', to: 'new@example.com' }
  ],
  agentChecks: []
}
```

### 3. Render

```jsx
<PRWorkspace
  initialPRs={prs}
  initialRecord={record}
  onMerged={({ nextRecord }) => saveToBackend(nextRecord)}
/>
```

### 4. (Optional) Wire your own UI

If `PRWorkspace`'s built-in list-then-detail navigation isn't right for your app — for example, you want PRs in a side panel and the detail in a tab — use `usePRReducer` directly:

```jsx
function MyCustomPRView({ initialPRs, initialRecord }) {
  const { prs, record, resolutions, resolveCheck, mergePR, closePR } =
    usePRReducer({ initialPRs, initialRecord });
  const [selectedId, setSelectedId] = useState(null);
  const selected = prs.find(p => p.id === selectedId);

  return (
    <div className="grid grid-cols-2 gap-4">
      <aside><PRListView prs={prs} onSelectPR={setSelectedId} /></aside>
      <main>
        {selected && (
          <PRDetailView
            pr={selected}
            resolutions={resolutions[selected.id]}
            onResolve={resolveCheck}
            onMerge={mergePR}
            onClose={closePR}
          />
        )}
      </main>
    </div>
  );
}
```

---

## Behavior notes

**Merge gating.** The merge button is disabled while any `block`-severity check has no resolution. `warn` and `info` checks never block. Once `block` checks are resolved, the button activates.

**Resolution shorthand.** A check's `proposedResolutions` is free-form, but the id `'reject'` is special-cased: choosing it closes the entire PR. Useful for "this PR shouldn't proceed" choices.

**State is per-instance.** Every `<PRWorkspace>` has its own state. If you want shared state across mounts, lift `usePRReducer` up.

**Mutation is cloned.** `applyPRMods` deep-clones the record before writing. The original `initialRecord` you pass in is never mutated.

**No backend.** The module manages local UI state only. Persistence is up to you — wire `onMerged` to your save endpoint.

**Optimistic by default.** Merges flip status immediately. If your save can fail, debounce or roll back in your `onMerged` handler.

---

## Styling

The module uses Tailwind utility classes inline. If you don't have Tailwind:

- The components still render and function correctly without it.
- Replace the `className` strings with your own — the structure is plain HTML.
- Or run a Tailwind build over the file to extract just the classes the module uses.

The visual language is muted: white cards, slate text, severity tones (red/amber/blue), and a violet accent for agent attribution (the `AIBadge` component). Tweak `AIBadge` and the `SEVERITY` constant at the top of the file to retheme.

---

## Where this came from

Extracted from Cliniarc, an oncology decision-support workspace with a "version control for cancer care" metaphor. The PR module is the most reusable part — the abstraction works anywhere there's a structured record and review-gated changes. Common fits: clinical records, infrastructure config, content workflows, compliance policies, financial models.
