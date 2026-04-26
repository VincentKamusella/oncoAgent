import { syncAll } from "@/lib/neo4j/sync";

export async function POST() {
  try {
    const result = await syncAll();
    return Response.json(result);
  } catch (err) {
    console.error("[api/neo4j/sync]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
