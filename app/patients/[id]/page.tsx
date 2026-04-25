import { notFound } from "next/navigation";
import { getPatient } from "@/lib/data";
import { VaultView } from "@/components/vault/vault-view";

export default async function VaultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  return <VaultView patient={patient} />;
}
