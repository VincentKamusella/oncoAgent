import { notFound } from "next/navigation";
import { getPatient } from "@/lib/data";
import { BoardView } from "@/components/board/board-view";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  return <BoardView patient={patient} />;
}
