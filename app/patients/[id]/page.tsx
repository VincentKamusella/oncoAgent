import { notFound } from "next/navigation";
import { getPatient } from "@/lib/mock-data/patients";
import { VaultView } from "@/components/vault/vault-view";

export default async function VaultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = getPatient(id);
  if (!patient) notFound();

  return <VaultView patient={patient} />;
}
