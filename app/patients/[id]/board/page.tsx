import { notFound } from "next/navigation";
import { getPatient } from "@/lib/mock-data/patients";
import { BoardView } from "@/components/board/board-view";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = getPatient(id);
  if (!patient) notFound();

  return <BoardView patient={patient} />;
}
