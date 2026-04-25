import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { reviewItemId } = (await request.json()) as { reviewItemId: string };
  if (!reviewItemId) {
    return Response.json({ error: "reviewItemId required" }, { status: 400 });
  }

  const db = await createClient();

  const { data: item, error: fetchErr } = await db
    .from("review_items")
    .select("*, review_deltas(*)")
    .eq("id", reviewItemId)
    .single();

  if (fetchErr || !item) {
    return Response.json({ error: "Review item not found" }, { status: 404 });
  }

  if (item.status === "merged") {
    return Response.json({ error: "Already signed off" }, { status: 409 });
  }

  const { data: conflicts } = await db
    .from("review_conflicts")
    .select("id")
    .eq("review_item_id", reviewItemId);

  if (conflicts && conflicts.length > 0) {
    return Response.json(
      { error: "Unresolved conflicts — resolve before signing off" },
      { status: 422 },
    );
  }

  const patientId = item.patient_id as string;
  const deltas = (item.review_deltas ?? []) as Array<{
    id: string;
    fact_key: string;
    label: string;
    before_value: string | null;
    after_value: string;
  }>;
  const now = new Date().toISOString();
  const changes: Array<{ fact_key: string; before: string | null; after: string }> = [];

  for (const delta of deltas) {
    const { data: existing } = await db
      .from("facts")
      .select("id, value")
      .eq("patient_id", patientId)
      .eq("key", delta.fact_key)
      .maybeSingle();

    if (existing) {
      await db
        .from("facts")
        .update({
          value: delta.after_value,
          label: delta.label,
          updated_at: now,
          source_kind: item.source_kind,
          source_id: item.source_id,
          source_label: item.source_label,
          source_at: item.source_at,
          source_author: item.source_author,
        })
        .eq("id", existing.id);

      await db.from("fact_history").insert({
        fact_id: existing.id,
        patient_id: patientId,
        key: delta.fact_key,
        old_value: existing.value,
        new_value: delta.after_value,
        review_item_id: reviewItemId,
        created_at: now,
      });
    } else {
      const groupMatch = delta.fact_key.match(/^([^.]+)\./);
      const group = groupMatch?.[1] ?? "history";
      const validGroups = [
        "demographics",
        "diagnosis",
        "staging",
        "medication",
        "imaging",
        "lab",
        "history",
        "genomics",
      ];
      const factGroup = validGroups.includes(group) ? group : "history";

      const { data: newFact } = await db
        .from("facts")
        .insert({
          patient_id: patientId,
          key: delta.fact_key,
          label: delta.label,
          value: delta.after_value,
          group: factGroup,
          source_kind: item.source_kind,
          source_id: item.source_id,
          source_label: item.source_label,
          source_at: item.source_at,
          source_author: item.source_author,
          updated_at: now,
        })
        .select("id")
        .single();

      if (newFact) {
        await db.from("fact_history").insert({
          fact_id: newFact.id,
          patient_id: patientId,
          key: delta.fact_key,
          old_value: null,
          new_value: delta.after_value,
          review_item_id: reviewItemId,
          created_at: now,
        });
      }
    }

    changes.push({
      fact_key: delta.fact_key,
      before: delta.before_value,
      after: delta.after_value,
    });
  }

  const { data: commit } = await db
    .from("record_commits")
    .insert({
      patient_id: patientId,
      review_item_id: reviewItemId,
      changes,
      committed_at: now,
    })
    .select("id")
    .single();

  await db
    .from("review_items")
    .update({
      status: "merged",
      merged_at: now,
    })
    .eq("id", reviewItemId);

  return Response.json({
    ok: true,
    commitId: commit?.id,
    changesApplied: changes.length,
  });
}
