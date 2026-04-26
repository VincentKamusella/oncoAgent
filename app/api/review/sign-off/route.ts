import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { reviewItemId } = (await request.json()) as { reviewItemId: string };
  if (!reviewItemId) {
    return Response.json({ error: "reviewItemId required" }, { status: 400 });
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
