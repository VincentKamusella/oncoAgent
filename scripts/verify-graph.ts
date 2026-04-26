import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import neo4j from "neo4j-driver";

const URI = process.env.NEO4J_URI!;
const USER = process.env.NEO4J_USERNAME!;
const PASS = process.env.NEO4J_PASSWORD!;
const DATABASE = process.env.NEO4J_DATABASE || "neo4j";

const checks: { name: string; cypher: string; expect: (rows: Record<string, unknown>[]) => string }[] = [
  {
    name: "Patient + biomarkers (Linda)",
    cypher: `MATCH (p:Patient {mrn: "MBC-2026-0042"})-[:HAS_DIAGNOSIS]->(:Diagnosis)-[:HAS_BIOMARKER]->(b)
             RETURN p.name AS patient, b.marker AS marker, b.value AS value
             ORDER BY b.marker`,
    expect: (rows) => `${rows.length} biomarkers (expected 5)`,
  },
  {
    name: "Stage contradiction",
    cypher: `MATCH (a:StageAssertion)-[:CONTRADICTS]->(b:StageAssertion)
             RETURN a.caption AS p2, b.caption AS p1`,
    expect: (rows) => rows.length === 1 ? `✓ ${rows[0].p2} → ${rows[0].p1}` : `✗ found ${rows.length} pairs`,
  },
  {
    name: "Fact-level contradictions",
    cypher: `MATCH (a:Fact)-[:CONTRADICTS_FACT]->(b:Fact)
             RETURN a.label AS p2, b.label AS p1`,
    expect: (rows) => `${rows.length} fact contradictions (expected 4)`,
  },
  {
    name: "Cascade chain from critical-results email",
    cypher: `MATCH p = (:Document:Email {doc_id: "20260424-115514.hartmann-m.882@ksz.ch"})<-[:CASCADED_FROM*]-(downstream)
             RETURN downstream.caption AS event, length(p) AS depth ORDER BY depth, event`,
    expect: (rows) => `${rows.length} downstream events`,
  },
  {
    name: "Plan supersession",
    cypher: `MATCH (n:TreatmentPlan)-[:SUPERSEDES]->(o:TreatmentPlan)
             RETURN n.name AS new_plan, o.name AS old_plan`,
    expect: (rows) => rows.length === 1 ? `✓ ${rows[0].new_plan} ⤳ ${rows[0].old_plan}` : `✗`,
  },
  {
    name: "Provenance: every Fact has at least one source Document",
    cypher: `MATCH (f:Fact) OPTIONAL MATCH (f)-[:DERIVED_FROM]->(d:Document)
             WITH f, count(d) AS sources
             RETURN sum(CASE WHEN sources = 0 THEN 1 ELSE 0 END) AS orphans, count(f) AS total`,
    expect: (rows) => `${rows[0].orphans} orphan facts / ${rows[0].total} total`,
  },
  {
    name: "Guideline grounding for the palliative plan",
    cypher: `MATCH (tp:TreatmentPlan {plan_id: "TP-palliative"})-[:GUIDED_BY]->(g)
             RETURN labels(g)[0] AS kind, coalesce(g.title, g.heading) AS ref`,
    expect: (rows) => `${rows.length} grounding edges`,
  },
  {
    name: "Email cascade — withdrawn PA traceable from root email",
    cypher: `MATCH path = (root:Document:Email {doc_id: "20260424-115514.hartmann-m.882@ksz.ch"})
             <-[:CASCADED_FROM]-(:CascadeEvent {event_id: "CE-WITHDRAW-PA"})-[:UPDATES]->(pa:PriorAuth)
             RETURN pa.pa_id AS pa, pa.status AS status`,
    expect: (rows) => rows.length === 1 ? `✓ ${rows[0].pa} (${rows[0].status})` : `✗ found ${rows.length}`,
  },
  {
    name: "Specialty layout — staff per department",
    cypher: `MATCH (s:Staff)-[:WORKS_IN]->(d:Department)
             RETURN d.name AS dept, count(s) AS staff_count ORDER BY staff_count DESC`,
    expect: (rows) => rows.map((r) => `${r.dept}=${r.staff_count}`).join(", "),
  },
  {
    name: "Total inventory",
    cypher: `MATCH (n) WITH count(n) AS nodes
             MATCH ()-[r]->() RETURN nodes, count(r) AS rels`,
    expect: (rows) => `${rows[0].nodes} nodes · ${rows[0].rels} relationships`,
  },
];

async function main() {
  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS));
  const session = driver.session({ database: DATABASE });
  try {
    for (const c of checks) {
      const res = await session.run(c.cypher);
      const rows = res.records.map((r) => Object.fromEntries(r.keys.map((k) => {
        const v = r.get(k);
        return [k as string, typeof v === "object" && v && "toNumber" in v ? (v as { toNumber: () => number }).toNumber() : v];
      })));
      console.log(`▶ ${c.name}\n  ${c.expect(rows)}`);
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
