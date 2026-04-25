import { redirect } from "next/navigation";

export default async function PRsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/patients/${id}/inbox`);
}
