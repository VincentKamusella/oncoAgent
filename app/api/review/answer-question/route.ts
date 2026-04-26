import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { questionId, answer } = (await request.json()) as {
    questionId: string;
    answer: string;
  };

  if (!questionId || !answer) {
    return Response.json({ error: "questionId and answer required" }, { status: 400 });
  }

  const db = await createClient();

  const { error } = await db
    .from("agent_questions")
    .update({
      answered: true,
      answered_at: new Date().toISOString(),
    })
    .eq("id", questionId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, answer });
}
