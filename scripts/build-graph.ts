/**
 * scripts/build-graph.ts
 *
 * Wipe-and-rebuild the Neo4j Aura graph from the mama_ca/ context base.
 * Reads CSV/JSON/JSONL/EML/Markdown/PDF artefacts at ~/Desktop/onco_data/mama_ca/
 * and emits ~210 nodes and ~500 relationships across ~15 node labels.
 *
 * Run:   npx tsx scripts/build-graph.ts
 */
import { config as dotenvConfig } from "dotenv";
// Next.js convention — credentials live in .env.local at the project root
dotenvConfig({ path: ".env.local" });
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";
import neo4j, { Driver } from "neo4j-driver";

import {
  parseEml,
  parseJsonl,
  parseCsvFile,
  parseMarkdownDoc,
  chunkMarkdownByH2,
  chunkNccnText,
  type Email,
} from "./lib/parse";
import {
  withSession,
  batchUnwind,
  runWrite,
} from "./lib/cypher";

// ────────────────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────────────────
const DATA_ROOT = "/Users/nilsreuter/Desktop/onco_data/mama_ca";

const env = (k: string, fallback?: string): string => {
  const v = process.env[k] ?? fallback;
  if (!v) throw new Error(`Missing env var ${k}`);
  return v;
};

const URI = env("NEO4J_URI");
const USER = env("NEO4J_USERNAME");
const PASS = env("NEO4J_PASSWORD");
const DATABASE = env("NEO4J_DATABASE", "neo4j");

const PATIENT_MRN = "MBC-2026-0042";
const HOSPITAL_NAME = "Kantonsspital Zürich";
const CASCADE_ROOT_MSGID = "20260424-115514.hartmann-m.882@ksz.ch";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function relPath(absPath: string): string {
  return relative(DATA_ROOT, absPath);
}

function listFiles(dir: string, ext: string): string[] {
  try {
    return readdirSync(dir)
      .filter((n) => n.endsWith(ext))
      .map((n) => join(dir, n))
      .sort();
  } catch {
    return [];
  }
}

function readJson<T = unknown>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function emailLocalPart(email: string): string {
  return email.split("@")[0]?.toLowerCase() ?? email;
}

// ────────────────────────────────────────────────────────────────────────────
// Source-of-truth case data (mirrors mama_ca/.build/case.json)
// ────────────────────────────────────────────────────────────────────────────
type Case = {
  patient: { name: string; dob: string; age: number; sex: string; mrn: string; menopausal_status: string };
  tumour: {
    site: string; quadrant: string; size_mm: number; histology: string;
    nottingham: { tubules: number; nuclei: number; mitoses: number; total: number; grade: number };
    ihc: { er: string; pr: string; her2_ihc: string; ki67: string };
    her2_fish: { ratio: number; her2_copy: number; result: string };
    axillary_nodes: string;
  };
  staging_phase1: { ct: string; cn: string; cm: string; overall: string };
  staging_phase2: { ct: string; cn: string; cm: string; overall: string };
  ngs: {
    panel: string;
    reportable: { gene: string; alteration: string; vaf: string; type: string; actionable: string }[];
    tmb: string; msi: string; hrd: string;
  };
  labs: {
    cbc: Record<string, string>; cmp: Record<string, string>;
    tumour_markers: Record<string, string>; lvef: string;
  };
  treatment: { phase1_plan: string[]; phase2_plan: string[] };
  physicians: Record<string, string>;
  dates: Record<string, string>;
};

