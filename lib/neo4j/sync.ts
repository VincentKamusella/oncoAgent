import neo4j, { type Driver, type Session } from "neo4j-driver";

// ---------------------------------------------------------------------------
// Neo4j ↔ Supabase sync pipeline
// Reads all clinical data from Supabase and builds the knowledge graph in Neo4j.
// ---------------------------------------------------------------------------

// Re-use the same singleton driver pattern from client.ts
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

function getSession(mode: "READ" | "WRITE" = "WRITE"): Session {
  const database = process.env.NEO4J_DATABASE || "neo4j";
  return getDriver().session({
    database,
    defaultAccessMode:
      mode === "READ" ? neo4j.session.READ : neo4j.session.WRITE,
  });
}

// ---------------------------------------------------------------------------
// Supabase helper — lazy import to keep server-only
// ---------------------------------------------------------------------------

async function supabase() {
  const { createClient } = await import("@/lib/supabase/server");
  return createClient();
}

// ---------------------------------------------------------------------------
// B2: Clear graph
// ---------------------------------------------------------------------------

export async function clearGraph(): Promise<void> {
  const session = getSession("WRITE");
  try {
    await session.run("MATCH (n) DETACH DELETE n");
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// Helper: parse drug names from a regimen string
// E.g. "Docetaxel · carboplatin · trastuzumab · pertuzumab" → 4 names
// Also handles " + ", " / ", and ", " separators
// ---------------------------------------------------------------------------

function parseDrugs(regimen: string | null | undefined): string[] {
  if (!regimen) return [];

  // Split on common separators: " · ", " + ", " / ", ", "
  const parts = regimen.split(/\s*[·+/]\s*|\s*,\s*/);

  return parts
    .map((p) => {
      // Take the first word (the drug name), stripping dose info
      // e.g. "Docetaxel 75 mg/m²" → "Docetaxel"
      // But keep compound names like "5-FU"
      const trimmed = p.trim();
      if (!trimmed) return "";

      // If the string starts with dose-like patterns, skip
      if (/^[(\d]/.test(trimmed) && !/^5-/i.test(trimmed)) return "";

      // Extract just the drug name portion (before dose/schedule info)
      // Match word characters, hyphens, and specific patterns like "5-FU"
      const match = trimmed.match(
        /^([A-Za-z0-9][\w-]*(?:\s+[\w-]+)?)/,
      );
      if (!match) return "";

      let name = match[1].trim();

      // Remove trailing schedule/dose tokens
      name = name
        .replace(
          /\s+(?:q\d+w|mg|g|mcg|mg\/m²|AUC|Gy|daily|weekly|loading|×.*|to\b.*|in\b.*|for\b.*)$/i,
          "",
        )
        .trim();

      // Remove trailing numbers that are clearly doses
      name = name.replace(/\s+\d+$/, "").trim();

      return name;
    })
    .filter((n) => n.length > 0)
    // Deduplicate (case-insensitive)
    .filter((n, i, arr) => arr.findIndex((x) => x.toLowerCase() === n.toLowerCase()) === i);
}

// ---------------------------------------------------------------------------
// B3: Full sync
// ---------------------------------------------------------------------------

export type SyncResult = {
  cleared: boolean;
  nodes: Record<string, number>;
  relationships: Record<string, number>;
  duration_ms: number;
};

export async function syncAll(): Promise<SyncResult> {
  const start = Date.now();
  const counts = {
    nodes: {} as Record<string, number>,
    rels: {} as Record<string, number>,
  };

  // ── 1. Clear ──────────────────────────────────────────────────────────
  await clearGraph();

  // ── 2. Fetch all Supabase data in parallel ────────────────────────────
  const db = await supabase();

  const [
    { data: patients },
    { data: facts },
    { data: clinicians },
    { data: reviewItems },
    { data: reviewDeltas },
    { data: meetings },
    { data: meetingAttendees },
    { data: treatmentPhases },
    { data: treatmentOptions },
    { data: guidelineNodes },
    { data: guidelineEdges },
    { data: vaultAvatars },
    { data: patientGuidelines },
  ] = await Promise.all([
    db.from("patients").select("*"),
    db.from("facts").select("*"),
    db.from("clinicians").select("*"),
    db.from("review_items").select("*"),
    db.from("review_deltas").select("*"),
    db.from("meetings").select("*"),
    db.from("meeting_attendees").select("*"),
    db.from("treatment_phases").select("*"),
    db.from("treatment_options").select("*"),
    db.from("guideline_nodes").select("*"),
    db.from("guideline_edges").select("*"),
    db.from("vault_avatars").select("*"),
    db.from("patient_guidelines").select("*"),
  ]);

  const session = getSession("WRITE");

  try {
    // ── 3. Create all nodes ───────────────────────────────────────────────

    // ── Patient nodes ──
    if (patients?.length) {
      await session.run(
        `UNWIND $nodes AS n
         MERGE (x:Patient {supabase_id: n.supabase_id})
         SET x.slug = n.slug,
             x.name = n.name,
             x.mrn = n.mrn,
             x.cancer_type = n.cancer_type,
             x.cancer_label = n.cancer_label,
             x.status = n.status,
             x.staging = n.staging`,
        {
          nodes: patients.map((p) => ({
            supabase_id: p.id,
            slug: p.slug,
            name: p.name,
            mrn: p.mrn,
            cancer_type: p.cancer_type,
            cancer_label: p.cancer_label,
            status: p.status,
            staging: p.staging,
          })),
        },
      );
      counts.nodes["Patient"] = patients.length;
    }

    // ── Fact nodes ──
    if (facts?.length) {
      await session.run(
        `UNWIND $nodes AS n
         MERGE (x:Fact {supabase_id: n.supabase_id})
         SET x.key = n.key,
             x.label = n.label,
             x.value = n.value,
             x.\`group\` = n.group,
             x.specialty = n.specialty,
             x.confidence = n.confidence,
             x.patient_id = n.patient_id,
             x.source_id = n.source_id,
             x.source_label = n.source_label,
             x.source_author = n.source_author,
             x.source_kind = n.source_kind,
             x.updated_at = n.updated_at`,
        {
          nodes: facts.map((f) => ({
            supabase_id: f.id,
            key: f.key,
            label: f.label,
            value: f.value,
            group: f.group,
            specialty: f.specialty ?? null,
            confidence: typeof f.confidence === "number" ? f.confidence : parseFloat(f.confidence) || 1.0,
            patient_id: f.patient_id,
            source_id: f.source_id ?? null,
            source_label: f.source_label ?? null,
            source_author: f.source_author ?? null,
            source_kind: f.source_kind ?? null,
            updated_at: f.updated_at ?? null,
          })),
        },
      );
      counts.nodes["Fact"] = facts.length;
    }

    // ── Clinician nodes ──
    if (clinicians?.length) {
      await session.run(
        `UNWIND $nodes AS n
         MERGE (x:Clinician {supabase_id: n.supabase_id})
         SET x.name = n.name,
             x.role = n.role,
             x.specialty = n.specialty,
             x.initials = n.initials`,
        {
          nodes: clinicians.map((c) => ({
            supabase_id: c.id,
            name: c.name,
            role: c.role,
            specialty: c.specialty ?? null,
            initials: c.initials,
          })),
        },
      );
      counts.nodes["Clinician"] = clinicians.length;
    }

    // ── ReviewItem nodes ──
    if (reviewItems?.length) {
      await session.run(
        `UNWIND $nodes AS n
         MERGE (x:ReviewItem {supabase_id: n.supabase_id})
         SET x.title = n.title,
             x.status = n.status,
             x.summary = n.summary,
             x.agent_verdict = n.agent_verdict,
             x.opened_at = n.opened_at,
             x.author_name = n.author_name,
             x.author_role = n.author_role,
             x.patient_id = n.patient_id`,
        {
          nodes: reviewItems.map((r) => ({
            supabase_id: r.id,
            title: r.title,
            status: r.status,
            summary: r.summary ?? null,
            agent_verdict: r.agent_verdict ?? null,
            opened_at: r.opened_at ?? null,
            author_name: r.author_name,
            author_role: r.author_role,
            patient_id: r.patient_id,
          })),
        },
      );
      counts.nodes["ReviewItem"] = reviewItems.length;
    }

    // ── Meeting nodes ──
    if (meetings?.length) {
      await session.run(
        `UNWIND $nodes AS n
         MERGE (x:Meeting {supabase_id: n.supabase_id})
         SET x.title = n.title,
             x.date = n.date,
             x.status = n.status,
             x.summary = n.summary,
             x.patient_id = n.patient_id`,
        {
          nodes: meetings.map((m) => ({
            supabase_id: m.id,
            title: m.title,
            date: m.date,
            status: m.status,
            summary: m.summary ?? null,
            patient_id: m.patient_id,
          })),
        },
      );
      counts.nodes["Meeting"] = meetings.length;
    }

    // ── TreatmentPhase nodes (active plan only: option_id IS NULL) ──
    const activePlanPhases = treatmentPhases?.filter((tp) => tp.option_id == null) ?? [];
    if (activePlanPhases.length) {
      await session.run(
        `UNWIND $nodes AS n
         MERGE (x:TreatmentPhase {supabase_id: n.supabase_id})
         SET x.name = n.name,
             x.type = n.type,
             x.status = n.status,
             x.regimen = n.regimen,
             x.start_date = n.start_date,
             x.patient_id = n.patient_id`,
        {
          nodes: activePlanPhases.map((tp) => ({
            supabase_id: tp.id,
            name: tp.name,
            type: tp.type,
            status: tp.status,
            regimen: tp.regimen ?? null,
            start_date: tp.start_date ?? null,
            patient_id: tp.patient_id,
          })),
        },
      );
      counts.nodes["TreatmentPhase"] = activePlanPhases.length;
    }

    // ── TreatmentOption nodes ──
    if (treatmentOptions?.length) {
      await session.run(
        `UNWIND $nodes AS n
         MERGE (x:TreatmentOption {supabase_id: n.supabase_id})
         SET x.name = n.name,
             x.intent = n.intent,
             x.short_label = n.short_label,
             x.patient_id = n.patient_id`,
        {
          nodes: treatmentOptions.map((to) => ({
            supabase_id: to.id,
            name: to.name,
            intent: to.intent,
            short_label: to.short_label,
            patient_id: to.patient_id,
          })),
        },
      );
      counts.nodes["TreatmentOption"] = treatmentOptions.length;
    }

    // ── GuidelineNode nodes ──
    if (guidelineNodes?.length) {
      await session.run(
        `UNWIND $nodes AS n
         MERGE (x:GuidelineNode {supabase_id: n.supabase_id})
         SET x.node_key = n.node_key,
             x.label = n.label,
             x.kind = n.kind,
             x.patient_path = n.patient_path,
             x.fact_key = n.fact_key,
             x.guideline_id = n.guideline_id`,
        {
          nodes: guidelineNodes.map((gn) => ({
            supabase_id: gn.id,
            node_key: gn.node_key,
            label: gn.label,
            kind: gn.kind,
            patient_path: gn.patient_path ?? false,
            fact_key: gn.fact_key ?? null,
            guideline_id: gn.guideline_id,
          })),
        },
      );
      counts.nodes["GuidelineNode"] = guidelineNodes.length;
    }

    // ── Drug nodes (extracted from regimen strings) ──
    const allDrugNames = new Set<string>();
    for (const phase of activePlanPhases) {
      for (const drug of parseDrugs(phase.regimen)) {
        allDrugNames.add(drug);
      }
    }
    if (allDrugNames.size > 0) {
      await session.run(
        `UNWIND $drugs AS d
         MERGE (x:Drug {name: d.name})`,
        { drugs: Array.from(allDrugNames).map((name) => ({ name })) },
      );
      counts.nodes["Drug"] = allDrugNames.size;
    }

    // ── Document nodes (extracted from unique source_id/source_label pairs on facts) ──
    const docMap = new Map<string, { source_id: string; label: string; kind: string | null; author: string | null; date: string | null }>();
    for (const f of facts ?? []) {
      if (f.source_id) {
        if (!docMap.has(f.source_id)) {
          docMap.set(f.source_id, {
            source_id: f.source_id,
            label: f.source_label ?? f.source_id,
            kind: f.source_kind ?? null,
            author: f.source_author ?? null,
            date: f.source_at ?? null,
          });
        }
      }
    }
    if (docMap.size > 0) {
      await session.run(
        `UNWIND $docs AS d
         MERGE (x:Document {source_id: d.source_id})
         SET x.label = d.label,
             x.kind = d.kind,
             x.author = d.author,
             x.date = d.date`,
        { docs: Array.from(docMap.values()) },
      );
      counts.nodes["Document"] = docMap.size;
    }

    // ── 4. Create all relationships ─────────────────────────────────────

    // ── (Patient)-[:HAS_FACT]->(Fact) ──
    if (facts?.length) {
      await session.run(
        `UNWIND $rels AS r
         MATCH (p:Patient {supabase_id: r.patient_id})
         MATCH (f:Fact {supabase_id: r.fact_id})
         MERGE (p)-[:HAS_FACT]->(f)`,
        {
          rels: facts.map((f) => ({
            patient_id: f.patient_id,
            fact_id: f.id,
          })),
        },
      );
      counts.rels["HAS_FACT"] = facts.length;
    }

    // ── (Patient)-[:ON_PLAN]->(TreatmentPhase) ──
    if (activePlanPhases.length) {
      await session.run(
        `UNWIND $rels AS r
         MATCH (p:Patient {supabase_id: r.patient_id})
         MATCH (tp:TreatmentPhase {supabase_id: r.phase_id})
         MERGE (p)-[:ON_PLAN]->(tp)`,
        {
          rels: activePlanPhases.map((tp) => ({
            patient_id: tp.patient_id,
            phase_id: tp.id,
          })),
        },
      );
      counts.rels["ON_PLAN"] = activePlanPhases.length;
    }

    // ── (Patient)-[:HAS_OPTION]->(TreatmentOption) ──
    if (treatmentOptions?.length) {
      await session.run(
        `UNWIND $rels AS r
         MATCH (p:Patient {supabase_id: r.patient_id})
         MATCH (o:TreatmentOption {supabase_id: r.option_id})
         MERGE (p)-[:HAS_OPTION]->(o)`,
        {
          rels: treatmentOptions.map((to) => ({
            patient_id: to.patient_id,
            option_id: to.id,
          })),
        },
      );
      counts.rels["HAS_OPTION"] = treatmentOptions.length;
    }

    // ── (Fact)-[:DERIVED_FROM]->(Document) ──
    const factDocRels = (facts ?? []).filter((f) => f.source_id);
    if (factDocRels.length) {
      await session.run(
        `UNWIND $rels AS r
         MATCH (f:Fact {supabase_id: r.fact_id})
         MATCH (d:Document {source_id: r.source_id})
         MERGE (f)-[:DERIVED_FROM]->(d)`,
        {
          rels: factDocRels.map((f) => ({
            fact_id: f.id,
            source_id: f.source_id,
          })),
        },
      );
      counts.rels["DERIVED_FROM"] = factDocRels.length;
    }

    // ── (Document)-[:AUTHORED_BY]->(Clinician) ──
    // Match source_author on documents to clinician names
    if (docMap.size > 0 && clinicians?.length) {
      const docAuthorRels: { source_id: string; clinician_id: string }[] = [];
      for (const doc of docMap.values()) {
        if (!doc.author) continue;
        const authorLower = doc.author.toLowerCase();
        for (const c of clinicians) {
          if (authorLower.includes(c.name.toLowerCase())) {
            docAuthorRels.push({
              source_id: doc.source_id,
              clinician_id: c.id,
            });
            break;
          }
        }
      }
      if (docAuthorRels.length) {
        await session.run(
          `UNWIND $rels AS r
           MATCH (d:Document {source_id: r.source_id})
           MATCH (c:Clinician {supabase_id: r.clinician_id})
           MERGE (d)-[:AUTHORED_BY]->(c)`,
          { rels: docAuthorRels },
        );
        counts.rels["AUTHORED_BY_DOC"] = docAuthorRels.length;
      }
    }

    // ── (ReviewItem)-[:PROPOSES_CHANGE_TO]->(Fact) ──
    if (reviewDeltas?.length && reviewItems?.length && facts?.length) {
      const proposeRels: { review_id: string; fact_id: string }[] = [];

      for (const delta of reviewDeltas) {
        const ri = reviewItems.find((r) => r.id === delta.review_item_id);
        if (!ri) continue;

        // Find the fact with matching key for this patient
        const matchingFact = facts.find(
          (f) => f.patient_id === ri.patient_id && f.key === delta.fact_key,
        );
        if (matchingFact) {
          proposeRels.push({
            review_id: ri.id,
            fact_id: matchingFact.id,
          });
        }
      }

      if (proposeRels.length) {
        await session.run(
          `UNWIND $rels AS r
           MATCH (ri:ReviewItem {supabase_id: r.review_id})
           MATCH (f:Fact {supabase_id: r.fact_id})
           MERGE (ri)-[:PROPOSES_CHANGE_TO]->(f)`,
          { rels: proposeRels },
        );
        counts.rels["PROPOSES_CHANGE_TO"] = proposeRels.length;
      }
    }

    // ── (ReviewItem)-[:AUTHORED_BY]->(Clinician) ──
    if (reviewItems?.length && clinicians?.length) {
      const riAuthorRels: { review_id: string; clinician_id: string }[] = [];
      for (const ri of reviewItems) {
        if (!ri.author_name) continue;
        const authorLower = ri.author_name.toLowerCase();
        for (const c of clinicians) {
          if (authorLower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(authorLower)) {
            riAuthorRels.push({
              review_id: ri.id,
              clinician_id: c.id,
            });
            break;
          }
        }
      }
      if (riAuthorRels.length) {
        await session.run(
          `UNWIND $rels AS r
           MATCH (ri:ReviewItem {supabase_id: r.review_id})
           MATCH (c:Clinician {supabase_id: r.clinician_id})
           MERGE (ri)-[:AUTHORED_BY]->(c)`,
          { rels: riAuthorRels },
        );
        counts.rels["AUTHORED_BY_RI"] = riAuthorRels.length;
      }
    }

    // ── (Clinician)-[:TREATS]->(Patient) via vault_avatars ──
    if (vaultAvatars?.length && clinicians?.length && patients?.length) {
      const treatsRels: { clinician_id: string; patient_id: string }[] = [];
      for (const va of vaultAvatars) {
        const clinician = clinicians.find(
          (c) => c.initials === va.initials,
        );
        if (clinician) {
          treatsRels.push({
            clinician_id: clinician.id,
            patient_id: va.patient_id,
          });
        }
      }
      if (treatsRels.length) {
        await session.run(
          `UNWIND $rels AS r
           MATCH (c:Clinician {supabase_id: r.clinician_id})
           MATCH (p:Patient {supabase_id: r.patient_id})
           MERGE (c)-[:TREATS]->(p)`,
          { rels: treatsRels },
        );
        counts.rels["TREATS"] = treatsRels.length;
      }
    }

    // ── (Clinician)-[:ATTENDED]->(Meeting) via meeting_attendees ──
    if (meetingAttendees?.length && clinicians?.length && meetings?.length) {
      const attendedRels: { clinician_id: string; meeting_id: string }[] = [];
      for (const ma of meetingAttendees) {
        const nameLower = ma.name.toLowerCase();
        const clinician = clinicians.find(
          (c) => c.name.toLowerCase() === nameLower,
        );
        if (clinician) {
          attendedRels.push({
            clinician_id: clinician.id,
            meeting_id: ma.meeting_id,
          });
        }
      }
      if (attendedRels.length) {
        await session.run(
          `UNWIND $rels AS r
           MATCH (c:Clinician {supabase_id: r.clinician_id})
           MATCH (m:Meeting {supabase_id: r.meeting_id})
           MERGE (c)-[:ATTENDED]->(m)`,
          { rels: attendedRels },
        );
        counts.rels["ATTENDED"] = attendedRels.length;
      }
    }

    // ── (TreatmentOption)-[:SUPPORTED_BY]->(Fact) ──
    // rationale_fact_ids are symbolic IDs like "f-mk-receptors" — try to match
    // them to facts by pattern (the symbolic IDs hint at fact keys)
    if (treatmentOptions?.length && facts?.length) {
      const supportedByRels: { option_id: string; fact_id: string }[] = [];

      // Build a map of symbolic ID patterns to facts
      // e.g. "f-mk-receptors" → patient MK, key contains "receptors"
      for (const to of treatmentOptions) {
        const rationaleFacts: string[] =
          Array.isArray(to.rationale_fact_ids)
            ? to.rationale_fact_ids
            : typeof to.rationale_fact_ids === "string"
              ? JSON.parse(to.rationale_fact_ids as string)
              : [];

        for (const symbolicId of rationaleFacts) {
          if (!symbolicId || typeof symbolicId !== "string") continue;

          // Parse symbolic ID: "f-mk-receptors" → slug hint "mk", key hint "receptors"
          const parts = symbolicId.replace(/^f-/, "").split("-");
          // First part is patient slug hint, rest is key hint
          const keyHint = parts.slice(1).join(".");

          // Find matching fact for this patient
          const matchingFact = facts.find((f) => {
            if (f.patient_id !== to.patient_id) return false;
            const keyLower = f.key.toLowerCase();
            const hintLower = keyHint.toLowerCase();
            // Try exact key match, partial match, or label match
            return (
              keyLower.includes(hintLower) ||
              hintLower.includes(keyLower.split(".").pop() ?? "") ||
              f.label.toLowerCase().includes(hintLower)
            );
          });

          if (matchingFact) {
            supportedByRels.push({
              option_id: to.id,
              fact_id: matchingFact.id,
            });
          }
        }
      }

      if (supportedByRels.length) {
        await session.run(
          `UNWIND $rels AS r
           MATCH (o:TreatmentOption {supabase_id: r.option_id})
           MATCH (f:Fact {supabase_id: r.fact_id})
           MERGE (o)-[:SUPPORTED_BY]->(f)`,
          { rels: supportedByRels },
        );
        counts.rels["SUPPORTED_BY"] = supportedByRels.length;
      }
    }

    // ── (GuidelineNode)-[:LEADS_TO]->(GuidelineNode) ──
    if (guidelineEdges?.length && guidelineNodes?.length) {
      // Build a lookup from (guideline_id, node_key) → guideline_node id
      const gnLookup = new Map<string, string>();
      for (const gn of guidelineNodes) {
        gnLookup.set(`${gn.guideline_id}:${gn.node_key}`, gn.id);
      }

      const leadsToRels: { from_id: string; to_id: string; label: string | null; patient_path: boolean }[] = [];
      for (const edge of guidelineEdges) {
        const fromId = gnLookup.get(`${edge.guideline_id}:${edge.source_node_key}`);
        const toId = gnLookup.get(`${edge.guideline_id}:${edge.target_node_key}`);
        if (fromId && toId) {
          leadsToRels.push({
            from_id: fromId,
            to_id: toId,
            label: edge.label ?? null,
            patient_path: edge.patient_path ?? false,
          });
        }
      }

      if (leadsToRels.length) {
        await session.run(
          `UNWIND $rels AS r
           MATCH (a:GuidelineNode {supabase_id: r.from_id})
           MATCH (b:GuidelineNode {supabase_id: r.to_id})
           MERGE (a)-[rel:LEADS_TO]->(b)
           SET rel.label = r.label,
               rel.patient_path = r.patient_path`,
          { rels: leadsToRels },
        );
        counts.rels["LEADS_TO"] = leadsToRels.length;
      }
    }

    // ── (Fact)-[:MAPS_TO]->(GuidelineNode) ──
    // Match fact.key to guideline_nodes.fact_key for the same patient's guideline
    if (facts?.length && guidelineNodes?.length && patientGuidelines?.length) {
      const mapsToRels: { fact_id: string; gn_id: string }[] = [];

      // Build patient → guideline_id mapping
      const patientGuidelineMap = new Map<string, string[]>();
      for (const pg of patientGuidelines) {
        const existing = patientGuidelineMap.get(pg.patient_id) ?? [];
        existing.push(pg.guideline_id);
        patientGuidelineMap.set(pg.patient_id, existing);
      }

      for (const f of facts) {
        const guidelineIds = patientGuidelineMap.get(f.patient_id);
        if (!guidelineIds) continue;

        for (const gn of guidelineNodes) {
          if (!gn.fact_key) continue;
          if (gn.fact_key !== f.key) continue;
          if (!guidelineIds.includes(gn.guideline_id)) continue;

          mapsToRels.push({
            fact_id: f.id,
            gn_id: gn.id,
          });
        }
      }

      if (mapsToRels.length) {
        await session.run(
          `UNWIND $rels AS r
           MATCH (f:Fact {supabase_id: r.fact_id})
           MATCH (gn:GuidelineNode {supabase_id: r.gn_id})
           MERGE (f)-[:MAPS_TO]->(gn)`,
          { rels: mapsToRels },
        );
        counts.rels["MAPS_TO"] = mapsToRels.length;
      }
    }

    // ── (TreatmentPhase)-[:USES_DRUG]->(Drug) ──
    if (activePlanPhases.length && allDrugNames.size > 0) {
      const drugRels: { phase_id: string; drug_name: string }[] = [];
      for (const phase of activePlanPhases) {
        for (const drug of parseDrugs(phase.regimen)) {
          drugRels.push({
            phase_id: phase.id,
            drug_name: drug,
          });
        }
      }

      if (drugRels.length) {
        await session.run(
          `UNWIND $rels AS r
           MATCH (tp:TreatmentPhase {supabase_id: r.phase_id})
           MATCH (d:Drug {name: r.drug_name})
           MERGE (tp)-[:USES_DRUG]->(d)`,
          { rels: drugRels },
        );
        counts.rels["USES_DRUG"] = drugRels.length;
      }
    }

    // ── Version control: SUPERSEDES and CONTRADICTS ──
    // In the current data model, (patient_id, key) is unique on the facts table,
    // so version changes are tracked through review_deltas (before_value → after_value).
    //
    // Thomas has staging.clinical going from cT3 to cT4a — this is represented by
    // ReviewItem #1 (status: "conflict") with a delta on staging.clinical.
    //
    // For merged review items: the fact was already updated (the new value is the
    // current fact). The delta records the supersession.
    // For conflict/open items: the proposed change is pending (PROPOSES_CHANGE_TO
    // already captures this).
    //
    // We create SUPERSEDES on facts where a merged review delta changed the value,
    // and CONTRADICTS for staging-group changes (any group where a value conflict
    // materially changes clinical meaning).
    if (reviewDeltas?.length && reviewItems?.length && facts?.length) {
      // Find merged deltas that changed a fact's value
      const versionRels: { fact_id: string; group: string }[] = [];

      for (const delta of reviewDeltas) {
        if (!delta.before_value || delta.before_value === delta.after_value) continue;

        const ri = reviewItems.find((r) => r.id === delta.review_item_id);
        if (!ri) continue;

        // Only merged review items represent applied supersessions
        if (ri.status !== "merged") continue;

        const matchingFact = facts.find(
          (f) => f.patient_id === ri.patient_id && f.key === delta.fact_key,
        );
        if (!matchingFact) continue;

        versionRels.push({
          fact_id: matchingFact.id,
          group: matchingFact.group ?? "",
        });
      }

      // Deduplicate by fact_id
      const uniqueVersionRels = versionRels.filter(
        (r, i, arr) => arr.findIndex((x) => x.fact_id === r.fact_id) === i,
      );

      if (uniqueVersionRels.length) {
        // SUPERSEDES: self-referential relationship recording that the fact's
        // current value replaced a prior value (the old value is on the delta)
        await session.run(
          `UNWIND $rels AS r
           MATCH (f:Fact {supabase_id: r.fact_id})
           MERGE (f)-[rel:SUPERSEDES {source: 'review_delta'}]->(f)`,
          { rels: uniqueVersionRels },
        );
        counts.rels["SUPERSEDES"] = uniqueVersionRels.length;

        // CONTRADICTS: staging/diagnosis changes where values materially differ
        const contradictionGroups = ["staging", "diagnosis"];
        const contradictions = uniqueVersionRels.filter((r) =>
          contradictionGroups.includes(r.group),
        );
        if (contradictions.length) {
          await session.run(
            `UNWIND $rels AS r
             MATCH (f:Fact {supabase_id: r.fact_id})
             MERGE (f)-[rel:CONTRADICTS {source: 'review_delta'}]->(f)`,
            { rels: contradictions },
          );
          counts.rels["CONTRADICTS"] = contradictions.length;
        }
      }
    }
  } finally {
    await session.close();
  }

  return {
    cleared: true,
    nodes: counts.nodes,
    relationships: counts.rels,
    duration_ms: Date.now() - start,
  };
}
