import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { reviewItemId, reason } = (await request.json()) as {
    reviewItemId: string;
    reason?: string;
  };
  if (!reviewItemId) {
    return Response.json({ error: "reviewItemId required" }, { status: 400 });
  }

  const db = await createClient();

  const { data: item, error: fetchErr } = await db
    .from("review_items")
    .select("id, status")
    .eq("id", reviewItemId)
    .single();

  if (fetchErr || !item) {
    return Response.json({ error: "Review item not found" }, { status: 404 });
  }

  if (item.status === "merged") {
    return Response.json({ error: "Already signed off — cannot decline" }, { status: 409 });
  }

  if (item.status === "declined") {
    return Response.json({ error: "Already declined" }, { status: 409 });
  }

  const now = new Date().toISOString();

  await db
    .from("review_items")
    .update({
      status: "declined",
      declined_at: now,
      decline_reason: reason || null,
    })
    .eq("id", reviewItemId);

  return Response.json({ ok: true });
}
