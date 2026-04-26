// ─────────────────────────────────────────────────────────────────────────
// mama_ca demo queries — paste into Neo4j Browser at the Aura instance
// ─────────────────────────────────────────────────────────────────────────

// 1. Inventory: nodes by label
MATCH (n) UNWIND labels(n) AS label
RETURN label, count(*) AS n ORDER BY n DESC;

// 2. Inventory: relationships by type
MATCH ()-[r]->() RETURN type(r) AS rel, count(*) AS n ORDER BY n DESC;

// 3. The patient at a glance — who, what diagnosis, what biomarkers
MATCH (p:Patient {mrn: "MBC-2026-0042"})-[:HAS_DIAGNOSIS]->(d:Diagnosis)-[:HAS_BIOMARKER]->(b:BiomarkerResult)
RETURN p, d, b;

// 4. Provenance trace — every Fact in the vault and which Document(s) it came from
MATCH (p:Patient {mrn: "MBC-2026-0042"})-[:HAS_FACT]->(f:Fact)-[:DERIVED_FROM]->(d:Document)
RETURN p, f, d ORDER BY f.phase, f.group LIMIT 100;

// 5. THE merge-conflict moment — Phase-1 cM0 vs Phase-2 cM1
MATCH (a:StageAssertion)-[:CONTRADICTS]->(b:StageAssertion)
RETURN a, b;

// 6. Same conflict at the granular Fact level
MATCH (a:Fact)-[:CONTRADICTS_FACT]->(b:Fact)
RETURN a, b;

// 7. Cascade fan-out — every artefact descended from the critical-results email
MATCH (root:Document:Email {doc_id: "20260424-115514.hartmann-m.882@ksz.ch"})
MATCH p = (root)<-[:CASCADED_FROM]-(downstream)
OPTIONAL MATCH (downstream)-[:CANCELS|UPDATES|SUPERSEDES_DOC]->(target)
RETURN root, downstream, target;

// 8. Operational chain that got invalidated — appointments + prior auths under the curative plan
MATCH (tp:TreatmentPlan {plan_id: "TP-curative"})-[:HAS_APPOINTMENT]->(a:Appointment)
OPTIONAL MATCH (a)-[:LINKED_TO_PA]->(pa:PriorAuth)
OPTIONAL MATCH (pa)<-[:UPDATES]-(e:CascadeEvent)
RETURN tp, a, pa, e;

// 9. Guideline grounding — what policy chunks justify each treatment plan
MATCH (tp:TreatmentPlan)-[:GUIDED_BY]->(target)
RETURN tp.name AS plan, tp.intent AS intent, labels(target)[0] AS targetType,
       coalesce(target.title, target.heading, target.pathway_id) AS reference;

// 10. Specialty layout — staff, departments, hospital
MATCH (s:Staff)-[:WORKS_IN]->(d:Department)-[:PART_OF]->(h:Hospital)
RETURN s, d, h;

// 11. Email chain ending in cancellation — author + recipients + cascade
MATCH (e:Document:Email {doc_id: "20260424-130218.schroeder-j.124@ksz.ch"})-[r]-(other)
RETURN e, r, other;

// 12. Pathway transition — KSZ-CP-BR-001 ↔ KSZ-CP-BR-002 with chunks visible
MATCH (a:ClinicalPathway)-[:TRANSITIONS_TO|TRANSITIONS_FROM]->(b:ClinicalPathway)
OPTIONAL MATCH (a)-[:HAS_CHUNK]->(ca:GuidelineChunk)
OPTIONAL MATCH (b)-[:HAS_CHUNK]->(cb:GuidelineChunk)
RETURN a, b, ca, cb LIMIT 80;

// 13. Tumour-marker context shift — same fact, different reading across phases
MATCH (m:TumourMarker {marker_id: "TM-CA15-3"})<-[:HAS_MARKER]-(e:Encounter)
MATCH (p:Patient)-[:HAS_ENCOUNTER]->(e)
MATCH (p)-[:STAGES]->(stg:StageAssertion)
RETURN m, e, p, stg;

// 14. Drug catalogue and which plan uses what
MATCH (tp:TreatmentPlan)-[r:CONTAINS_DRUG]->(drug:Drug)
RETURN tp, r, drug;

// 15. Full graph centred on the patient (cap to ~120 nodes)
MATCH (p:Patient {mrn: "MBC-2026-0042"})-[*1..2]-(n)
RETURN p, n LIMIT 120;
