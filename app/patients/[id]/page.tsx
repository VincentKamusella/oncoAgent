import { notFound } from "next/navigation";
import { getPatient, guidelinesFor } from "@/lib/data";
import { VaultView } from "@/components/vault/vault-view";

export default async function VaultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patient, guidelines] = await Promise.all([
    getPatient(id),
    guidelinesFor(id),
  ]);
  if (!patient) notFound();

  return <VaultView patient={patient} guidelines={guidelines ?? null} />;
}
