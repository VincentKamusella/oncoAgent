// PRModule.jsx
// ─────────────────────────────────────────────────────────────────────
// A self-contained React module for "PRs over structured data".
//
// What this gives you:
//   - <PRWorkspace>     Top-level component. Drop in a list of PRs + a base
//                       state object, and you get the list view + detail view
//                       + merge/close logic out of the box.
//   - <PRListView>      Just the list (Open / Merged / Closed sections).
//   - <PRDetailView>    Just the detail page (header, diff, checks, actions).
//   - <CheckCard>       Just a single agent check. Useful if you want to
//                       compose your own PR layout.
//   - usePRReducer      The state hook PRWorkspace is built on, exposed
//                       so you can drive it from your own UI.
//   - applyPRMods       Pure function: applies a PR's modifiesFields to a
//                       deep-cloned base object. Useful server-side too.
//
// Dependencies:
//   - React 18+
//   - Tailwind CSS (the components use Tailwind utility classes directly).
//     If you don't use Tailwind, the styles won't apply but the components
//     will still render and function — you can replace className strings.
//
// Data shape: see PR_SCHEMA.md (companion spec).
// ─────────────────────────────────────────────────────────────────────

import React, { useReducer, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────
// PRIMITIVES
// Light-weight building blocks the PR components compose from.
// Inlined here so the module is single-file. If your design system
// already has these, swap them out.
// ─────────────────────────────────────────────────────────────────────

function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200/80 ${onClick ? 'cursor-pointer hover:border-gray-300' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children, right }) {
  return (
    <div className="flex items-center justify-between px-1 mb-2">
      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{children}</span>
      {right}
    </div>
  );
}

