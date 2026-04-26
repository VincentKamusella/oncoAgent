import type { NextRequest } from "next/server";
import { getPatient } from "@/lib/data";
import { fetchPatientGraph } from "@/lib/neo4j/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient?.mrn) return new Response(null, { status: 404 });

  try {
    const graph = await fetchPatientGraph(patient.mrn);
    if (graph.nodes.length === 0) return new Response(null, { status: 204 });
    return Response.json(graph, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/patients/graph]", err);
    return new Response(null, { status: 502 });
  }
}
