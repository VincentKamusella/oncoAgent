import { notFound } from "next/navigation";
import { getPatient, guidelinesFor } from "@/lib/data";
import { GuidelinesPageClient } from "./guidelines-client";

export default async function GuidelinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  const graph = await guidelinesFor(id);
  if (!patient || !graph) notFound();

  return <GuidelinesPageClient patient={patient} graph={graph} />;
}
