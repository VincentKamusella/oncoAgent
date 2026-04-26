import type { Patient, Fact, AvatarTone, Specialty, SourceKind } from "../types";
import type { IngestCategory } from "./classify";
import { hash, slugSuffix } from "./util";
import {
  cloneLindaPhase1,
  LINDA_DETECTION_RE,
  LINDA_MRN,
} from "./linda-phase1";

export type ClassifiedFile = {
  fileName: string;
  category: IngestCategory;
  detected: string;
  facts: number;
  conflict?: boolean;
};

export type CreatePatientInput = {
  name: string;
  mrn: string;
  cancerType: string;
  tumorBoard?: string;
  files: ClassifiedFile[];
};

const TONE_BY_INDEX: AvatarTone[] = ["violet", "rose", "amber", "emerald", "sky"];

const SPECIALTY: Record<IngestCategory, Specialty | undefined> = {
  pathology: "pathology",
  radiology: "radiology",
  genomics: "molecular",
  labs: "med-onc",
  notes: "med-onc",
  communications: "nursing",
  operational: "nursing",
  reference: undefined,
};

const SOURCE_KIND: Record<IngestCategory, SourceKind> = {
  pathology: "pathology",
  radiology: "imaging",
  genomics: "genomics",
  labs: "lab",
  notes: "note",
  communications: "email",
  operational: "report",
  reference: "report",
};

const FACT_GROUP: Record<IngestCategory, Fact["group"]> = {
  pathology: "diagnosis",
  radiology: "imaging",
  genomics: "genomics",
  labs: "lab",
  notes: "history",
  communications: "history",
  operational: "history",
  reference: "history",
};

type FactTemplate = { label: string; value: string };