const CASE: Case = readJson(join(DATA_ROOT, ".build/case.json"));

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`▶ Connecting to ${URI} as ${USER}…`);
  const driver: Driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS));
  try {
    const info = await driver.getServerInfo();
    console.log(`  ✓ ${info.protocolVersion ? `Bolt ${info.protocolVersion}` : "connected"} · ${info.address}`);
  } catch (err) {
    console.error("  ✗ Failed to authenticate", err);
    await driver.close();
    process.exit(1);
  }

  await withSession(driver, DATABASE, async (s) => {
    console.log("▶ Wiping target database…");
    await runWrite(s, "MATCH (n) DETACH DELETE n");

    console.log("▶ Creating constraints…");
    const constraints = [
      "CREATE CONSTRAINT u_patient_mrn IF NOT EXISTS FOR (n:Patient) REQUIRE n.mrn IS UNIQUE",
      "CREATE CONSTRAINT u_staff_id IF NOT EXISTS FOR (n:Staff) REQUIRE n.staff_id IS UNIQUE",
      "CREATE CONSTRAINT u_dept_name IF NOT EXISTS FOR (n:Department) REQUIRE n.name IS UNIQUE",
      "CREATE CONSTRAINT u_hospital_name IF NOT EXISTS FOR (n:Hospital) REQUIRE n.name IS UNIQUE",
      "CREATE CONSTRAINT u_doc_id IF NOT EXISTS FOR (n:Document) REQUIRE n.doc_id IS UNIQUE",
      "CREATE CONSTRAINT u_drug_code IF NOT EXISTS FOR (n:Drug) REQUIRE n.drug_code IS UNIQUE",
      "CREATE CONSTRAINT u_pathway_id IF NOT EXISTS FOR (n:ClinicalPathway) REQUIRE n.pathway_id IS UNIQUE",
      "CREATE CONSTRAINT u_chunk_id IF NOT EXISTS FOR (n:GuidelineChunk) REQUIRE n.chunk_id IS UNIQUE",
      "CREATE CONSTRAINT u_enc_id IF NOT EXISTS FOR (n:Encounter) REQUIRE n.encounter_id IS UNIQUE",
      "CREATE CONSTRAINT u_pa_id IF NOT EXISTS FOR (n:PriorAuth) REQUIRE n.pa_id IS UNIQUE",
      "CREATE CONSTRAINT u_app_id IF NOT EXISTS FOR (n:Appointment) REQUIRE n.appointment_id IS UNIQUE",
      "CREATE CONSTRAINT u_fact_id IF NOT EXISTS FOR (n:Fact) REQUIRE n.fact_id IS UNIQUE",
      "CREATE CONSTRAINT u_chat_id IF NOT EXISTS FOR (n:ChatMessage) REQUIRE n.message_id IS UNIQUE",
      "CREATE CONSTRAINT u_event_id IF NOT EXISTS FOR (n:CascadeEvent) REQUIRE n.event_id IS UNIQUE",
      "CREATE CONSTRAINT u_dx_id IF NOT EXISTS FOR (n:Diagnosis) REQUIRE n.diagnosis_id IS UNIQUE",
      "CREATE CONSTRAINT u_biomarker_id IF NOT EXISTS FOR (n:BiomarkerResult) REQUIRE n.biomarker_id IS UNIQUE",
      "CREATE CONSTRAINT u_alt_id IF NOT EXISTS FOR (n:GenomicAlteration) REQUIRE n.alt_id IS UNIQUE",
      "CREATE CONSTRAINT u_finding_id IF NOT EXISTS FOR (n:ImagingFinding) REQUIRE n.finding_id IS UNIQUE",
      "CREATE CONSTRAINT u_lab_id IF NOT EXISTS FOR (n:LabResult) REQUIRE n.lab_id IS UNIQUE",
      "CREATE CONSTRAINT u_marker_id IF NOT EXISTS FOR (n:TumourMarker) REQUIRE n.marker_id IS UNIQUE",
      "CREATE CONSTRAINT u_problem_id IF NOT EXISTS FOR (n:Condition) REQUIRE n.problem_id IS UNIQUE",
      "CREATE CONSTRAINT u_stage_id IF NOT EXISTS FOR (n:StageAssertion) REQUIRE n.stage_id IS UNIQUE",
      "CREATE CONSTRAINT u_plan_id IF NOT EXISTS FOR (n:TreatmentPlan) REQUIRE n.plan_id IS UNIQUE",
    ];
    for (const c of constraints) await runWrite(s, c);

    // ── 1. Hospital + Departments ───────────────────────────────────────────
    console.log("▶ Hospital + Departments");
    await runWrite(
      s,
      `MERGE (h:Hospital {name: $name}) SET h.caption = $name, h.address = $addr`,
      { name: HOSPITAL_NAME, addr: "Rämistrasse 100, 8091 Zürich, Switzerland" }
    );

    const departments = [
      "Oncology", "Pathology", "Radiology", "Laboratory Medicine",
      "Cardiology", "Surgery", "Radiation Oncology", "Pharmacy",
      "Medical Genetics", "Operations",
    ];
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MERGE (d:Department {name: r.name}) SET d.caption = r.name
       WITH d MATCH (h:Hospital {name: $hospital}) MERGE (d)-[:PART_OF]->(h)`,
      departments.map((name) => ({ name })),
      { hospital: HOSPITAL_NAME }
    );

    // ── 2. Staff (HR directory) ─────────────────────────────────────────────
    console.log("▶ Staff (directory CSV)");
    type Staff = {
      staff_id: string; name: string; title: string; specialty: string;
      subspecialty: string; department: string; email: string; phone_ext: string;
      office: string; oncall_pager: string; fte: string; hire_date: string; active: string;
    };
    const staff = parseCsvFile<Staff>(join(DATA_ROOT, "enterprise/directory/physicians.csv"));
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MERGE (s:Staff {staff_id: r.staff_id})
       SET s.name = r.name, s.title = r.title, s.specialty = r.specialty,
           s.subspecialty = r.subspecialty, s.department = r.department,
           s.email = r.email, s.phone_ext = r.phone_ext, s.office = r.office,
           s.fte = toFloat(r.fte), s.hire_date = r.hire_date, s.active = (r.active = "true"),
           s.caption = r.name + " · " + r.specialty
       WITH s, r
       MATCH (d:Department {name: r.department})
       MERGE (s)-[:WORKS_IN]->(d)`,
      staff.map((s) => ({
        ...s,
        // External staff (FMI) maps to the Genomics Department
        department: s.department === "External - Foundation Medicine" ? "Medical Genetics" : s.department,
      }))
    );

    // Build email→staff_id map
    const emailToStaff = new Map<string, string>();
    for (const x of staff) {
      emailToStaff.set(x.email.toLowerCase(), x.staff_id);
      // Also add the local part for chat lookup
      emailToStaff.set(emailLocalPart(x.email), x.staff_id);
    }
    // External GP not in directory but referenced in emails — create a stub
    await runWrite(
      s,
      `MERGE (s:Staff:External {staff_id: $id})
       SET s.name = $name, s.title = $title, s.specialty = $specialty,
           s.email = $email, s.department = $dept,
           s.caption = $name + " · " + $specialty`,
      {
        id: "EXT-STÄHLI", name: "Stähli M.", title: "MD", specialty: "Family Medicine",
        email: "m.staehli@hausarzt-zh.ch", dept: "External",
      }
    );
    emailToStaff.set("m.staehli@hausarzt-zh.ch", "EXT-STÄHLI");
    emailToStaff.set("m.staehli", "EXT-STÄHLI");

    // ── 3. Patients (5 from registry) ───────────────────────────────────────
    console.log("▶ Patients (CRM master)");
    type PatientRow = {
      mrn: string; family_name: string; given_name: string; dob: string; sex: string;
      language: string; insurance_carrier: string; insurance_id: string;
      gp_name: string; gp_email: string;
    };
    const patients = parseCsvFile<PatientRow>(join(DATA_ROOT, "enterprise/crm/patient_master.csv"));
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MERGE (p:Patient {mrn: r.mrn})
       SET p.name = r.given_name + " " + r.family_name,
           p.given_name = r.given_name, p.family_name = r.family_name,
           p.dob = r.dob, p.sex = r.sex, p.language = r.language,
           p.insurance_carrier = r.insurance_carrier, p.insurance_id = r.insurance_id,
           p.gp_name = r.gp_name, p.gp_email = r.gp_email,
           p.is_index_case = (r.mrn = $idxMrn),
           p.caption = r.given_name + " " + r.family_name`,
      patients,
      { idxMrn: PATIENT_MRN }
    );

    // ── 4. Conditions / problems (Linda) ────────────────────────────────────
    type Problem = { problem_id: string; mrn: string; problem: string; icd10: string; status: string; severity: string; note: string };
    const problems = parseCsvFile<Problem>(join(DATA_ROOT, "enterprise/crm/problems.csv"));
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (p:Patient {mrn: r.mrn})
       MERGE (c:Condition {problem_id: r.problem_id})
       SET c.problem = r.problem, c.icd10 = r.icd10, c.status = r.status,
           c.severity = r.severity, c.note = r.note,
           c.caption = r.problem + " (" + r.icd10 + ")"
       MERGE (p)-[:HAS_PROBLEM]->(c)`,
      problems
    );

    // ── 5. Home medications (Linda) ─────────────────────────────────────────
    type Med = { med_id: string; mrn: string; medication: string; strength: string; frequency: string; indication: string; status: string };
    const meds = parseCsvFile<Med>(join(DATA_ROOT, "enterprise/crm/medications.csv"));

    // ── 6. Drugs (formulary) ────────────────────────────────────────────────
    console.log("▶ Drugs (formulary CSV)");
    type Drug = {
      drug_code: string; name: string; strength: string; form: string; route: string;
      class: string; indication_keywords: string; prior_auth_required: string;
      restriction_level: string; formulary_tier: string; monthly_cost_chf_estimate: string;
      notes: string;
    };
    const drugs = parseCsvFile<Drug>(join(DATA_ROOT, "enterprise/formulary/oncology_formulary.csv"));
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MERGE (d:Drug {drug_code: r.drug_code})
       SET d.name = r.name, d.strength = r.strength, d.form = r.form, d.route = r.route,
           d.class = r.class, d.prior_auth_required = (r.prior_auth_required = "true"),
           d.restriction_level = r.restriction_level, d.tier = toInteger(r.formulary_tier),
           d.monthly_cost_chf_estimate = toInteger(r.monthly_cost_chf_estimate),
           d.notes = r.notes, d.indication_keywords = r.indication_keywords,
           d.caption = r.name + " (" + r.class + ")"`,
      drugs
    );

    // Link Linda's home meds to formulary entries by name (lowercased)
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (p:Patient {mrn: r.mrn})
       OPTIONAL MATCH (d:Drug) WHERE toLower(d.name) STARTS WITH toLower(r.medication_short)
       FOREACH (_ IN CASE WHEN d IS NOT NULL THEN [1] ELSE [] END |
         MERGE (p)-[:TAKES {since: r.start_date, indication: r.indication}]->(d)
       )
       FOREACH (_ IN CASE WHEN d IS NULL THEN [1] ELSE [] END |
         MERGE (h:Drug {drug_code: "EXT-" + replace(toLower(r.medication_short), " ", "-")})
         ON CREATE SET h.name = r.medication, h.class = "Home medication", h.caption = r.medication
         MERGE (p)-[:TAKES {since: r.start_date, indication: r.indication}]->(h)
       )`,
      meds.map((m) => ({
        mrn: m.mrn,
        medication: m.medication,
        medication_short: m.medication.split(/[\s+]/)[0],
        start_date: m.start_date,
        indication: m.indication,
      }))
    );

    // ── 7. Encounters ───────────────────────────────────────────────────────
    console.log("▶ Encounters");
    type Encounter = {
      encounter_id: string; mrn: string; date: string; time: string; type: string;
      department: string; provider_id: string; location: string; reason: string;
      disposition: string; billing_code: string; note_id: string; status: string;
    };
    const encounters = parseCsvFile<Encounter>(join(DATA_ROOT, "enterprise/crm/encounters.csv"));
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (p:Patient {mrn: r.mrn})
       MERGE (e:Encounter {encounter_id: r.encounter_id})
       SET e.date = r.date, e.time = r.time, e.type = r.type, e.department = r.department,
           e.location = r.location, e.reason = r.reason, e.disposition = r.disposition,
           e.billing_code = r.billing_code, e.status = r.status,
           e.caption = r.date + " · " + r.type
       MERGE (p)-[:HAS_ENCOUNTER]->(e)
       WITH e, r
       OPTIONAL MATCH (s:Staff {staff_id: r.provider_id})
       FOREACH (_ IN CASE WHEN s IS NOT NULL THEN [1] ELSE [] END |
         MERGE (e)-[:PERFORMED_BY]->(s)
       )`,
      encounters
    );

    // ── 8. Diagnosis + clinical content for Linda ───────────────────────────
    console.log("▶ Diagnosis + biomarkers + genomics + imaging + labs + stages");
    await runWrite(
      s,
      `MATCH (p:Patient {mrn: $mrn})
       MERGE (d:Diagnosis {diagnosis_id: "DX-" + $mrn})
       SET d.histology = $hist, d.grade = $grade, d.laterality = "right",
           d.quadrant = $quadrant, d.size_mm = $size,
           d.caption = $hist + " · grade " + $grade + " · " + $quadrant
       MERGE (p)-[:HAS_DIAGNOSIS]->(d)`,
      {
        mrn: PATIENT_MRN,
        hist: CASE.tumour.histology,
        grade: CASE.tumour.nottingham.grade,
        quadrant: CASE.tumour.quadrant,
        size: CASE.tumour.size_mm,
      }
    );

    const biomarkers = [
      { marker: "ER", value: CASE.tumour.ihc.er, kind: "IHC" },
      { marker: "PR", value: CASE.tumour.ihc.pr, kind: "IHC" },
      { marker: "HER2 IHC", value: CASE.tumour.ihc.her2_ihc, kind: "IHC" },
      { marker: "HER2 FISH", value: `ratio ${CASE.tumour.her2_fish.ratio}, copy ${CASE.tumour.her2_fish.her2_copy} → ${CASE.tumour.her2_fish.result}`, kind: "FISH" },
      { marker: "Ki-67", value: CASE.tumour.ihc.ki67, kind: "IHC" },
    ];
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (d:Diagnosis {diagnosis_id: $dxId})
       MERGE (b:BiomarkerResult {biomarker_id: $dxId + "-" + replace(r.marker, " ", "-")})
       SET b.marker = r.marker, b.value = r.value, b.kind = r.kind,
           b.caption = r.marker + ": " + r.value
       MERGE (d)-[:HAS_BIOMARKER]->(b)`,
      biomarkers,
      { dxId: "DX-" + PATIENT_MRN }
    );

    // Genomic alterations
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (p:Patient {mrn: $mrn})
       MERGE (g:GenomicAlteration {alt_id: r.gene + ":" + r.alteration})
       SET g.gene = r.gene, g.alteration = r.alteration, g.vaf = r.vaf,
           g.type = r.type, g.actionable = r.actionable,
           g.caption = r.gene + " " + r.alteration
       MERGE (p)-[:HAS_ALTERATION]->(g)`,
      CASE.ngs.reportable,
      { mrn: PATIENT_MRN }
    );

    // Imaging findings — break into discrete findings per study
    type ImagingFinding = { finding_id: string; modality: string; region: string; finding: string; size_mm: number; side: string; phase: number; encounter_id: string };
    const imagingFindings: ImagingFinding[] = [
      { finding_id: "IMG-001", modality: "Mammography (CC + MLO)", region: "Right breast UOQ", finding: "Spiculated mass with architectural distortion", size_mm: 32, side: "right", phase: 1, encounter_id: "ENC-26-09114" },
      { finding_id: "IMG-002", modality: "Targeted ultrasound", region: "Right axilla level I", finding: "Two abnormal lymph nodes; cortical thickening 4 mm", size_mm: 14, side: "right", phase: 1, encounter_id: "ENC-26-09114" },
      { finding_id: "IMG-003", modality: "Breast MRI 3T", region: "Right breast UOQ", finding: "Enhancing irregular mass; rim enhancement; washout (Type III); restricted diffusion", size_mm: 32, side: "right", phase: 1, encounter_id: "ENC-26-09114" },
      { finding_id: "IMG-CT-1", modality: "CT chest", region: "LUL anterior segment", finding: "Solid well-circumscribed nodule", size_mm: 14, side: "left", phase: 2, encounter_id: "ENC-26-11042" },
      { finding_id: "IMG-CT-2", modality: "CT chest", region: "LUL apico-posterior", finding: "Solid nodule", size_mm: 8, side: "left", phase: 2, encounter_id: "ENC-26-11042" },
      { finding_id: "IMG-CT-3", modality: "CT chest", region: "RUL posterior", finding: "Solid nodule", size_mm: 5, side: "right", phase: 2, encounter_id: "ENC-26-11042" },
    ];
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (e:Encounter {encounter_id: r.encounter_id})
       MERGE (f:ImagingFinding {finding_id: r.finding_id})
       SET f.modality = r.modality, f.region = r.region, f.finding = r.finding,
           f.size_mm = r.size_mm, f.side = r.side, f.phase = r.phase,
           f.caption = r.modality + " · " + r.region + " (" + toString(r.size_mm) + " mm)"
       MERGE (e)-[:HAS_FINDING]->(f)`,
      imagingFindings
    );

    // Labs
    type LabResult = { lab_id: string; analyte: string; value: string; unit: string; ref_range: string; flag: string; encounter_id: string };
    const labs: LabResult[] = [
      { lab_id: "LAB-Hgb", analyte: "Haemoglobin", value: "11.2", unit: "g/dL", ref_range: "12.0-16.0", flag: "L", encounter_id: "ENC-26-10222" },
      { lab_id: "LAB-WBC", analyte: "WBC", value: "5.4", unit: "×10⁹/L", ref_range: "4.0-11.0", flag: "", encounter_id: "ENC-26-10222" },
      { lab_id: "LAB-ANC", analyte: "ANC", value: "3.2", unit: "×10⁹/L", ref_range: "1.8-7.5", flag: "", encounter_id: "ENC-26-10222" },
      { lab_id: "LAB-Plt", analyte: "Platelets", value: "248", unit: "×10⁹/L", ref_range: "150-400", flag: "", encounter_id: "ENC-26-10222" },
      { lab_id: "LAB-Cr", analyte: "Creatinine", value: "0.8", unit: "mg/dL", ref_range: "0.6-1.1", flag: "", encounter_id: "ENC-26-10222" },
      { lab_id: "LAB-ALT", analyte: "ALT", value: "22", unit: "U/L", ref_range: "<33", flag: "", encounter_id: "ENC-26-10222" },
      { lab_id: "LAB-AST", analyte: "AST", value: "24", unit: "U/L", ref_range: "<32", flag: "", encounter_id: "ENC-26-10222" },
      { lab_id: "LAB-LDH", analyte: "LDH", value: "188", unit: "U/L", ref_range: "120-246", flag: "", encounter_id: "ENC-26-10222" },
      { lab_id: "LAB-LVEF", analyte: "LVEF (echo)", value: "62", unit: "%", ref_range: "≥50", flag: "", encounter_id: "ENC-26-10223" },
    ];
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (e:Encounter {encounter_id: r.encounter_id})
       MERGE (l:LabResult {lab_id: r.lab_id})
       SET l.analyte = r.analyte, l.value = r.value, l.unit = r.unit,
           l.ref_range = r.ref_range, l.flag = r.flag,
           l.caption = r.analyte + ": " + r.value + " " + r.unit + (CASE WHEN r.flag = "" THEN "" ELSE " " + r.flag END)
       MERGE (e)-[:HAS_LAB]->(l)`,
      labs
    );

    type Marker = { marker_id: string; name: string; value: string; unit: string; ref: string; flag: string };
    const markers: Marker[] = [
      { marker_id: "TM-CA15-3", name: "CA 15-3", value: "92", unit: "U/mL", ref: "<30", flag: "H" },
      { marker_id: "TM-CA27-29", name: "CA 27.29", value: "58", unit: "U/mL", ref: "<38", flag: "H" },
      { marker_id: "TM-CEA", name: "CEA", value: "6.1", unit: "ng/mL", ref: "<5.0", flag: "H" },
      { marker_id: "TM-CA125", name: "CA 125", value: "14", unit: "U/mL", ref: "<35", flag: "" },
    ];
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (e:Encounter {encounter_id: $encId})
       MERGE (m:TumourMarker {marker_id: r.marker_id})
       SET m.name = r.name, m.value = r.value, m.unit = r.unit, m.ref = r.ref, m.flag = r.flag,
           m.caption = r.name + ": " + r.value + " " + r.unit + (CASE WHEN r.flag = "" THEN "" ELSE " " + r.flag END)
       MERGE (e)-[:HAS_MARKER]->(m)`,
      markers,
      { encId: "ENC-26-10222" }
    );

    // ── 9. Stage assertions (Phase-1 cM0 + Phase-2 cM1 with CONTRADICTS/SUPERSEDES) ──
    await runWrite(
      s,
      `MATCH (p:Patient {mrn: $mrn})
       MERGE (s1:StageAssertion {stage_id: "STAGE-P1"})
       SET s1.phase = 1, s1.ct = $p1ct, s1.cn = $p1cn, s1.cm = $p1cm,
           s1.overall = $p1overall, s1.intent = "curative",
           s1.asserted_at = $consultDate,
           s1.caption = "Phase 1 · " + $p1overall
       MERGE (p)-[:STAGES {phase: 1}]->(s1)
       MERGE (s2:StageAssertion {stage_id: "STAGE-P2"})
       SET s2.phase = 2, s2.ct = $p2ct, s2.cn = $p2cn, s2.cm = $p2cm,
           s2.overall = $p2overall, s2.intent = "palliative",
           s2.asserted_at = $ctDate,
           s2.caption = "Phase 2 · " + $p2overall
       MERGE (p)-[:STAGES {phase: 2}]->(s2)
       MERGE (s2)-[:CONTRADICTS {axis: "M-descriptor"}]->(s1)
       MERGE (s2)-[:SUPERSEDES]->(s1)`,
      {
        mrn: PATIENT_MRN,
        p1ct: CASE.staging_phase1.ct, p1cn: CASE.staging_phase1.cn,
        p1cm: CASE.staging_phase1.cm, p1overall: CASE.staging_phase1.overall,
        p2ct: CASE.staging_phase2.ct, p2cn: CASE.staging_phase2.cn,
        p2cm: CASE.staging_phase2.cm, p2overall: CASE.staging_phase2.overall,
        consultDate: CASE.dates.consult,
        ctDate: CASE.dates.staging_ct,
      }
    );

    // ── 10. Treatment plans ─────────────────────────────────────────────────
    console.log("▶ Treatment plans + drug links");
    await runWrite(
      s,
      `MATCH (p:Patient {mrn: $mrn})
       MERGE (tp1:TreatmentPlan {plan_id: "TP-curative"})
       SET tp1.name = "Dose-dense AC-T → surgery → adjuvant letrozole + abemaciclib",
           tp1.intent = "curative", tp1.status = "cancelled",
           tp1.caption = "Curative · AC-T (cancelled)"
       MERGE (p)-[:HAS_PLAN {phase: 1, status: "cancelled"}]->(tp1)
       MERGE (tp2:TreatmentPlan {plan_id: "TP-palliative"})
       SET tp2.name = "Letrozole + ribociclib (1L palliative)",
           tp2.intent = "palliative", tp2.status = "active",
           tp2.caption = "Palliative · letrozole + ribociclib (1L)"
       MERGE (p)-[:HAS_PLAN {phase: 2, status: "active"}]->(tp2)
       MERGE (tp2)-[:SUPERSEDES]->(tp1)`,
      { mrn: PATIENT_MRN }
    );

    // Curative plan → drugs
    const curativeDrugs = ["KSZ-RX-A001", "KSZ-RX-A002", "KSZ-RX-A003", "KSZ-RX-S002", "KSZ-RX-B001", "KSZ-RX-C003"];
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (tp:TreatmentPlan {plan_id: $planId})
       MATCH (d:Drug {drug_code: r.drug_code})
       MERGE (tp)-[:CONTAINS_DRUG {role: r.role}]->(d)`,
      [
        { drug_code: "KSZ-RX-A001", role: "neoadjuvant" },
        { drug_code: "KSZ-RX-A002", role: "neoadjuvant" },
        { drug_code: "KSZ-RX-A003", role: "neoadjuvant" },
        { drug_code: "KSZ-RX-S002", role: "supportive (G-CSF)" },
        { drug_code: "KSZ-RX-B001", role: "adjuvant ET" },
        { drug_code: "KSZ-RX-C003", role: "adjuvant CDK4/6i" },
      ],
      { planId: "TP-curative" }
    );

    // Palliative plan → drugs
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (tp:TreatmentPlan {plan_id: $planId})
       MATCH (d:Drug {drug_code: r.drug_code})
       MERGE (tp)-[:CONTAINS_DRUG {role: r.role}]->(d)`,
      [
        { drug_code: "KSZ-RX-B001", role: "1L palliative ET" },
        { drug_code: "KSZ-RX-C001", role: "1L palliative CDK4/6i" },
        { drug_code: "KSZ-RX-D003", role: "reserved · HER2-low later line" },
        { drug_code: "KSZ-RX-E001", role: "reserved · PIK3CA-targeted later line" },
      ],
      { planId: "TP-palliative" }
    );

    // Plan → stage
    await runWrite(
      s,
      `MATCH (tp1:TreatmentPlan {plan_id: "TP-curative"}), (s1:StageAssertion {stage_id: "STAGE-P1"})
       MERGE (tp1)-[:BASED_ON]->(s1)`
    );
    await runWrite(
      s,
      `MATCH (tp2:TreatmentPlan {plan_id: "TP-palliative"}), (s2:StageAssertion {stage_id: "STAGE-P2"})
       MERGE (tp2)-[:BASED_ON]->(s2)`
    );

    // ── 11. Clinical reports as Documents ──────────────────────────────────
    console.log("▶ Clinical-report Documents");
    type ClinReport = { doc_id: string; sub: string; title: string; path: string; date: string; phase: number; authors: string[]; encounter_id?: string };
    const clinReports: ClinReport[] = [
      { doc_id: "DOC-PATH-26S-08421", sub: "ClinicalReport", title: "Path · Core biopsy report", path: "01_initial_workup/pathology/core_biopsy_report.pdf", date: CASE.dates.path_signed, phase: 1, authors: ["KSZ-027", "KSZ-033"], encounter_id: "ENC-26-09518" },
      { doc_id: "DOC-RAD-26R-MAM-19432", sub: "ClinicalReport", title: "Rad · Diagnostic mammo + US + MRI", path: "01_initial_workup/radiology/diagnostic_mammo_us_mri.pdf", date: CASE.dates.mammo_us_mri, phase: 1, authors: ["KSZ-014", "KSZ-104"], encounter_id: "ENC-26-09114" },
      { doc_id: "DOC-LAB-26L-04157", sub: "ClinicalReport", title: "Lab · Baseline panel", path: "01_initial_workup/lab/baseline_labs.pdf", date: CASE.dates.labs_baseline, phase: 1, authors: ["KSZ-064", "KSZ-072"], encounter_id: "ENC-26-10222" },
      { doc_id: "DOC-NGS-FMI-26-018342", sub: "ClinicalReport", title: "NGS · FoundationOne CDx", path: "01_initial_workup/genomics/foundationone_cdx.pdf", date: CASE.dates.ngs_reported, phase: 1, authors: ["FMI-EXT-1"] },
      { doc_id: "DOC-CONS-26C-MO-22884", sub: "ClinicalReport", title: "Med-Onc · Initial consult note", path: "01_initial_workup/clinical_data/initial_consult_note.pdf", date: CASE.dates.consult, phase: 1, authors: ["KSZ-001"], encounter_id: "ENC-26-10891" },
      { doc_id: "DOC-CT-26R-CT-21588", sub: "ClinicalReport", title: "Rad · Staging CT C/A/P", path: "02_staging_ct/radiology/staging_ct_cap.pdf", date: CASE.dates.staging_ct, phase: 2, authors: ["KSZ-051", "KSZ-052"], encounter_id: "ENC-26-11042" },
    ];
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MERGE (d:Document:ClinicalReport {doc_id: r.doc_id})
       SET d.title = r.title, d.path = r.path, d.date = r.date, d.phase = r.phase,
           d.kind = "clinical_report", d.caption = r.title
       WITH d
       MATCH (p:Patient {mrn: $mrn}) MERGE (d)-[:FOR_PATIENT]->(p)`,
      clinReports,
      { mrn: PATIENT_MRN }
    );
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (d:Document {doc_id: r.doc_id}), (s:Staff {staff_id: r.staff_id})
       MERGE (d)-[:AUTHORED_BY]->(s)`,
      clinReports.flatMap((cr) =>
        cr.authors.map((staff_id) => ({ doc_id: cr.doc_id, staff_id }))
      )
    );
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (e:Encounter {encounter_id: r.encounter_id}), (d:Document {doc_id: r.doc_id})
       MERGE (e)-[:GENERATED]->(d)`,
      clinReports
        .filter((cr) => cr.encounter_id)
        .map((cr) => ({ doc_id: cr.doc_id, encounter_id: cr.encounter_id! }))
    );

    // ── 12. Emails (Phase 1 + Phase 2 cascade) ──────────────────────────────
    console.log("▶ Emails (Phase 1 + Phase 2 cascade)");
    const emailDirs = [
      { dir: join(DATA_ROOT, "01_initial_workup/emails"), phase: 1 },
      { dir: join(DATA_ROOT, "02_staging_ct/cascade"), phase: 2 },
    ];
    type EmailRow = { messageId: string; subject: string; date: string; phase: number; path: string; from_email: string; to_emails: string[]; cc_emails: string[]; cascade_source: string | null };
    const emailRows: EmailRow[] = [];
    const allEmails: Email[] = [];
    for (const { dir, phase } of emailDirs) {
      for (const f of listFiles(dir, ".eml")) {
        const e = parseEml(f);
        allEmails.push(e);
        const cascadeSrc = (e.headers["x-cascade-source"] || "").match(/<([^>]+)>/);
        emailRows.push({
          messageId: e.messageId,
          subject: e.subject,
          date: e.date,
          phase,
          path: relPath(f),
          from_email: e.from.email.toLowerCase(),
          to_emails: e.to.map((x) => x.email.toLowerCase()),
          cc_emails: e.cc.map((x) => x.email.toLowerCase()),
          cascade_source: cascadeSrc ? cascadeSrc[1] : null,
        });
      }
    }
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MERGE (d:Document:Email {doc_id: r.messageId})
       SET d.title = r.subject, d.date = r.date, d.phase = r.phase, d.path = r.path,
           d.kind = "email", d.caption = "✉ " + substring(r.subject, 0, 60)
       WITH d, r
       MATCH (p:Patient {mrn: $mrn}) MERGE (d)-[:FOR_PATIENT]->(p)`,
      emailRows,
      { mrn: PATIENT_MRN }
    );

    // Email senders + recipients via emailToStaff lookup
    const emailRels: { messageId: string; staffId: string; rel: string }[] = [];
    for (const er of emailRows) {
      const fromSid = emailToStaff.get(er.from_email);
      if (fromSid) emailRels.push({ messageId: er.messageId, staffId: fromSid, rel: "SENT_BY" });
      for (const t of er.to_emails) {
        const sid = emailToStaff.get(t);
        if (sid) emailRels.push({ messageId: er.messageId, staffId: sid, rel: "SENT_TO" });
      }
      for (const c of er.cc_emails) {
        const sid = emailToStaff.get(c);
        if (sid) emailRels.push({ messageId: er.messageId, staffId: sid, rel: "CC" });
      }
    }
    for (const rel of ["SENT_BY", "SENT_TO", "CC"]) {
      await batchUnwind(
        s,
        `UNWIND $rows AS r
         MATCH (d:Document {doc_id: r.messageId}), (s:Staff {staff_id: r.staffId})
         MERGE (d)-[:${rel}]->(s)`,
        emailRels.filter((x) => x.rel === rel)
      );
    }

    // Cascade chain: each cascade email except the root references the root via X-Cascade-Source
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (downstream:Document:Email {doc_id: r.messageId})
       MATCH (root:Document:Email {doc_id: r.cascade_source})
       MERGE (downstream)-[:CASCADED_FROM]->(root)`,
      emailRows.filter((r) => r.cascade_source)
    );

    // ── 13. Chat (Phase 1 + Phase 2) ────────────────────────────────────────
    console.log("▶ Chat channel + messages");
    await runWrite(
      s,
      `MERGE (c:ChatChannel {name: "#breast-team"})
       SET c.caption = "#breast-team"`,
      {}
    );
    type ChatMsg = { ts: string; channel: string; user: string; user_name: string; role: string; text: string };
    const chatFiles = [
      { path: join(DATA_ROOT, "01_initial_workup/chat/breast_team_channel_phase1.jsonl"), phase: 1 },
      { path: join(DATA_ROOT, "02_staging_ct/cascade/breast_team_channel_phase2.jsonl"), phase: 2 },
    ];
    const chatRows: { message_id: string; ts: string; phase: number; user: string; staff_id: string | null; role: string; text: string; preview: string }[] = [];
    for (const cf of chatFiles) {
      const msgs = parseJsonl<ChatMsg>(cf.path);
      msgs.forEach((m, i) => {
        const sid = emailToStaff.get(m.user) ?? null;
        chatRows.push({
          message_id: `MSG-P${cf.phase}-${i + 1}-${m.ts.replace(/[^0-9]/g, "")}`,
          ts: m.ts,
          phase: cf.phase,
          user: m.user,
          staff_id: sid,
          role: m.role,
          text: m.text,
          preview: m.text.slice(0, 60),
        });
      });
    }
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MERGE (m:ChatMessage {message_id: r.message_id})
       SET m.ts = r.ts, m.phase = r.phase, m.role = r.role, m.text = r.text,
           m.caption = "💬 " + r.preview
       WITH m, r
       MATCH (c:ChatChannel {name: "#breast-team"}) MERGE (m)-[:IN_CHANNEL]->(c)
       WITH m, r
       OPTIONAL MATCH (s:Staff {staff_id: r.staff_id})
       FOREACH (_ IN CASE WHEN s IS NOT NULL THEN [1] ELSE [] END |
         MERGE (m)-[:POSTED_BY]->(s)
       )`,
      chatRows
    );

    // ── 14. Tumour board agendas (v1 + v2) ──────────────────────────────────
    console.log("▶ MDT Sessions + Agendas");
    await runWrite(
      s,
      `MERGE (mdt:MDTSession {date: "2026-04-29"})
       SET mdt.location = "Bldg C - Conference Room 4.40", mdt.caption = "Breast MDT 2026-04-29"
       WITH mdt
       MATCH (p:Patient {mrn: $mrn}) MERGE (mdt)-[:DISCUSSES]->(p)`,
      { mrn: PATIENT_MRN }
    );

    const agendas = [
      { docId: "DOC-MDT-26-04-29-v1", path: "01_initial_workup/tumor_board/agenda_2026-04-29_v1.md", version: 1, phase: 1 },
      { docId: "DOC-MDT-26-04-29-v2", path: "02_staging_ct/cascade/tumor_board_agenda_2026-04-29_v2.md", version: 2, phase: 2 },
    ];
    for (const a of agendas) {
      await runWrite(
        s,
        `MERGE (d:Document:Agenda {doc_id: $docId})
         SET d.path = $path, d.kind = "mdt_agenda", d.version = $version, d.phase = $phase,
             d.title = "MDT 2026-04-29 v" + toString($version),
             d.caption = "Agenda v" + toString($version)
         WITH d
         MATCH (mdt:MDTSession {date: "2026-04-29"}) MERGE (mdt)-[:HAS_AGENDA]->(d)`,
        a
      );
    }
    await runWrite(
      s,
      `MATCH (v2:Document:Agenda {doc_id: "DOC-MDT-26-04-29-v2"}), (v1:Document:Agenda {doc_id: "DOC-MDT-26-04-29-v1"})
       MERGE (v2)-[:SUPERSEDES]->(v1)`
    );
    // Required attendees (from v2 agenda meta)
    const v2Attendees = ["KSZ-001", "KSZ-027", "KSZ-014", "KSZ-051", "KSZ-088", "KSZ-091", "KSZ-145", "KSZ-072", "KSZ-156", "KSZ-122"];
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (mdt:MDTSession {date: "2026-04-29"}), (s:Staff {staff_id: r.sid})
       MERGE (mdt)-[:HAS_ATTENDEE]->(s)`,
      v2Attendees.map((sid) => ({ sid }))
    );

    // ── 15. Patient intake form ─────────────────────────────────────────────
    await runWrite(
      s,
      `MERGE (d:Document:IntakeForm {doc_id: "DOC-INTAKE-26-MBC-0042-001"})
       SET d.title = "Patient intake questionnaire (2026-04-22)", d.kind = "intake_form",
           d.path = "01_initial_workup/patient_intake/health_questionnaire_2026-04-22.md",
           d.phase = 1, d.caption = "📋 Patient intake form"
       WITH d
       MATCH (p:Patient {mrn: $mrn}) MERGE (d)-[:FOR_PATIENT]->(p)
       WITH d
       MATCH (e:Encounter {encounter_id: "ENC-26-10891"}) MERGE (e)-[:GENERATED]->(d)`,
      { mrn: PATIENT_MRN }
    );

    // ── 16. Appointments + Prior Auths ──────────────────────────────────────
    console.log("▶ Appointments + Prior Auths");
    type Appt = { appointment_id: string; type: string; status: string; status_note: string; date: string; phase: number; path: string; planId: string; paId: string };
    const apptFiles = [
      "01_initial_workup/scheduling/port_placement_2026-05-04.json",
      "01_initial_workup/scheduling/neoadjuvant_chemo_C1_2026-05-05.json",
      "01_initial_workup/scheduling/preop_lumpectomy_pencilled_2026-09-15.json",
    ];
    const apptRows: Appt[] = apptFiles.map((relpath) => {
      const j = readJson<{ appointment_id: string; type: string; status: string; status_note: string; scheduled: { date: string }; linked_prior_auth?: string }>(join(DATA_ROOT, relpath));
      return {
        appointment_id: j.appointment_id,
        type: j.type,
        status: j.status,
        status_note: j.status_note,
        date: j.scheduled.date,
        phase: 1,
        path: relpath,
        planId: "TP-curative",
        paId: j.linked_prior_auth || "",
      };
    });
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MERGE (a:Appointment {appointment_id: r.appointment_id})
       SET a.type = r.type, a.status = r.status, a.status_note = r.status_note,
           a.scheduled_date = r.date, a.phase = r.phase, a.path = r.path,
           a.caption = r.type + " · " + r.date + " (" + r.status + ")"
       WITH a, r
       MATCH (p:Patient {mrn: $mrn}) MERGE (a)-[:FOR_PATIENT]->(p)
       WITH a, r
       MATCH (tp:TreatmentPlan {plan_id: r.planId}) MERGE (tp)-[:HAS_APPOINTMENT]->(a)`,
      apptRows,
      { mrn: PATIENT_MRN }
    );

    // Prior auths: original + adjuvant abemaciclib + cascade pair (withdrawn / new)
    type PA = { pa_id: string; status: string; phase: number; planId: string; regimen: string; path: string };
    const paFiles: PA[] = [
      { pa_id: "PA-26-AT-9921", status: "withdrawn", phase: 2, planId: "TP-curative", regimen: "Dose-dense AC-T", path: "02_staging_ct/cascade/prior_auth_AC-T_WITHDRAWN.json" },
      { pa_id: "PA-26-AB-9922", status: "pending", phase: 1, planId: "TP-curative", regimen: "Adjuvant letrozole + abemaciclib", path: "01_initial_workup/billing/prior_auth_adjuvant_abemaciclib.json" },
      { pa_id: "PA-26-RB-0024", status: "submitted", phase: 2, planId: "TP-palliative", regimen: "Letrozole + ribociclib", path: "02_staging_ct/cascade/prior_auth_letrozole_ribociclib_NEW.json" },
    ];
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MERGE (pa:PriorAuth {pa_id: r.pa_id})
       SET pa.status = r.status, pa.phase = r.phase, pa.regimen = r.regimen, pa.path = r.path,
           pa.caption = r.pa_id + " · " + r.regimen + " (" + r.status + ")"
       WITH pa, r
       MATCH (p:Patient {mrn: $mrn}) MERGE (pa)-[:FOR_PATIENT]->(p)
       WITH pa, r
       MATCH (tp:TreatmentPlan {plan_id: r.planId}) MERGE (tp)-[:HAS_PRIOR_AUTH]->(pa)`,
      paFiles,
      { mrn: PATIENT_MRN }
    );

    // Link appointments to AC-T prior auth
    await runWrite(
      s,
      `MATCH (a:Appointment), (pa:PriorAuth {pa_id: "PA-26-AT-9921"})
       WHERE a.appointment_id IN ["APP-26-IR-44721", "APP-26-INF-58112"]
       MERGE (a)-[:LINKED_TO_PA]->(pa)`
    );

    // SUPERSEDES: new PA supersedes withdrawn PA
    await runWrite(
      s,
      `MATCH (n:PriorAuth {pa_id: "PA-26-RB-0024"}), (o:PriorAuth {pa_id: "PA-26-AT-9921"})
       MERGE (n)-[:SUPERSEDES]->(o)`
    );

    // ── 17. Cascade events ──────────────────────────────────────────────────
    console.log("▶ Cascade events");
    type CascadeEvent = { event_id: string; kind: string; at: string; caption: string; cancels: string[]; updates: string[]; supersedes: string[] };
    const events: CascadeEvent[] = [
      { event_id: "CE-CANCEL-IR", kind: "cancel_appointment", at: "2026-04-24T13:04:18+02:00", caption: "Cancel · IR port placement", cancels: ["APP-26-IR-44721"], updates: [], supersedes: [] },
      { event_id: "CE-CANCEL-INF", kind: "cancel_appointment", at: "2026-04-24T13:04:18+02:00", caption: "Cancel · Chemo C1", cancels: ["APP-26-INF-58112"], updates: [], supersedes: [] },
      { event_id: "CE-CANCEL-SURG", kind: "cancel_appointment", at: "2026-04-24T13:04:18+02:00", caption: "Cancel · Lumpectomy pencil", cancels: ["APP-26-SURG-PENCIL-9921"], updates: [], supersedes: [] },
      { event_id: "CE-WITHDRAW-PA", kind: "withdraw_prior_auth", at: "2026-04-24T14:21:33+02:00", caption: "Withdraw · PA-26-AT-9921", cancels: [], updates: ["PA-26-AT-9921"], supersedes: [] },
      { event_id: "CE-NEW-PA", kind: "new_prior_auth", at: "2026-04-24T14:46:00+02:00", caption: "Submit · PA-26-RB-0024", cancels: [], updates: ["PA-26-RB-0024"], supersedes: [] },
      { event_id: "CE-MDT-RECAT", kind: "mdt_recategorise", at: "2026-04-24T15:48:00+02:00", caption: "Recategorise MDT case", cancels: [], updates: ["DOC-MDT-26-04-29-v2"], supersedes: ["DOC-MDT-26-04-29-v1"] },
      { event_id: "CE-PT-CALL", kind: "patient_contact", at: "2026-04-24T15:35:00+02:00", caption: "Patient phone call (28 min)", cancels: [], updates: [], supersedes: [] },
      { event_id: "CE-PALL-REF", kind: "new_referral", at: "2026-04-24T16:08:00+02:00", caption: "Palliative care integration referral", cancels: [], updates: [], supersedes: [] },
    ];
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MERGE (e:CascadeEvent {event_id: r.event_id})
       SET e.kind = r.kind, e.at = r.at, e.caption = r.caption
       WITH e, r
       MATCH (root:Document:Email {doc_id: $rootMsg})
       MERGE (e)-[:CASCADED_FROM]->(root)`,
      events,
      { rootMsg: CASCADE_ROOT_MSGID }
    );
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (e:CascadeEvent {event_id: r.eid}), (a:Appointment {appointment_id: r.aid})
       MERGE (e)-[:CANCELS]->(a)`,
      events.flatMap((e) => e.cancels.map((aid) => ({ eid: e.event_id, aid })))
    );
    // UPDATES targets are either PriorAuth or Document — match either label in one pass
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (e:CascadeEvent {event_id: r.eid})
       OPTIONAL MATCH (pa:PriorAuth {pa_id: r.uid})
       OPTIONAL MATCH (d:Document {doc_id: r.uid})
       FOREACH (_ IN CASE WHEN pa IS NOT NULL THEN [1] ELSE [] END | MERGE (e)-[:UPDATES]->(pa))
       FOREACH (_ IN CASE WHEN d IS NOT NULL THEN [1] ELSE [] END | MERGE (e)-[:UPDATES]->(d))`,
      events.flatMap((e) => e.updates.map((uid) => ({ eid: e.event_id, uid })))
    );
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (e:CascadeEvent {event_id: r.eid}), (d:Document {doc_id: r.sid})
       MERGE (e)-[:SUPERSEDES_DOC]->(d)`,
      events.flatMap((e) => e.supersedes.map((sid) => ({ eid: e.event_id, sid })))
    );

    // ── 18. Clinical pathways + SOPs + GuidelineChunks ──────────────────────
    console.log("▶ Clinical pathways + GuidelineChunks");
    type Policy = { docId: string; pathwayLabel: string; pathwayId: string; path: string; isSop: boolean };
    const policies: Policy[] = [
      { docId: "DOC-CP-BR-001", pathwayLabel: "ClinicalPathway", pathwayId: "KSZ-CP-BR-001", path: "enterprise/policies/clinical_pathway_breast_HRpos_locoregional.md", isSop: false },
      { docId: "DOC-CP-BR-002", pathwayLabel: "ClinicalPathway", pathwayId: "KSZ-CP-BR-002", path: "enterprise/policies/clinical_pathway_breast_HRpos_advanced.md", isSop: false },
      { docId: "DOC-SOP-101", pathwayLabel: "SOP", pathwayId: "KSZ-SOP-101", path: "enterprise/policies/institutional_SOP_critical_results.md", isSop: true },
    ];
    type ChunkRow = {
      pathwayId: string;
      chunk_id: string;
      heading: string;
      idx: number;
      text: string;
    };
    const policyDocRows = policies.map((p) => {
      const md = parseMarkdownDoc(join(DATA_ROOT, p.path));
      const title = (md.data["title"] as string) || p.pathwayId;
      const version = (md.data["version"] as string) || "";
      const chunks: ChunkRow[] = chunkMarkdownByH2(md.content).map((c) => ({
        pathwayId: p.pathwayId,
        chunk_id: `${p.pathwayId}#${c.index}-${c.heading.replace(/[^A-Za-z0-9]+/g, "-").slice(0, 40)}`,
        heading: c.heading,
        idx: c.index,
        text: c.text.slice(0, 800),
      }));
      return { ...p, title, version, chunks };
    });

    // Pathways and SOPs use different node labels; split rows by label and run two
    // identical-shape batches (Cypher cannot parametrise labels without APOC).
    for (const label of ["ClinicalPathway", "SOP"]) {
      const rows = policyDocRows.filter((p) => p.pathwayLabel === label);
      await batchUnwind(
        s,
        `UNWIND $rows AS r
         MERGE (d:Document:PolicyDoc {doc_id: r.docId})
         SET d.title = r.title, d.path = r.path, d.kind = "policy",
             d.caption = "📜 " + r.pathwayId
         MERGE (cp:${label} {pathway_id: r.pathwayId})
         SET cp.title = r.title, cp.version = r.version,
             cp.caption = r.pathwayId + " · " + r.title
         MERGE (d)-[:DEFINES]->(cp)`,
        rows
      );
      await batchUnwind(
        s,
        `UNWIND $rows AS r
         MATCH (cp:${label} {pathway_id: r.pathwayId})
         MERGE (gc:GuidelineChunk {chunk_id: r.chunk_id})
         SET gc.source = r.pathwayId, gc.heading = r.heading, gc.index = r.idx,
             gc.text = r.text, gc.caption = r.heading
         MERGE (cp)-[:HAS_CHUNK {index: r.idx}]->(gc)`,
        rows.flatMap((p) => p.chunks)
      );
    }

    // Pathway cross-references
    await runWrite(
      s,
      `MATCH (a:ClinicalPathway {pathway_id: "KSZ-CP-BR-001"}), (b:ClinicalPathway {pathway_id: "KSZ-CP-BR-002"})
       MERGE (a)-[:TRANSITIONS_TO {trigger: "cM1 confirmed"}]->(b)
       MERGE (b)-[:TRANSITIONS_FROM {trigger: "cM0 → cM1"}]->(a)`
    );

    // ── 19. NCCN guideline chunks (representative subset via pdftotext) ────
    console.log("▶ NCCN guideline chunks");
    let nccnText = "";
    try {
      nccnText = execSync(
        `pdftotext -layout -f 1 -l 50 "${join(DATA_ROOT, "nccn_guidelines.pdf")}" -`,
        { encoding: "utf-8", maxBuffer: 1024 * 1024 * 16 }
      );
    } catch (err) {
      console.warn("  ⚠ pdftotext failed, NCCN chunks skipped:", err);
    }
    const nccnChunks = chunkNccnText(nccnText).slice(0, 30);
    if (nccnChunks.length > 0) {
      // Create NCCN as a top-level "external" pathway with chunks
      await runWrite(
        s,
        `MERGE (cp:ClinicalPathway:External {pathway_id: "NCCN-Breast-v3.2026"})
         SET cp.title = "NCCN Guidelines · Breast Cancer v3.2026",
             cp.caption = "NCCN Breast v3.2026 (external)"`
      );
      await batchUnwind(
        s,
        `UNWIND $rows AS r
         MATCH (cp:ClinicalPathway {pathway_id: "NCCN-Breast-v3.2026"})
         MERGE (gc:GuidelineChunk {chunk_id: r.chunk_id})
         SET gc.source = "NCCN-Breast-v3.2026", gc.heading = r.heading,
             gc.text = r.text, gc.index = r.idx, gc.caption = r.heading
         MERGE (cp)-[:HAS_CHUNK {index: r.idx}]->(gc)`,
        nccnChunks.map((c) => ({
          chunk_id: `NCCN-Breast-v3.2026#${c.index}-${c.heading.replace(/[^A-Za-z0-9]+/g, "-").slice(0, 40)}`,
          heading: c.heading, idx: c.index, text: c.text.slice(0, 800),
        }))
      );
    }

    // Plan → guideline grounding
    await runWrite(
      s,
      `MATCH (tp:TreatmentPlan {plan_id: "TP-curative"})
       MATCH (cp:ClinicalPathway {pathway_id: "KSZ-CP-BR-001"})
       MERGE (tp)-[:GUIDED_BY]->(cp)`
    );
    await runWrite(
      s,
      `MATCH (tp:TreatmentPlan {plan_id: "TP-palliative"})
       MATCH (cp:ClinicalPathway {pathway_id: "KSZ-CP-BR-002"})
       MERGE (tp)-[:GUIDED_BY]->(cp)`
    );
    // Ground to a few notable chunks per plan if they exist
    await runWrite(
      s,
      `MATCH (tp:TreatmentPlan {plan_id: "TP-curative"})
       MATCH (cp:ClinicalPathway {pathway_id: "KSZ-CP-BR-001"})-[:HAS_CHUNK]->(gc:GuidelineChunk)
       WHERE toLower(gc.heading) CONTAINS "intermediate" OR toLower(gc.heading) CONTAINS "recommended"
       MERGE (tp)-[:GUIDED_BY]->(gc)`
    );
    await runWrite(
      s,
      `MATCH (tp:TreatmentPlan {plan_id: "TP-palliative"})
       MATCH (cp:ClinicalPathway {pathway_id: "KSZ-CP-BR-002"})-[:HAS_CHUNK]->(gc:GuidelineChunk)
       WHERE toLower(gc.heading) CONTAINS "first-line" OR toLower(gc.heading) CONTAINS "second-line" OR toLower(gc.heading) CONTAINS "preferred"
       MERGE (tp)-[:GUIDED_BY]->(gc)`
    );

    // SOP → cascade root link
    await runWrite(
      s,
      `MATCH (sop:SOP {pathway_id: "KSZ-SOP-101"})
       MATCH (root:Document:Email {doc_id: $rootMsg})
       MERGE (root)-[:GOVERNED_BY]->(sop)`,
      { rootMsg: CASCADE_ROOT_MSGID }
    );

    // ── 20. Vault-level Facts with provenance ───────────────────────────────
    console.log("▶ Vault Facts (with provenance + contradictions)");
    type VFact = {
      fact_id: string; key: string; label: string; value: string;
      group: string; specialty: string; confidence: number; phase: number;
      source_docs: string[]; contradicts: string | null;
    };
    const facts: VFact[] = [
      // Diagnosis
      { fact_id: "F-DX-HISTO", key: "diagnosis.histology", label: "Histology", value: CASE.tumour.histology, group: "diagnosis", specialty: "pathology", confidence: 0.99, phase: 1, source_docs: ["DOC-PATH-26S-08421"], contradicts: null },
      { fact_id: "F-DX-GRADE", key: "diagnosis.grade", label: "Nottingham grade", value: `Grade ${CASE.tumour.nottingham.grade} (3+2+2)`, group: "diagnosis", specialty: "pathology", confidence: 0.95, phase: 1, source_docs: ["DOC-PATH-26S-08421"], contradicts: null },
      { fact_id: "F-DX-LATERALITY", key: "diagnosis.laterality", label: "Laterality", value: "Right breast, UOQ 10 o'clock", group: "diagnosis", specialty: "pathology", confidence: 0.99, phase: 1, source_docs: ["DOC-PATH-26S-08421", "DOC-RAD-26R-MAM-19432"], contradicts: null },
      { fact_id: "F-DX-SIZE", key: "diagnosis.size", label: "Tumour size", value: `${CASE.tumour.size_mm} mm`, group: "diagnosis", specialty: "radiology", confidence: 0.95, phase: 1, source_docs: ["DOC-RAD-26R-MAM-19432"], contradicts: null },
      // Receptor block
      { fact_id: "F-RX-ER", key: "diagnosis.er", label: "ER", value: CASE.tumour.ihc.er, group: "diagnosis", specialty: "pathology", confidence: 0.99, phase: 1, source_docs: ["DOC-PATH-26S-08421"], contradicts: null },
      { fact_id: "F-RX-PR", key: "diagnosis.pr", label: "PR", value: CASE.tumour.ihc.pr, group: "diagnosis", specialty: "pathology", confidence: 0.99, phase: 1, source_docs: ["DOC-PATH-26S-08421"], contradicts: null },
      { fact_id: "F-RX-HER2", key: "diagnosis.her2", label: "HER2", value: `IHC ${CASE.tumour.ihc.her2_ihc}, FISH ratio ${CASE.tumour.her2_fish.ratio} → ${CASE.tumour.her2_fish.result}`, group: "diagnosis", specialty: "pathology", confidence: 0.99, phase: 1, source_docs: ["DOC-PATH-26S-08421"], contradicts: null },
      { fact_id: "F-RX-KI67", key: "diagnosis.ki67", label: "Ki-67", value: CASE.tumour.ihc.ki67, group: "diagnosis", specialty: "pathology", confidence: 0.95, phase: 1, source_docs: ["DOC-PATH-26S-08421"], contradicts: null },
      // Genomics
      { fact_id: "F-GEN-PIK3CA", key: "genomics.pik3ca", label: "PIK3CA p.H1047R", value: "VAF 28%, OncoKB Level 1", group: "genomics", specialty: "med-onc", confidence: 0.95, phase: 1, source_docs: ["DOC-NGS-FMI-26-018342"], contradicts: null },
      { fact_id: "F-GEN-TMB", key: "genomics.tmb", label: "TMB", value: "4 mut/Mb (low)", group: "genomics", specialty: "med-onc", confidence: 0.95, phase: 1, source_docs: ["DOC-NGS-FMI-26-018342"], contradicts: null },
      { fact_id: "F-GEN-MSI", key: "genomics.msi", label: "MSI", value: "MSS", group: "genomics", specialty: "med-onc", confidence: 0.95, phase: 1, source_docs: ["DOC-NGS-FMI-26-018342"], contradicts: null },
      { fact_id: "F-GEN-BRCA", key: "genomics.brca", label: "BRCA1/2", value: "Wild-type", group: "genomics", specialty: "med-onc", confidence: 0.95, phase: 1, source_docs: ["DOC-NGS-FMI-26-018342"], contradicts: null },
      // Imaging
      { fact_id: "F-IMG-PRIMARY", key: "imaging.primary", label: "Primary mass", value: "32 mm spiculated R UOQ, BI-RADS 5", group: "imaging", specialty: "radiology", confidence: 0.95, phase: 1, source_docs: ["DOC-RAD-26R-MAM-19432"], contradicts: null },
      { fact_id: "F-IMG-NODES", key: "imaging.nodes", label: "Axillary nodes", value: "Two abnormal R level I (largest 14 mm), BI-RADS 4C", group: "imaging", specialty: "radiology", confidence: 0.9, phase: 1, source_docs: ["DOC-RAD-26R-MAM-19432"], contradicts: null },
      // PHASE-2 imaging fact
      { fact_id: "F-IMG-LUNG-METS", key: "imaging.distant.lung", label: "Pulmonary nodules", value: "3 bilateral upper lobe nodules, 5–14 mm, suspicious for metastatic disease", group: "imaging", specialty: "radiology", confidence: 0.9, phase: 2, source_docs: ["DOC-CT-26R-CT-21588"], contradicts: null },
      // Staging
      { fact_id: "F-STG-CT", key: "staging.ct", label: "cT", value: "cT2 (32 mm)", group: "staging", specialty: "med-onc", confidence: 0.95, phase: 1, source_docs: ["DOC-RAD-26R-MAM-19432", "DOC-CONS-26C-MO-22884"], contradicts: null },
      { fact_id: "F-STG-CN", key: "staging.cn", label: "cN", value: "cN1", group: "staging", specialty: "med-onc", confidence: 0.9, phase: 1, source_docs: ["DOC-RAD-26R-MAM-19432", "DOC-CONS-26C-MO-22884"], contradicts: null },
      { fact_id: "F-STG-CM-P1", key: "staging.cm", label: "cM (Phase 1)", value: "cM0 (clinical, pending)", group: "staging", specialty: "med-onc", confidence: 0.6, phase: 1, source_docs: ["DOC-CONS-26C-MO-22884"], contradicts: null },
      { fact_id: "F-STG-CM-P2", key: "staging.cm", label: "cM (Phase 2)", value: "cM1 (lung)", group: "staging", specialty: "med-onc", confidence: 0.95, phase: 2, source_docs: ["DOC-CT-26R-CT-21588"], contradicts: "F-STG-CM-P1" },
      { fact_id: "F-STG-OVERALL-P1", key: "staging.overall", label: "Overall stage (Phase 1)", value: "Stage IIB (provisional)", group: "staging", specialty: "med-onc", confidence: 0.6, phase: 1, source_docs: ["DOC-CONS-26C-MO-22884"], contradicts: null },
      { fact_id: "F-STG-OVERALL-P2", key: "staging.overall", label: "Overall stage (Phase 2)", value: "Stage IV — de novo MBC", group: "staging", specialty: "med-onc", confidence: 0.95, phase: 2, source_docs: ["DOC-CT-26R-CT-21588"], contradicts: "F-STG-OVERALL-P1" },
      // Lab
      { fact_id: "F-LAB-HGB", key: "lab.hgb", label: "Haemoglobin", value: "11.2 g/dL (mild anaemia)", group: "lab", specialty: "med-onc", confidence: 1.0, phase: 1, source_docs: ["DOC-LAB-26L-04157"], contradicts: null },
      { fact_id: "F-LAB-CA15-3", key: "lab.ca15-3", label: "CA 15-3", value: "92 U/mL (ref <30) — elevated", group: "lab", specialty: "med-onc", confidence: 1.0, phase: 1, source_docs: ["DOC-LAB-26L-04157"], contradicts: null },
      { fact_id: "F-LAB-LVEF", key: "lab.lvef", label: "LVEF (echo)", value: "62% (normal, baseline)", group: "lab", specialty: "cardiology", confidence: 1.0, phase: 1, source_docs: ["DOC-LAB-26L-04157"], contradicts: null },
      // Treatment
      { fact_id: "F-RX-INTENT-P1", key: "treatment.intent", label: "Treatment intent (Phase 1)", value: "Curative", group: "medication", specialty: "med-onc", confidence: 0.7, phase: 1, source_docs: ["DOC-CONS-26C-MO-22884"], contradicts: null },
      { fact_id: "F-RX-INTENT-P2", key: "treatment.intent", label: "Treatment intent (Phase 2)", value: "Palliative — disease control", group: "medication", specialty: "med-onc", confidence: 0.95, phase: 2, source_docs: ["DOC-CT-26R-CT-21588"], contradicts: "F-RX-INTENT-P1" },
      { fact_id: "F-RX-PLAN-P1", key: "treatment.plan", label: "Treatment plan (Phase 1)", value: "AC-T → surgery → adjuvant letrozole + abemaciclib", group: "medication", specialty: "med-onc", confidence: 0.7, phase: 1, source_docs: ["DOC-CONS-26C-MO-22884"], contradicts: null },
      { fact_id: "F-RX-PLAN-P2", key: "treatment.plan", label: "Treatment plan (Phase 2)", value: "1L letrozole + ribociclib", group: "medication", specialty: "med-onc", confidence: 0.95, phase: 2, source_docs: ["DOC-CT-26R-CT-21588"], contradicts: "F-RX-PLAN-P1" },
      // Demographics
      { fact_id: "F-DEM-AGE", key: "demographics.age", label: "Age", value: "52 (postmenopausal)", group: "demographics", specialty: "med-onc", confidence: 1.0, phase: 1, source_docs: ["DOC-CONS-26C-MO-22884", "DOC-INTAKE-26-MBC-0042-001"], contradicts: null },
      // History
      { fact_id: "F-HIST-FAM", key: "history.family", label: "Family history", value: "Mother — breast Ca @ 64 ER+; maternal aunt — ovarian Ca @ 58", group: "history", specialty: "genetics", confidence: 0.95, phase: 1, source_docs: ["DOC-CONS-26C-MO-22884", "DOC-INTAKE-26-MBC-0042-001"], contradicts: null },
    ];
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MERGE (f:Fact {fact_id: r.fact_id})
       SET f.key = r.key, f.label = r.label, f.value = r.value,
           f.group = r.group, f.specialty = r.specialty, f.confidence = r.confidence,
           f.phase = r.phase, f.caption = r.label + ": " + r.value
       WITH f, r
       MATCH (p:Patient {mrn: $mrn})
       MERGE (p)-[:HAS_FACT {phase: r.phase, group: r.group}]->(f)`,
      facts,
      { mrn: PATIENT_MRN }
    );
    // Provenance: Fact → Document and Document → Fact
    const provRows: { fact_id: string; doc_id: string }[] = [];
    for (const f of facts) for (const d of f.source_docs) provRows.push({ fact_id: f.fact_id, doc_id: d });
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (f:Fact {fact_id: r.fact_id}), (d:Document {doc_id: r.doc_id})
       MERGE (f)-[:DERIVED_FROM]->(d)
       MERGE (d)-[:CONTAINS_FACT]->(f)`,
      provRows
    );
    // Fact-level contradictions
    const contradicts = facts.filter((f) => f.contradicts).map((f) => ({ a: f.fact_id, b: f.contradicts! }));
    await batchUnwind(
      s,
      `UNWIND $rows AS r
       MATCH (a:Fact {fact_id: r.a}), (b:Fact {fact_id: r.b})
       MERGE (a)-[:CONTRADICTS_FACT]->(b)
       MERGE (a)-[:SUPERSEDES]->(b)`,
      contradicts
    );

    // ── 21. Cross-document REFERENCES (a few hand-picked) ──────────────────
    await runWrite(
      s,
      `MATCH (a:Document {doc_id: "DOC-RAD-26R-MAM-19432"}), (b:Document {doc_id: "DOC-PATH-26S-08421"})
       MERGE (a)-[:REFERENCES {reason: "biopsy follow-up"}]->(b)`
    );
    await runWrite(
      s,
      `MATCH (a:Document {doc_id: "DOC-CONS-26C-MO-22884"}), (b:Document {doc_id: "DOC-PATH-26S-08421"})
       MERGE (a)-[:REFERENCES {reason: "diagnosis basis"}]->(b)`
    );
    await runWrite(
      s,
      `MATCH (a:Document {doc_id: "DOC-CONS-26C-MO-22884"}), (b:Document {doc_id: "DOC-NGS-FMI-26-018342"})
       MERGE (a)-[:REFERENCES {reason: "NGS data"}]->(b)`
    );

    // ── 22. Final summary ───────────────────────────────────────────────────
    console.log("\n──────────── Summary ────────────");
    const labelCounts = await s.run(`
      MATCH (n) UNWIND labels(n) AS label
      RETURN label, count(*) AS n
      ORDER BY n DESC
    `);
    console.log("Nodes by label:");
    for (const r of labelCounts.records) {
      console.log(`  ${r.get("label").padEnd(22)} ${r.get("n")}`);
    }
    const relCounts = await s.run(`
      MATCH ()-[r]->() RETURN type(r) AS rel, count(*) AS n ORDER BY n DESC
    `);
    console.log("\nRelationships by type:");
    for (const r of relCounts.records) {
      console.log(`  ${r.get("rel").padEnd(22)} ${r.get("n")}`);
    }
    const totals = await s.run(`
      MATCH (n) WITH count(n) AS nodes
      MATCH ()-[r]->() RETURN nodes, count(r) AS rels
    `);
    const t = totals.records[0];
    console.log(`\nTotal nodes: ${t.get("nodes")}`);
    console.log(`Total relationships: ${t.get("rels")}`);
  });

  await driver.close();
  console.log("\n✓ Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
