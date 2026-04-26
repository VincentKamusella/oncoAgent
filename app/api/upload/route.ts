import { createClient } from "@/lib/supabase/server";

const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    patientId: string;
    specialty: string;
    name: string;
    kind: string;
    sizeKb?: number;
    mimeType?: string;
  };

  const { patientId, specialty, name, kind, sizeKb, mimeType } = body;

  if (!patientId || !specialty || !name || !kind) {
    return Response.json(
      { error: "patientId, specialty, name, and kind are required" },
      { status: 400 },
    );
  }

  // Mock mode: nothing to persist; the SpecialistFolder already added the
  // attachment to its local state. Return a 200 no-op so the client doesn't
  // surface a 500 in the console.
  if (!USE_SUPABASE) {
    return Response.json({ ok: true, attachment: null });
  }

  const db = await createClient();

  // Resolve slug to UUID
  const { data: patient } = await db
    .from("patients")
    .select("id")
    .eq("slug", patientId)
    .maybeSingle();

  if (!patient) {
    return Response.json({ error: "Patient not found" }, { status: 404 });
  }

  const patientUuid = patient.id as string;

  // Generate a storage path from the slug and specialty
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `/vault/${patientId}/${specialty}/${safeName}`;

  const { data: attachment, error } = await db
    .from("attachments")
    .insert({
      patient_id: patientUuid,
      specialty,
      kind,
      name,
      storage_path: storagePath,
      size_kb: sizeKb ?? null,
      mime_type: mimeType ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, attachment });
}
