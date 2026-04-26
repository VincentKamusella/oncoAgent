import { createClient } from "@/lib/supabase/server";
import { patients as mockPatients } from "@/lib/mock-data/patients";
import { pullRequests as mockPullRequests } from "@/lib/mock-data/prs";

const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

export async function POST(request: Request) {
  const { reviewItemId } = (await request.json()) as { reviewItemId: string };
  if (!reviewItemId) {
    return Response.json({ error: "reviewItemId required" }, { status: 400 });
  }

  if (!USE_SUPABASE) {
    const pr = mockPullRequests.find((p) => p.id === reviewItemId);
    if (!pr) {
      return Response.json({ error: "Review item not found" }, { status: 404 });
    }
    if (pr.status === "merged" || pr.status === "declined") {
      return Response.json({ error: `Already ${pr.status}` }, { status: 409 });
    }

    pr.status = "merged";

    const live = mockPatients.find((p) => p.id === pr.patientId);
    if (live) {
      const now = new Date().toISOString();
      live.agent.recent.unshift({
        id: `ev-resolve-${Date.now().toString(36)}`,
        action: `Cascade resolved — ${pr.proposed.length} delta${pr.proposed.length === 1 ? "" : "s"} applied`,
        at: now,
        ref: { kind: "pr", id: pr.id, label: pr.title },
      });
      live.agent.now = {
        action: "Phase-2 cascade signed off — palliative pathway active",
        ref: { kind: "pr", id: pr.id, label: pr.title },
      };
      live.agent.needsYou = live.agent.needsYou.filter(
        (q) => q.ref?.id !== pr.id,
      );
    }

    return Response.json({
      ok: true,
      commitId: pr.id,
      changesApplied: pr.proposed.length,
    });
  }

  const db = await createClient();
  const { data, error } = await db.rpc("sign_off_review_item", {
    p_review_item_id: reviewItemId,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const result = data as { ok?: boolean; error?: string; status?: number; commitId?: string; changesApplied?: number };

  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status || 400 });
  }

  return Response.json({
    ok: true,
    commitId: result.commitId,
    changesApplied: result.changesApplied,
  });
}