const TEMPLATES: Record<IngestCategory, FactTemplate[]> = {
  pathology: [
    { label: "Histologic type", value: "Invasive ductal carcinoma" },
    { label: "Tumor grade", value: "Nottingham grade 2 (3+3+1=7)" },
    { label: "Tumor size (gross)", value: "2.3 cm in greatest dimension" },
    { label: "Lymphovascular invasion", value: "Not identified" },
    { label: "Margin status", value: "Not assessed on core" },
    { label: "ER status", value: "Positive — 95% strong nuclear staining" },
    { label: "PR status", value: "Positive — 60% moderate" },
    { label: "HER2 (IHC)", value: "1+ — negative" },
    { label: "Ki-67 proliferation index", value: "18%" },
  ],
  radiology: [
    { label: "Primary lesion", value: "2.4 cm enhancing mass, 2 o'clock left breast" },
    { label: "Axillary nodes", value: "1 suspicious left axillary level I node, 1.1 cm" },
    { label: "Internal mammary nodes", value: "No abnormal enlargement" },
    { label: "Contralateral breast", value: "No suspicious findings" },
    { label: "Distant disease", value: "No definite metastatic disease on staging CT" },
    { label: "Liver", value: "Unremarkable" },
    { label: "Bones", value: "No lytic or sclerotic lesions" },
    { label: "Clinical stage", value: "cT2 cN1 cM0 — Stage IIB" },
  ],
  genomics: [
    { label: "PIK3CA", value: "H1047R · VAF 0.18" },
    { label: "TP53", value: "Wild type" },
    { label: "ESR1", value: "Wild type" },
    { label: "BRCA1/2 (germline)", value: "No pathogenic variant" },
    { label: "TMB", value: "5 mut/Mb (low)" },
    { label: "MSI status", value: "Stable" },
    { label: "HRD score", value: "Negative" },
    { label: "Actionable alterations", value: "PIK3CA H1047R" },
  ],
  labs: [
    { label: "Hemoglobin", value: "12.8 g/dL" },
    { label: "WBC", value: "5.6 ×10⁹/L" },
    { label: "Platelets", value: "246 ×10⁹/L" },
    { label: "Creatinine", value: "0.78 mg/dL" },
    { label: "ALT", value: "22 U/L" },
    { label: "AST", value: "19 U/L" },
    { label: "Alkaline phosphatase", value: "84 U/L" },
    { label: "CA 15-3", value: "32 U/mL (slightly elevated)" },
    { label: "CEA", value: "1.4 ng/mL" },
  ],
  notes: [
    { label: "Performance status", value: "ECOG 0" },
    { label: "Symptoms at presentation", value: "Self-detected painless lump, 6 weeks" },
    { label: "Family history", value: "Maternal aunt — breast cancer at 58" },
    { label: "Comorbidities", value: "Mild hypertension, controlled" },
    { label: "Allergies", value: "NKDA" },
    { label: "Reproductive history", value: "G2P2, postmenopausal" },
  ],
  communications: [
    { label: "Referring physician", value: "Dr. M. Bauer (OB/GYN)" },
    { label: "Patient preferred contact", value: "Phone — German preferred" },
    { label: "Coordinator assigned", value: "K. Schwarz, RN" },
  ],
  operational: [
    { label: "Treatment regimen (planned)", value: "AC-T neoadjuvant — q3w × 4, weekly paclitaxel × 12" },
    { label: "Cycle 1 scheduled", value: "Within 14 days of port placement" },
    { label: "Prior authorization", value: "Approved — neoadjuvant AC-T" },
    { label: "Port placement", value: "Scheduled — IR clinic" },
  ],
  reference: [
    { label: "Pathway", value: "HR+ locoregional breast cancer" },
    { label: "Formulary tier", value: "Standard — no exceptions required" },
  ],
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ageFromMrn(mrn: string): number {
  const seed = hash(mrn);
  return 38 + (seed % 32);
}

function dobFromAge(age: number): string {
  const year = new Date().getFullYear() - age;
  return `${year}-04-12`;
}

function sexFor(cancerType: string): Patient["sex"] {
  const t = cancerType.toLowerCase();
  if (/breast|ovarian|cervical|uterine/.test(t)) return "F";
  if (/prostate|testic/.test(t)) return "M";
  return "F";
}

function cancerLabelFor(cancerType: string, files: ClassifiedFile[]): string {
  const hasGenomics = files.some((f) => f.category === "genomics");
  const t = cancerType.trim();
  return hasGenomics ? `${t} cancer · Active workup` : `${t} cancer · Active`;
}

export function buildPatient(input: CreatePatientInput): Patient {
  // Linda Hoffmann is the demo case-study patient — swap the generic
  // templated profile for the hand-crafted Phase-1 record sourced from
  // mama_ca/.build/case.json so her vault matches Maria's depth.
  const normalizedMrn = input.mrn.replace(/[\s_]+/g, "-").toUpperCase();
  const isLinda =
    normalizedMrn === LINDA_MRN ||
    LINDA_DETECTION_RE.test(input.name) ||
    input.files.some((f) => LINDA_DETECTION_RE.test(f.fileName));
  if (isLinda) {
    return cloneLindaPhase1({
      files: input.files,
      tumorBoard: input.tumorBoard,
      fallbackMrn: input.mrn,
    });
  }

  const slug = `${slugify(input.name)}-${slugSuffix(input.mrn)}`;
  const initials = initialsOf(input.name);
  const age = ageFromMrn(input.mrn);
  const dob = dobFromAge(age);

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const facts: Fact[] = [];
  let factIdx = 0;

  for (const file of input.files) {
    if (file.category === "reference") continue; // org context, not patient facts
    const templates = TEMPLATES[file.category] ?? [];
    if (!templates.length) continue;

    // Each file contributes 2–3 representative facts (cycled through templates).
    const contribution = Math.min(templates.length, file.category === "communications" ? 1 : 3);
    const start = hash(file.fileName) % templates.length;

    for (let i = 0; i < contribution; i++) {
      const tpl = templates[(start + i) % templates.length];
      const id = `f-${slug}-${factIdx++}`;
      facts.push({
        id,
        key: `${FACT_GROUP[file.category]}.${tpl.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${factIdx}`,
        label: tpl.label,
        value: tpl.value,
        confidence: 0.88 + (hash(id) % 12) / 100,
        group: FACT_GROUP[file.category],
        specialty: SPECIALTY[file.category],
        source: {
          kind: SOURCE_KIND[file.category],
          id: `src-${slug}-${file.fileName}`,
          label: file.fileName,
          at: now,
          specialty: SPECIALTY[file.category],
        },
        updatedAt: now,
      });
    }
  }

  // Deduplicate by label — multiple files in the same category often produce
  // the same templated label, but we keep the highest-confidence representative
  // so the vault summary doesn't list the same fact a dozen times.
  const byLabel = new Map<string, Fact>();
  for (const f of facts) {
    const existing = byLabel.get(f.label);
    if (!existing || f.confidence > existing.confidence) byLabel.set(f.label, f);
  }
  const dedupedFacts = Array.from(byLabel.values());

  const stagingFact = dedupedFacts.find((f) => f.label === "Clinical stage");
  const histologyFact = dedupedFacts.find((f) => f.label === "Histologic type");
  const regimenFact = dedupedFacts.find((f) => f.label === "Treatment regimen (planned)");

  const vaultAvatars = TONE_BY_INDEX.slice(0, 3).map((tone, i) => ({
    initials: ["MD", "RN", "MO"][i],
    tone,
  }));

  return {
    id: slug,
    name: input.name,
    initials,
    dob,
    age,
    sex: sexFor(input.cancerType),
    mrn: input.mrn,
    status: "active",
    cancerType: slugify(input.cancerType),
    cancerLabel: cancerLabelFor(input.cancerType, input.files),
    diagnosis: histologyFact?.value ?? "Awaiting pathology confirmation",
    staging: stagingFact?.value ?? "Pending staging workup",
    primaryOncologist: input.tumorBoard?.length ? input.tumorBoard : "To be assigned",
    caseOpenedAt: today,
    avatarTone: "violet",
    vaultAvatars,
    facts: dedupedFacts,
    plan: regimenFact
      ? [
          {
            id: `ph-${slug}-1`,
            name: "Neoadjuvant chemotherapy",
            type: "chemo",
            regimen: regimenFact.value,
            status: "planned",
            startDate: today,
            rationale: "First-line per institutional pathway",
          },
        ]
      : [],
    agent: {
      now: { action: "Building vault index" },
      needsYou: [],
      recent: input.files.slice(0, 4).map((f, i) => ({
        id: `ev-${slug}-${i}`,
        action: `Ingested ${f.detected.toLowerCase()} from ${f.fileName}`,
        at: now,
      })),
    },
  };
}