// "AI" sparkle/badge to attribute work to the agent. Replace freely.
function AIBadge({ size = 'sm' }) {
  const cls =
    size === 'sm' ? 'w-3.5 h-3.5 text-[9px]' :
    size === 'md' ? 'w-4 h-4 text-[10px]'    :
                    'w-5 h-5 text-xs';
  return (
    <div className={`${cls} rounded-[3px] bg-violet-500 text-white font-medium flex items-center justify-center shrink-0 tracking-tight`}>
      AI
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SEVERITY
// 'block' = unresolved blocker prevents merging
// 'warn'  = surfaced for attention but doesn't block
// 'info'  = informational, no action required
// ─────────────────────────────────────────────────────────────────────

const SEVERITY = {
  block: { label: 'Block', icon: '✕', color: 'red' },
  warn:  { label: 'Warn',  icon: '!', color: 'amber' },
  info:  { label: 'Info',  icon: 'i', color: 'blue' },
};

function SeverityBadge({ severity }) {
  const s = SEVERITY[severity] || SEVERITY.info;
  const colorMap = {
    red:   'bg-red-100 text-red-800',
    amber: 'bg-amber-100 text-amber-900',
    blue:  'bg-blue-100 text-blue-800',
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-medium ${colorMap[s.color]}`}
      style={{ fontSize: '10px' }}
      title={s.label}
    >
      {s.icon}
    </span>
  );
}

// Small inline badges shown on the PR list row to summarise checks at a glance.
function CheckCountBadges({ summary }) {
  if (!summary) return null;
  return (
    <div className="flex items-center gap-1">
      {summary.block > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-800 tabular-nums">
          <span className="w-1 h-1 rounded-full bg-red-600" /> {summary.block}
        </span>
      )}
      {summary.warn > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 tabular-nums">
          <span className="w-1 h-1 rounded-full bg-amber-600" /> {summary.warn}
        </span>
      )}
      {summary.info > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 tabular-nums">
          <span className="w-1 h-1 rounded-full bg-blue-600" /> {summary.info}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CHECK CARD
// One agent check inside a PR. Renders the severity, message, evidence,
// and (if not yet resolved) a list of proposed-resolution buttons.
// ─────────────────────────────────────────────────────────────────────

export function CheckCard({ check, resolution, onResolve, isFinalized }) {
  const isResolved = !!resolution || isFinalized;
  const sevTones = {
    block: 'border-red-300 bg-red-50/60',
    warn:  'border-amber-300 bg-amber-50/60',
    info:  'border-blue-200 bg-blue-50/40',
  };
  const sevTextTones = {
    block: 'text-red-700',
    warn:  'text-amber-800',
    info:  'text-blue-800',
  };

  return (
    <div className={`rounded-md border ${sevTones[check.severity]} ${isResolved ? 'opacity-70' : ''}`}>
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <SeverityBadge severity={check.severity} />
          <span className={`text-[10px] font-medium uppercase tracking-wider ${sevTextTones[check.severity]}`}>
            {check.severity}
          </span>
          <span className="text-[13px] font-medium text-gray-900 flex-1">{check.title}</span>
          {isResolved && <span className="text-emerald-700 text-[11px]">✓ resolved</span>}
        </div>

        <div className="text-[12px] text-gray-700 leading-relaxed mb-2">{check.message}</div>

        {check.evidence?.length > 0 && (
          <div className="bg-white/70 rounded px-2 py-1.5 mb-2 border border-white/80">
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Evidence</div>
            {check.evidence.map((e, i) => (
              <div key={i} className="text-[11px] text-gray-600">
                {e.ref && <span className="text-gray-400 font-mono mr-1.5">{e.ref}</span>}
                {e.path && <span className="text-gray-400 font-mono mr-1.5">{e.path}</span>}
                <span>{e.text}</span>
              </div>
            ))}
          </div>
        )}

        {!isResolved && check.proposedResolutions?.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Resolve</div>
            {check.proposedResolutions.map((r) => (
              <button
                key={r.id}
                onClick={() => onResolve(r.id)}
                className={`w-full text-left text-[12px] px-2.5 py-1.5 rounded border transition-colors ${
                  r.isDefault
                    ? 'border-violet-300 bg-violet-50 text-violet-900 hover:bg-violet-100'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                {r.isDefault && <span className="mr-1">★</span>}
                {r.label}
                {r.requires && <span className="text-[10px] text-gray-500 ml-2">(requires: {r.requires})</span>}
              </button>
            ))}
          </div>
        )}

        {isResolved && resolution && check.proposedResolutions && (
          <div className="text-[11px] text-gray-600 italic">
            Resolution: {check.proposedResolutions.find((r) => r.id === resolution)?.label || resolution}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PR DIFF SECTION
// Shows the PR's proposed changes — both adds (new resources) and
// modifies (path-based field updates) in a GitHub-style diff layout.
// ─────────────────────────────────────────────────────────────────────

function PRDiffSection({ pr }) {
  const hasAdds = pr.addsResources?.length > 0;
  const hasMods = pr.modifiesFields?.length > 0;
  if (!hasAdds && !hasMods) return null;

  return (
    <Card className="px-5 py-4">
      <SectionLabel>Proposed changes</SectionLabel>

      {hasAdds && (
        <div className={hasMods ? 'mb-3' : ''}>
          <div className="text-[11px] text-emerald-700 font-medium mb-1.5 px-1">+ Adding</div>
          {pr.addsResources.map((r, i) => (
            <div
              key={i}
              className="bg-emerald-50/50 border border-emerald-200/60 rounded-md px-3 py-2 mb-1.5 last:mb-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium font-mono">
                  + {r.type}
                </span>
                <span className="text-[12px] text-gray-700 font-mono">{r.ref || r.data?.name}</span>
              </div>
              {r.data && (
                <div className="text-[11px] text-gray-600 mt-1">
                  {/* Generic preview line: drop fields you don't have. */}
                  {[r.data.dose, r.data.frequency, r.data.indication].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMods && (
        <div>
          <div className="text-[11px] text-amber-700 font-medium mb-1.5 px-1">~ Modifying</div>
          {pr.modifiesFields.map((f, i) => (
            <div
              key={i}
              className="bg-amber-50/50 border border-amber-200/60 rounded-md px-3 py-2 mb-1.5 last:mb-0"
            >
              <div className="font-mono text-[11px] text-gray-600 mb-1">{f.path}</div>
              <div className="flex items-center gap-2 text-[12px] flex-wrap">
                <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono">- {String(f.from)}</span>
                <span className="text-gray-400">→</span>
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">+ {String(f.to)}</span>
              </div>
              {f.rationale && <div className="text-[11px] text-gray-500 mt-1.5 italic">{f.rationale}</div>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PR LIST ITEM + LIST VIEW
// ─────────────────────────────────────────────────────────────────────

function PRListItem({ pr, onClick }) {
  const isMerged = pr.status === 'merged';
  const isClosed = pr.status === 'closed';
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-gray-200/80 hover:border-gray-300 transition-colors px-4 py-3"
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider shrink-0 ${
              isMerged ? 'bg-emerald-100 text-emerald-800' :
              isClosed ? 'bg-gray-100 text-gray-500' :
                         'bg-gray-100 text-gray-700'
            }`}
          >
            {pr.status}
          </span>
          <span className="text-[13px] font-medium text-gray-900 truncate">{pr.title}</span>
        </div>
        {pr.checkSummary && pr.status === 'open' && <CheckCountBadges summary={pr.checkSummary} />}
      </div>
      <div className="text-[12px] text-gray-500 line-clamp-2 mb-1.5">{pr.summary}</div>
      <div className="flex items-center gap-2 text-[10px] text-gray-400">
        <span className="font-mono">{pr.id}</span>
        {pr.openedAt && <><span>·</span><span>opened {new Date(pr.openedAt).toLocaleDateString()}</span></>}
        {pr.openedBy && <><span>·</span><span>by {String(pr.openedBy).replace('system:', '')}</span></>}
      </div>
    </button>
  );
}

export function PRListView({ prs, onSelectPR, emptyMessage = 'No PRs.' }) {
  const openPRs   = prs.filter((p) => p.status === 'open');
  const mergedPRs = prs.filter((p) => p.status === 'merged');
  const closedPRs = prs.filter((p) => p.status === 'closed');

  if (openPRs.length === 0 && mergedPRs.length === 0 && closedPRs.length === 0) {
    return <div className="text-center py-12 text-gray-400 text-sm">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-4">
      {openPRs.length > 0 && (
        <div>
          <SectionLabel>Open · {openPRs.length}</SectionLabel>
          <div className="space-y-2">
            {openPRs.map((pr) => <PRListItem key={pr.id} pr={pr} onClick={() => onSelectPR(pr.id)} />)}
          </div>
        </div>
      )}
      {mergedPRs.length > 0 && (
        <div>
          <SectionLabel>Recently merged · {mergedPRs.length}</SectionLabel>
          <div className="space-y-2">
            {mergedPRs.map((pr) => <PRListItem key={pr.id} pr={pr} onClick={() => onSelectPR(pr.id)} />)}
          </div>
        </div>
      )}
      {closedPRs.length > 0 && (
        <div>
          <SectionLabel>Closed · {closedPRs.length}</SectionLabel>
          <div className="space-y-2">
            {closedPRs.map((pr) => <PRListItem key={pr.id} pr={pr} onClick={() => onSelectPR(pr.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PR DETAIL VIEW
// Full page: header + diff + agent checks + merge/close actions.
// ─────────────────────────────────────────────────────────────────────

export function PRDetailView({
  pr,
  resolutions,
  onResolve,
  onMerge,
  onClose,
  onBack,
  reviewerName,                       // optional, e.g. "Dr. Okonkwo"
  recordLabel = 'the record',         // shown in success state, e.g. "Maya's record"
}) {
  const blockChecks = pr.agentChecks?.filter((c) => c.severity === 'block') || [];
  const unresolvedBlocks = blockChecks.filter((c) => !resolutions?.[c.id]);
  const isMerged = pr.status === 'merged';
  const isClosed = pr.status === 'closed';
  const isFinalized = isMerged || isClosed;
  const canMerge = unresolvedBlocks.length === 0 && !isFinalized;
  const author = String(pr.openedBy || '').replace('system:', '');

  return (
    <div className="space-y-3">
      {onBack && (
        <div className="flex items-center gap-2 text-[12px] text-gray-500">
          <button onClick={onBack} className="hover:text-gray-900 transition-colors">← Back</button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-300">PRs</span>
          <span className="text-gray-300">/</span>
          <span className="font-mono text-gray-700">{pr.id}</span>
        </div>
      )}

      <Card className="px-5 py-4">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${
                  isMerged ? 'bg-emerald-100 text-emerald-800' :
                  isClosed ? 'bg-gray-100 text-gray-500' :
                             'bg-gray-100 text-gray-700'
                }`}
              >
                {pr.status}
              </span>
              <span className="text-[15px] font-medium text-gray-900">{pr.title}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
              {pr.openedAt && <span>opened {new Date(pr.openedAt).toLocaleString()}</span>}
              {author && <><span>·</span><span>by {author}</span></>}
              {reviewerName && <><span>·</span><span>reviewer: {reviewerName}</span></>}
            </div>
          </div>
        </div>
        {pr.summary && <div className="text-[13px] text-gray-700 leading-relaxed">{pr.summary}</div>}
      </Card>

      <PRDiffSection pr={pr} />

      {pr.agentChecks?.length > 0 && (
        <Card className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <AIBadge />
              <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                Agent checks · {pr.agentChecks.length}
              </span>
            </div>
            {!isFinalized && unresolvedBlocks.length > 0 && (
              <span className="text-[11px] text-red-700 font-medium">
                {unresolvedBlocks.length} blocking {unresolvedBlocks.length === 1 ? 'check' : 'checks'}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {pr.agentChecks.map((c) => (
              <CheckCard
                key={c.id}
                check={c}
                resolution={resolutions?.[c.id]}
                onResolve={(rid) => onResolve(pr.id, c.id, rid)}
                isFinalized={isFinalized}
              />
            ))}
          </div>
        </Card>
      )}

      {!isFinalized && (
        <Card className="px-5 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[12px] text-gray-500">
              {unresolvedBlocks.length > 0
                ? `${unresolvedBlocks.length} blocking ${unresolvedBlocks.length === 1 ? 'check' : 'checks'} unresolved`
                : 'All checks cleared. Ready to merge.'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onClose(pr.id)}
                className="text-[12px] px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close PR
              </button>
              <button
                onClick={() => onMerge(pr.id)}
                disabled={!canMerge}
                className={`text-[12px] font-medium px-4 py-1.5 rounded-md transition-colors ${
                  canMerge
                    ? 'bg-violet-600 text-white border border-violet-600 hover:bg-violet-700'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                Merge {canMerge && '↗'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {isMerged && (
        <Card className="px-5 py-3.5 bg-emerald-50/50 border-emerald-200">
          <div className="flex items-center gap-2 text-[13px] text-emerald-900">
            <span className="text-emerald-600 text-base">✓</span>
            <span className="font-medium">Merged.</span>
            <span>Changes applied to {recordLabel}.</span>
          </div>
        </Card>
      )}

      {isClosed && (
        <Card className="px-5 py-3.5 bg-gray-50">
          <div className="flex items-center gap-2 text-[13px] text-gray-700">
            <span className="text-gray-500 text-base">✕</span>
            <span className="font-medium">Closed without merge.</span>
            <span>No changes applied.</span>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// STATE: REDUCER + HELPERS
// ─────────────────────────────────────────────────────────────────────

// Pure helper: apply a PR's `modifiesFields` to a deep clone of the base
// object. Each entry has shape { path: 'a.b.c', from, to, rationale? }.
// Path is dot-separated. Returns a new object; does not mutate input.
export function applyPRMods(base, mods) {
  const next = JSON.parse(JSON.stringify(base));
  for (const f of mods) {
    const parts = f.path.split('.');
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] == null) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = f.to;
  }
  return next;
}

// Reducer that owns: PRs, resolution choices per PR, and the mutated
// base record. Action types: RESOLVE, MERGE, CLOSE.
function prReducer(state, action) {
  switch (action.type) {
    case 'RESOLVE': {
      const { prId, checkId, resolutionId } = action;
      // Special case: 'reject' as resolution short-circuits to a close.
      if (resolutionId === 'reject') {
        return {
          ...state,
          prs: state.prs.map((p) => p.id === prId ? { ...p, status: 'closed' } : p),
        };
      }
      return {
        ...state,
        resolutions: {
          ...state.resolutions,
          [prId]: { ...(state.resolutions[prId] || {}), [checkId]: resolutionId },
        },
      };
    }
    case 'MERGE': {
      const { prId } = action;
      const pr = state.prs.find((p) => p.id === prId);
      if (!pr) return state;
      const nextRecord = pr.modifiesFields?.length
        ? applyPRMods(state.record, pr.modifiesFields)
        : state.record;
      return {
        ...state,
        record: nextRecord,
        prs: state.prs.map((p) =>
          p.id === prId ? { ...p, status: 'merged', mergedAt: new Date().toISOString() } : p
        ),
      };
    }
    case 'CLOSE': {
      const { prId } = action;
      return {
        ...state,
        prs: state.prs.map((p) => p.id === prId ? { ...p, status: 'closed' } : p),
      };
    }
    default:
      return state;
  }
}

// Hook: gives you state + bound action handlers. PRWorkspace uses this
// internally; you can also use it directly to build your own UI on top.
export function usePRReducer({ initialPRs = [], initialRecord = {} } = {}) {
  const [state, dispatch] = useReducer(prReducer, {
    prs: initialPRs,
    record: initialRecord,
    resolutions: {},
  });
  return {
    prs: state.prs,
    record: state.record,
    resolutions: state.resolutions,
    resolveCheck: (prId, checkId, resolutionId) => dispatch({ type: 'RESOLVE', prId, checkId, resolutionId }),
    mergePR:      (prId) => dispatch({ type: 'MERGE', prId }),
    closePR:      (prId) => dispatch({ type: 'CLOSE', prId }),
  };
}

// ─────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────
// SAMPLE DATA
// Used as defaults for <PRWorkspace /> when no props are passed, so the
// module renders something meaningful out of the box. Pass your own
// `initialPRs` and `initialRecord` props to drive it with real data.
// ─────────────────────────────────────────────────────────────────────

export const SAMPLE_RECORD = {
  "patient": {
    "id": "patient-maya-alvarez",
    "name": {
      "given": [
        "Maya",
        "Elena"
      ],
      "family": "Alvarez",
      "preferred": "Maya"
    }
  },
  "diagnosis": {
    "primary": {
      "condition": "Invasive ductal carcinoma, right breast",
      "stage": {
        "current": "IIA (pT2 pN0 M0)"
      },
      "diseaseStatus": {
        "current": "no evidence of disease (NED)"
      }
    }
  },
  "medications": [
    {
      "id": "med-anastrozole",
      "name": "Anastrozole",
      "rxNorm": "84857",
      "dose": "1 mg",
      "route": "PO",
      "frequency": "once daily",
      "indication": "Adjuvant endocrine therapy for ER+ breast cancer",
      "startDate": "2024-05-14",
      "endDate": null,
      "plannedEndDate": "2029-05-14",
      "status": "active",
      "prescriber": "practitioner-okonkwo",
      "lastFilled": "2026-04-02",
      "refillsRemaining": 2
    }
  ]
};

export const SAMPLE_PRS = [
  {
    "id": "pr-2026-04-25-tamoxifen",
    "openedAt": "2026-04-25T07:18:00-07:00",
    "openedBy": "system:surescripts-feed",
    "title": "New prescription \u2014 tamoxifen 20mg daily",
    "summary": "e-Prescription received from Mission Bay Pharmacy: tamoxifen 20mg PO daily, qty 90, 5 refills. Prescriber: Dr. Okonkwo (per Surescripts).",
    "status": "open",
    "priority": "high",
    "checkSummary": {
      "block": 1,
      "warn": 0,
      "info": 0
    },
    "addsResources": [
      {
        "type": "MedicationRequest",
        "data": {
          "name": "Tamoxifen",
          "dose": "20mg",
          "route": "PO",
          "frequency": "once daily",
          "indication": "Hormone receptor-positive breast cancer",
          "prescriber": "practitioner-okonkwo",
          "startDate": "2026-04-25",
          "rxId": "RXSS-588211"
        }
      }
    ],
    "modifiesFields": [],
    "agentChecks": [
      {
        "id": "chk-endocrine-conflict",
        "severity": "block",
        "title": "Conflict with active endocrine therapy",
        "message": "Patient is currently on anastrozole 1mg daily (active since 2024-05-14, planned through 2029-05-14). Tamoxifen and anastrozole are not used concurrently \u2014 both are first-line endocrine therapy for ER+ disease, but only one is taken at a time. This may be a transcription error or an intended switch that wasn't documented.",
        "evidence": [
          {
            "ref": "med-anastrozole",
            "text": "Anastrozole 1mg daily, active 23 months"
          }
        ],
        "proposedResolutions": [
          {
            "id": "switch",
            "label": "Switch: discontinue anastrozole, start tamoxifen",
            "requires": "discontinuation note for med-anastrozole"
          },
          {
            "id": "reject",
            "label": "Reject this PR (likely transcription error)"
          },
          {
            "id": "override",
            "label": "Merge anyway (require clinician note explaining concurrent use)"
          }
        ]
      }
    ],
    "reviewers": [
      "practitioner-okonkwo"
    ]
  },
  {
    "id": "pr-2026-04-11-surv-ct",
    "openedAt": "2026-04-11T14:22:00-07:00",
    "openedBy": "system:bay-imaging-feed",
    "title": "Surveillance CT C/A/P \u2014 Apr 11, 2026",
    "summary": "New imaging study (CT chest/abdomen/pelvis with contrast) and accompanying radiology report from Bay Imaging Center.",
    "status": "open",
    "priority": "high",
    "checkSummary": {
      "block": 1,
      "warn": 1,
      "info": 0
    },
    "addsResources": [
      {
        "type": "ImagingStudy",
        "ref": "imaging-surv-ct-2026-04"
      },
      {
        "type": "DiagnosticReport",
        "ref": "diag-radiology-ct-2026-04"
      }
    ],
    "modifiesFields": [
      {
        "path": "diagnosis.primary.diseaseStatus.current",
        "from": "no evidence of disease (NED)",
        "to": "equivocal \u2014 workup in progress",
        "rationale": "CT impression supports metastatic disease as differential; status should reflect uncertainty pending tissue diagnosis."
      }
    ],
    "agentChecks": [
      {
        "id": "chk-status-update",
        "severity": "block",
        "title": "Disease status change required",
        "message": "CT impression: '1.2cm hypoenhancing lesion in segment 7, indeterminate but concerning for metastasis given oncologic history.' Current diseaseStatus = NED is no longer accurate given the new evidence. Recommend updating to 'equivocal \u2014 workup in progress' until tissue diagnosis.",
        "evidence": [
          {
            "ref": "diag-radiology-ct-2026-04",
            "text": "Impression supports metastasis as differential"
          },
          {
            "path": "diagnosis.primary.diseaseStatus.current",
            "text": "Currently NED (since 2024-05-14)"
          }
        ],
        "proposedResolutions": [
          {
            "id": "accept",
            "label": "Update diseaseStatus to 'equivocal \u2014 workup in progress'",
            "isDefault": true
          },
          {
            "id": "defer",
            "label": "Defer status change pending biopsy results"
          }
        ]
      },
      {
        "id": "chk-missing-markers",
        "severity": "warn",
        "title": "Tumor markers not yet on file",
        "message": "Surveillance CT typically paired with CEA + CA 15-3 within \u00b17 days. None found within window of this study. Confirm whether markers were ordered.",
        "evidence": [],
        "proposedResolutions": []
      }
    ],
    "reviewers": [
      "practitioner-okonkwo"
    ]
  },
  {
    "id": "pr-2026-04-14-tumor-markers",
    "openedAt": "2026-04-14T11:05:00-07:00",
    "openedBy": "system:quest-feed",
    "title": "Tumor markers \u2014 CEA + CA 15-3",
    "summary": "Two new observations from Quest Diagnostics dated 2026-04-14.",
    "status": "open",
    "priority": "medium",
    "checkSummary": {
      "block": 0,
      "warn": 0,
      "info": 2
    },
    "addsResources": [
      {
        "type": "Observation",
        "ref": "obs-cea-2026-04"
      },
      {
        "type": "Observation",
        "ref": "obs-ca15-2026-04"
      }
    ],
    "modifiesFields": [],
    "agentChecks": [
      {
        "id": "chk-marker-rise",
        "severity": "info",
        "title": "Both markers rising vs prior",
        "message": "CEA 2.1 \u2192 6.8 (>3\u00d7 ULN). CA 15-3 28 \u2192 52 (>1.5\u00d7 ULN). Both were stable through prior 18 months of surveillance. Concurrent rise across two markers is clinically meaningful.",
        "evidence": [
          {
            "ref": "obs-cea-2026-04",
            "text": "CEA 6.8 (was 2.1)"
          },
          {
            "ref": "obs-ca15-2026-04",
            "text": "CA 15-3 52 (was 28)"
          }
        ],
        "proposedResolutions": [
          {
            "id": "merge",
            "label": "Merge",
            "isDefault": true
          }
        ]
      },
      {
        "id": "chk-pattern-watch",
        "severity": "info",
        "title": "Pattern check on merge",
        "message": "Combined with the open CT PR (pr-2026-04-11-surv-ct), merging this would constitute a recurrence-suspicion pattern. After both merge, an issue will be opened to recommend tumor board review."
      }
    ],
    "reviewers": [
      "practitioner-okonkwo"
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────
// PR WORKSPACE
// Top-level "easy button" — drop in PRs + a base record and you get the
// list view + detail view + state management out of the box.
// Optional onMerged({ pr, nextRecord }) callback fires after every merge,
// useful for syncing the mutated record back to your own store.
// ─────────────────────────────────────────────────────────────────────

export function PRWorkspace({
  initialPRs = SAMPLE_PRS,
  initialRecord = SAMPLE_RECORD,
  reviewerName = 'Dr. Okonkwo',
  recordLabel = "Maya's record",
  onMerged,
}) {
  const { prs, record, resolutions, resolveCheck, mergePR, closePR } =
    usePRReducer({ initialPRs, initialRecord });

  const [selectedPRId, setSelectedPRId] = useState(null);
  const selectedPR = prs.find((p) => p.id === selectedPRId);

  const handleMerge = (prId) => {
    const pr = prs.find((p) => p.id === prId);
    mergePR(prId);
    if (onMerged && pr) {
      const nextRecord = pr.modifiesFields?.length
        ? applyPRMods(record, pr.modifiesFields)
        : record;
      onMerged({ pr, nextRecord });
    }
  };

  if (selectedPR) {
    return (
      <PRDetailView
        pr={selectedPR}
        resolutions={resolutions[selectedPR.id]}
        onResolve={resolveCheck}
        onMerge={handleMerge}
        onClose={closePR}
        onBack={() => setSelectedPRId(null)}
        reviewerName={reviewerName}
        recordLabel={recordLabel}
      />
    );
  }

  return <PRListView prs={prs} onSelectPR={setSelectedPRId} />;
}

export default PRWorkspace;
