import "server-only";

import neo4j, { type Driver, type Integer, type Session } from "neo4j-driver";

export type AuraNode = {
  id: string;
  labels: string[];
  caption: string;
  properties: Record<string, unknown>;
};

export type AuraRel = {
  id: string;
  from: string;
  to: string;
  type: string;
  properties: Record<string, unknown>;
};

export type AuraGraph = { nodes: AuraNode[]; rels: AuraRel[] };

type GlobalWithDriver = typeof globalThis & { __neo4jDriver?: Driver };
const g = globalThis as GlobalWithDriver;

function getDriver(): Driver {
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

function captionFor(labels: string[], props: Record<string, unknown>): string {
  const candidates = ["caption", "name", "label", "title"];
  for (const key of candidates) {
    const v = props[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return labels[0] ?? "Node";
}

export async function fetchPatientGraph(mrn: string): Promise<AuraGraph> {
  const database = process.env.NEO4J_DATABASE || "neo4j";
  const driver = getDriver();
  const session: Session = driver.session({
    database,
    defaultAccessMode: neo4j.session.READ,
  });

  try {
    const nodesRes = await session.run(
      `MATCH (p:Patient {mrn: $mrn})
       OPTIONAL MATCH (p)-[*1..2]-(n)
       WITH collect(DISTINCT p) + collect(DISTINCT n) AS xs
       UNWIND xs AS x
       WITH DISTINCT x WHERE x IS NOT NULL
       RETURN elementId(x) AS id,
              labels(x)    AS labels,
              properties(x) AS props`,
      { mrn },
    );

    const relsRes = await session.run(
      `MATCH (p:Patient {mrn: $mrn})-[r*1..2]-()
       UNWIND r AS rel
       WITH DISTINCT rel
       RETURN elementId(rel)              AS id,
              elementId(startNode(rel))   AS from,
              elementId(endNode(rel))     AS to,
              type(rel)                   AS type,
              properties(rel)             AS props`,
      { mrn },
    );

    const nodes: AuraNode[] = nodesRes.records.map((r) => {
      const labels = r.get("labels") as string[];
      const rawProps = r.get("props") as Record<string, unknown>;
      const properties = normalize(rawProps) as Record<string, unknown>;
      return {
        id: r.get("id") as string,
        labels,
        caption: captionFor(labels, properties),
        properties,
      };
    });

    const rels: AuraRel[] = relsRes.records.map((r) => ({
      id: r.get("id") as string,
      from: r.get("from") as string,
      to: r.get("to") as string,
      type: r.get("type") as string,
      properties: normalize(r.get("props")) as Record<string, unknown>,
    }));

    return { nodes, rels };
  } finally {
    await session.close();
  }
}
