import type { NextRequest } from "next/server";
import { getPatient } from "@/lib/data";
import {
  LINDA_MRN,
  LINDA_PHASE2_BOARDCASE_QUESTION,
  LINDA_PHASE2_OPTIONS,
  STAGING_CT_RE,
} from "@/lib/onboarding/linda-phase1";
import { patients as mockPatients } from "@/lib/mock-data/patients";
import { pullRequests as mockPullRequests } from "@/lib/mock-data/prs";
import type { PullRequest } from "@/lib/types";

function buildLindaPhase2PR(patientSlug: string): PullRequest {
  const nowIso = new Date().toISOString();
  return {
    id: `pr-lh-1-${Date.now().toString(36)}`,
    patientId: patientSlug,
    title:
      "Restage to Stage IV — staging CT shows bilateral pulmonary nodules",
    summary:
      "Staging CT C/A/P (2026-04-24) reports three solid pulmonary nodules in bilateral upper lobes (RUL 8 mm, LUL 6 mm, RUL 5 mm). Contradicts cM0 — patient is de novo metastatic. Curative pathway no longer applies.",
    source: {
      kind: "imaging",
      id: "img-lh-ct-001",
      label: "Staging CT C/A/P · 2026-04-24",
      excerpt:
        "Three solid pulmonary nodules consistent with metastatic disease. No abdominal or osseous metastases.",
      author: "Dr. M. Hartmann, Body Imaging",
      at: "2026-04-24T11:55:00Z",
    },
    proposed: [
      {
        factKey: "staging.cm",
        label: "M descriptor",
        before: "cM0 (clinical, pending)",
        after: "cM1 (lung)",
        impact: "Stage IV — de novo metastatic breast cancer.",
      },
      {
        factKey: "staging.clinical",
        label: "Overall stage",
        before: "cT2 cN1 cM0 — Stage IIB",
        after: "cT2 cN1 cM1 — Stage IV",
        impact: "Pathway re-assignment KSZ-CP-BR-001 → KSZ-CP-BR-002.",
      },
      {
        factKey: "pathway.assignment",
        label: "Clinical pathway",
        before: "KSZ-CP-BR-001 (locoregional)",
        after: "KSZ-CP-BR-002 (advanced)",
      },
      {
        factKey: "treatment.intent",
        label: "Treatment intent",
        before: "Curative",
        after: "Palliative",
      },
      {
        factKey: "medication.neoadjuvant",
        label: "First-line regimen",
        before: "AC-T → lumpectomy → adjuvant letrozole + abemaciclib",
        after: "Letrozole + ribociclib (1L palliative)",
        impact:
          "MDT decision required — multiple CDK4/6 inhibitors viable (ribociclib / palbociclib / abemaciclib).",
      },
      {
        factKey: "lab.tumor-marker.ca15-3",
        label: "CA 15-3 interpretation",
        before: "elevated; correlate with staging",
        after: "elevated; consistent with metastatic disease",
      },
    ],
    conflicts: [
      {
        factKey: "staging.cm",
        label: "M descriptor",
        before: "cM0 (clinical, pending)",
        after: "cM1 (lung)",
        severity: "high",
        rationale:
          "Phase 1 value was explicitly provisional ('staging studies pending'). Auto-resolves per KSZ-CP-BR-001 §exit criteria.",
      },
      {
        factKey: "medication.neoadjuvant",
        label: "First-line regimen",
        before: "AC-T (curative)",
        after: "Letrozole + ribociclib (palliative)",
        severity: "high",
        rationale:
          "Curative pathway no longer applies. Choice between ribociclib / palbociclib / abemaciclib left to MDT — not auto-mergeable.",
      },
    ],
    gaps: [
      "8 downstream operational records pending update per KSZ-SOP-101 §Downstream cascade — port placement, neoadjuvant chemo C1, surgery pencil all need cancellation; PA-26-AT-9921 to be withdrawn; new PA for letrozole+ribociclib to be filed; MDT agenda v2 + recategorisation; problem-list update (C78.00); patient + family communication + audit log.",
    ],
    status: "needs-review",
    agentVerdict:
      "1 conflict on staging.cm auto-resolves; 1 conflict on first-line regimen requires MDT (3-way CDK4/6 choice). 8 downstream cascade items proposed.",
    openedAt: nowIso,
    author: { name: "Dr. M. Hartmann", role: "Radiology · Body Imaging" },
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient?.mrn) return new Response(null, { status: 404 });

  let body: { fileNames?: unknown };
  try {
    body = (await req.json()) as { fileNames?: unknown };
  } catch {
    return new Response(null, { status: 400 });
  }

  const fileNames = Array.isArray(body.fileNames)
    ? (body.fileNames.filter((x): x is string => typeof x === "string") as string[])
    : [];
  if (fileNames.length === 0) return new Response(null, { status: 400 });

  const isLinda =
    patient.mrn.replace(/[\s_]+/g, "-").toUpperCase() === LINDA_MRN;
  const triggersCascade =
    isLinda && fileNames.some((n) => STAGING_CT_RE.test(n));

  if (!triggersCascade) {
    return new Response(null, { status: 204 });
  }

  // Avoid double-injecting if the user re-uploads.
  const alreadyOpen = mockPullRequests.some(
    (pr) => pr.patientId === patient.id && pr.title.startsWith("Restage to Stage IV"),
  );

  let pr: PullRequest | undefined;
  if (!alreadyOpen) {
    pr = buildLindaPhase2PR(patient.id);
    mockPullRequests.unshift(pr);

    // Mutate Linda's in-memory mock entry so the agent panel reflects the new state.
    const live = mockPatients.find((p) => p.id === patient.id);
    if (live) {
      const now = new Date().toISOString();
      live.agent.recent.unshift({
        id: `ev-lh-cascade-${Date.now().toString(36)}`,
        action:
          "Detected staging contradiction — opened PR (cM0 → cM1, plan supersession proposed)",
        at: now,
        ref: { kind: "pr", id: pr.id, label: pr.title },
      });
      live.agent.needsYou.unshift({
        id: `q-lh-cascade-${Date.now().toString(36)}`,
        question:
          "M-descriptor changed cM0 → cM1. Approve the proposed cascade (8 downstream updates)?",
        detail:
          "Phase 1 staging was explicitly provisional. Auto-resolution per KSZ-CP-BR-001. Regimen choice (ribociclib/palbociclib/abemaciclib) requires MDT.",
        ref: { kind: "pr", id: pr.id, label: pr.title },
        options: ["Approve all", "Review individually", "Defer to MDT"],
      });
      live.agent.now = {
        action:
          "Surfacing staging contradiction; cascade of 8 downstream updates proposed",
        ref: { kind: "pr", id: pr.id, label: pr.title },
      };

      // The whole vault flips curative → palliative when the CT lands.
      live.options = LINDA_PHASE2_OPTIONS;
      live.chosenOptionId = null;
      if (live.boardCase) {
        live.boardCase.question = LINDA_PHASE2_BOARDCASE_QUESTION;
        live.boardCase.status = "live";
        live.boardCase.openedAt = now;
        live.boardCase.decidedOptionId = null;
        const hasHartmann = live.boardCase.attendees.some(
          (a) => a.name === "Dr. M. Hartmann",
        );
        if (!hasHartmann) {
          live.boardCase.attendees.unshift({
            name: "Dr. M. Hartmann",
            role: "Radiology · Body Imaging",
            tone: "amber",
          });
        }
      }
    }
  } else {
    pr = mockPullRequests.find(
      (p) => p.patientId === patient.id && p.title.startsWith("Restage to Stage IV"),
    );
  }

  return Response.json(
    { prId: pr?.id ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
