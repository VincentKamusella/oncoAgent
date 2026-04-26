import "server-only";

import neo4j, { type Integer } from "neo4j-driver";

// Re-use the same singleton driver pattern from client.ts
// We cannot import the private getDriver() so we replicate the cached access.
type GlobalWithDriver = typeof globalThis & { __neo4jDriver?: import("neo4j-driver").Driver };
const g = globalThis as GlobalWithDriver;

function getDriver() {
  if (g.__neo4jDriver) return g.__neo4jDriver;
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USERNAME;
  const pass = process.env.NEO4J_PASSWORD;
  if (!uri || !user || !pass) {
    throw new Error(
      "Missing Neo4j env vars (NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD)",
    );
  }
  g.__neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, pass));
  return g.__neo4jDriver;
}

// ── Neo4j Integer normalisation ──────────────────────────────────────

function isNeoInteger(v: unknown): v is Integer {
  return (
    typeof v === "object" &&
    v !== null &&
    "low" in (v as object) &&
    "high" in (v as object) &&
    typeof (v as { toNumber?: unknown }).toNumber === "function"
  );
}

function normalize(value: unknown): unknown {
  if (isNeoInteger(value)) return (value as Integer).toNumber();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalize(v);
    }
    return out;
  }
  return value;
}

// ── Types ────────────────────────────────────────────────────────────

export type TraverseResult = {
  startNode: { labels: string[]; properties: Record<string, unknown> };
  connected: Array<{
    relationship: string;
    direction: "outgoing" | "incoming";
    node: { labels: string[]; properties: Record<string, unknown> };
  }>;
};

type NodeType =
  | "fact"
  | "review_item"
  | "meeting"
  | "clinician"
  | "treatment_option"
  | "drug";

// ── Start-node match fragments ───────────────────────────────────────

function startClause(
  nodeType: NodeType,
  needsPatient: boolean,
): string {
  if (needsPatient) {
    // Only "fact" is scoped to a specific patient via slug
    return `MATCH (p:Patient {slug: $slug})-[:HAS_FACT]->(start:Fact {key: $startNode})`;
  }
  switch (nodeType) {
    case "review_item":
      return `MATCH (start:ReviewItem) WHERE start.title = $startNode OR start.supabase_id = $startNode`;
    case "meeting":
      return `MATCH (start:Meeting) WHERE start.title CONTAINS $startNode`;
    case "clinician":
      return `MATCH (start:Clinician {name: $startNode})`;
    case "treatment_option":
      return `MATCH (start:TreatmentOption) WHERE start.name CONTAINS $startNode`;
    case "drug":
      return `MATCH (start:Drug {name: $startNode})`;
    default:
      // Shouldn't happen – covered above – but be safe
      return `MATCH (start) WHERE start.name = $startNode`;
  }
}

// ── Public API ───────────────────────────────────────────────────────

export async function traverseGraph(params: {
  patientSlug: string;
  startNode: string;
  nodeType: NodeType;
  direction?: "outgoing" | "incoming" | "both";
  maxDepth?: number;
}): Promise<TraverseResult> {
  const {
    patientSlug,
    startNode,
    nodeType,
    direction = "both",
    maxDepth: rawDepth = 2,
  } = params;

  const maxDepth = Math.max(1, Math.min(rawDepth, 4));
  const needsPatient = nodeType === "fact";

  // Build the direction-aware traversal fragment
  let traversalPattern: string;
  switch (direction) {
    case "outgoing":
      traversalPattern = `(start)-[r*1..${maxDepth}]->(connected)`;
      break;
    case "incoming":
      traversalPattern = `(start)<-[r*1..${maxDepth}]-(connected)`;
      break;
    default:
      traversalPattern = `(start)-[r*1..${maxDepth}]-(connected)`;
  }

  const cypher = `
    ${startClause(nodeType, needsPatient)}
    WITH start LIMIT 1
    OPTIONAL MATCH path = ${traversalPattern}
    WITH start,
         connected,
         relationships(path) AS pathRels,
         startNode(last(relationships(path))) AS relStart
    RETURN
      labels(start)          AS startLabels,
      properties(start)      AS startProps,
      CASE WHEN connected IS NOT NULL
        THEN collect({
          relationship: type(last(pathRels)),
          direction:    CASE WHEN relStart = start THEN 'outgoing' ELSE 'incoming' END,
          labels:       labels(connected),
          properties:   properties(connected)
        })
        ELSE []
      END AS connected
  `;

  const database = process.env.NEO4J_DATABASE || "neo4j";
  const driver = getDriver();
  const session = driver.session({
    database,
    defaultAccessMode: neo4j.session.READ,
  });

  try {
    const cypherParams: Record<string, unknown> = { startNode };
    if (needsPatient) cypherParams.slug = patientSlug;

    const result = await session.run(cypher, cypherParams);

    if (result.records.length === 0) {
      throw new Error(
        `No ${nodeType} node found matching "${startNode}"`,
      );
    }

    const record = result.records[0];

    const startLabels = record.get("startLabels") as string[];
    const startProps = normalize(
      record.get("startProps"),
    ) as Record<string, unknown>;

    const rawConnected = record.get("connected") as Array<{
      relationship: string;
      direction: string;
      labels: string[];
      properties: Record<string, unknown>;
    }>;

    // De-duplicate connected nodes (multiple paths can reach the same node)
    const seen = new Set<string>();
    const connected: TraverseResult["connected"] = [];

    for (const c of rawConnected) {
      // Use a composite key so the same node reached by different rels appears once per rel type
      const key = `${c.labels.join(",")}::${JSON.stringify(c.properties)}::${c.relationship}`;
      if (seen.has(key)) continue;
      seen.add(key);
      connected.push({
        relationship: c.relationship,
        direction: c.direction as "outgoing" | "incoming",
        node: {
          labels: c.labels,
          properties: normalize(c.properties) as Record<string, unknown>,
        },
      });
    }

    return {
      startNode: { labels: startLabels, properties: startProps },
      connected,
    };
  } finally {
    await session.close();
  }
}
