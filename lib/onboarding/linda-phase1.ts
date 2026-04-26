import type {
  BoardCase,
  Fact,
  Patient,
  TreatmentOption,
} from "../types";
import { slugSuffix } from "./util";

export const LINDA_MRN = "MBC-2026-0042";
export const LINDA_DETECTION_RE = /MBC[-_]?2026[-_]?0042|linda[-_]?hoffmann/i;
export const STAGING_CT_RE =
  /staging.?ct|02_staging_ct|ct[-_ ]?(?:cap|chest|abdom|thorax|axial|coronal|sagittal)/i;

const ISO_INGEST = "2026-04-22T11:00:00Z";

const factsLinda: Fact[] = [
  {
    id: "f-lh-name",
    key: "demographics.name",
    label: "Name",
    value: "Linda Hoffmann",
    confidence: 1,
    group: "demographics",
    specialty: "nursing",
    source: {
      kind: "report",
      id: "doc-lh-intake",
      label: "Intake form · 2026-04-22",
      excerpt: "Patient: Linda Hoffmann, DOB 1973-08-14, female",
      at: "2026-04-22T08:30:00Z",
      author: "Reception",
    },
    updatedAt: "2026-04-22T08:30:00Z",
  },
  {
    id: "f-lh-mrn",
    key: "demographics.mrn",
    label: "MRN",
    value: "MBC-2026-0042",
    confidence: 1,
    group: "demographics",
    specialty: "nursing",
    source: {
      kind: "report",
      id: "doc-lh-intake",
      label: "EHR registration",
      at: "2026-04-22T08:30:00Z",
    },
    updatedAt: "2026-04-22T08:30:00Z",
  },
  {
    id: "f-lh-meno",
    key: "demographics.menopausal",
    label: "Menopausal status",
    value: "Postmenopausal",
    confidence: 0.99,
    group: "demographics",
    specialty: "nursing",
    source: {
      kind: "report",
      id: "doc-lh-intake-form",
      label: "health_questionnaire_2026-04-22.md",
      at: "2026-04-22T09:00:00Z",
      author: "Patient self-report",
    },
    updatedAt: "2026-04-22T09:00:00Z",
  },
  {
    id: "f-lh-dx",
    key: "diagnosis.primary",
    label: "Primary diagnosis",
    value: "Invasive ductal carcinoma (NST), right breast, upper outer quadrant",
    confidence: 0.99,
    group: "diagnosis",
    specialty: "pathology",
    source: {
      kind: "pathology",
      id: "path-lh-001",
      label: "Core biopsy report · 2026-03-25",
      excerpt:
        "Microscopic: invasive ductal carcinoma, NST. Tumour 32 mm. Right breast, 10 o'clock, 6 cm from nipple. LVI not identified.",
      author: "Dr. R. Patel, MD — Surgical Pathology",
      at: "2026-03-25T14:30:00Z",
    },
    updatedAt: "2026-03-25T14:30:00Z",
  },
  {
    id: "f-lh-grade",
    key: "diagnosis.grade",
    label: "Nottingham grade",
    value: "Grade 2 (tubules 3 + nuclei 2 + mitoses 2 = 7)",
    confidence: 0.98,
    group: "diagnosis",
    specialty: "pathology",
    source: {
      kind: "pathology",
      id: "path-lh-001",
      label: "Core biopsy report · 2026-03-25",
      author: "Dr. R. Patel, MD",
      at: "2026-03-25T14:30:00Z",
    },
    updatedAt: "2026-03-25T14:30:00Z",
  },
  {
    id: "f-lh-receptors",
    key: "diagnosis.receptors",
    label: "Receptor status",
    value:
      "ER+ (95%, 3+) · PR+ (70%, 2+) · HER2-low (IHC 1+, FISH ratio 1.4 not amplified) · Ki-67 25%",
    confidence: 0.98,
    group: "diagnosis",
    specialty: "pathology",
    source: {
      kind: "pathology",
      id: "path-lh-001",
      label: "Core biopsy report · 2026-03-25",
      excerpt:
        "ER 95% strong, PR 70% moderate, HER2 IHC 1+; FISH HER2/CEP17 ratio 1.4 — not amplified (HER2-low).",
      author: "Dr. R. Patel, MD",
      at: "2026-03-25T14:30:00Z",
    },
    updatedAt: "2026-03-25T14:30:00Z",
  },
  {
    id: "f-lh-ct",
    key: "staging.ct",
    label: "T descriptor",
    value: "cT2 (32 mm)",
    confidence: 0.95,
    group: "staging",
    specialty: "radiology",
    source: {
      kind: "imaging",
      id: "img-lh-mri-001",
      label: "Mammo / US / MRI · 2026-03-19",
      excerpt:
        "32 mm spiculated mass, right breast UOQ. No multifocal disease. Staging studies pending.",
      author: "Dr. K. Lee, Radiology",
      at: "2026-03-19T16:40:00Z",
    },
    updatedAt: "2026-03-19T16:40:00Z",
  },
  {
    id: "f-lh-cn",
    key: "staging.cn",
    label: "N descriptor",
    value: "cN1 (2 suspicious right axillary level I nodes; largest 14 mm)",
    confidence: 0.9,
    group: "staging",
    specialty: "radiology",
    source: {
      kind: "imaging",
      id: "img-lh-mri-001",
      label: "Mammo / US / MRI · 2026-03-19",
      author: "Dr. K. Lee, Radiology",
      at: "2026-03-19T16:40:00Z",
    },
    updatedAt: "2026-03-19T16:40:00Z",
  },
  {
    id: "f-lh-cm",
    key: "staging.cm",
    label: "M descriptor",
    value: "cM0 (clinical, pending — staging CT not yet performed)",
    confidence: 0.55,
    group: "staging",
    specialty: "radiology",
    source: {
      kind: "note",
      id: "note-lh-consult",
      label: "Initial consult note · 2026-04-22",
      excerpt:
        "Provisional cM0; staging CT chest/abdomen/pelvis ordered, results pending.",
      author: "Dr. J. Schroeder, Med-Onc",
      at: "2026-04-22T10:48:00Z",
    },
    updatedAt: "2026-04-22T10:48:00Z",
  },
  {
    id: "f-lh-stage",
    key: "staging.clinical",
    label: "Clinical stage",
    value: "cT2 cN1 cM0 — Stage IIB (clinical, pending staging)",
    confidence: 0.7,
    group: "staging",
    specialty: "med-onc",
    source: {
      kind: "note",
      id: "note-lh-consult",
      label: "Initial consult note · 2026-04-22",
      author: "Dr. J. Schroeder, Med-Onc",
      at: "2026-04-22T10:48:00Z",
    },
    updatedAt: "2026-04-22T10:48:00Z",
  },
  {
    id: "f-lh-regimen",
    key: "medication.neoadjuvant",
    label: "Neoadjuvant regimen (planned)",
    value:
      "AC-T dose-dense — doxorubicin 60 mg/m² + cyclophosphamide 600 mg/m² q3w × 4 → paclitaxel 80 mg/m² weekly × 12",
    confidence: 0.92,
    group: "medication",
    specialty: "med-onc",
    source: {
      kind: "note",
      id: "note-lh-consult",
      label: "Initial consult note · 2026-04-22",
      excerpt:
        "Plan: neoadjuvant AC-T → lumpectomy + SLNB → adjuvant letrozole + abemaciclib per KSZ-CP-BR-001.",
      author: "Dr. J. Schroeder, Med-Onc",
      at: "2026-04-22T10:48:00Z",
    },
    updatedAt: "2026-04-22T10:48:00Z",
  },
  {
    id: "f-lh-prior-auth",
    key: "medication.prior-auth",
    label: "Prior authorisation",
    value: "PA-26-AT-9921 (AC-T regimen) — approved 2026-04-21",
    confidence: 0.97,
    group: "medication",
    specialty: "med-onc",
    source: {
      kind: "report",
      id: "pa-lh-act-001",
      label: "prior_auth_AC-T_regimen.json",
      at: "2026-04-21T14:00:00Z",
      author: "Pharmacy / billing",
    },
    updatedAt: "2026-04-21T14:00:00Z",
  },
  {
    id: "f-lh-ca15",
    key: "lab.tumor-marker.ca15-3",
    label: "CA 15-3",
    value: "92 U/mL (ref < 30) — elevated, correlate with staging studies",
    confidence: 0.85,
    group: "lab",
    specialty: "med-onc",
    source: {
      kind: "lab",
      id: "lab-lh-tm-001",
      label: "Baseline labs · 2026-04-15",
      excerpt:
        "CA 15-3 92, CA 27.29 58, CEA 6.1. Markers elevated above reference range — recommend correlation with staging studies.",
      author: "Dr. T. Becker, Lab Medicine",
      at: "2026-04-15T08:00:00Z",
    },
    updatedAt: "2026-04-15T08:00:00Z",
  },
  {
    id: "f-lh-ca27",
    key: "lab.tumor-marker.ca27-29",
    label: "CA 27.29",
    value: "58 U/mL (ref < 38) — elevated",
    confidence: 0.85,
    group: "lab",
    specialty: "med-onc",
    source: {
      kind: "lab",
      id: "lab-lh-tm-001",
      label: "Baseline labs · 2026-04-15",
      author: "Dr. T. Becker, Lab Medicine",
      at: "2026-04-15T08:00:00Z",
    },
    updatedAt: "2026-04-15T08:00:00Z",
  },
  {
    id: "f-lh-cea",
    key: "lab.tumor-marker.cea",
    label: "CEA",
    value: "6.1 ng/mL (ref < 5.0) — mildly elevated",
    confidence: 0.85,
    group: "lab",
    specialty: "med-onc",
    source: {
      kind: "lab",
      id: "lab-lh-tm-001",
      label: "Baseline labs · 2026-04-15",
      author: "Dr. T. Becker, Lab Medicine",
      at: "2026-04-15T08:00:00Z",
    },
    updatedAt: "2026-04-15T08:00:00Z",
  },
  {
    id: "f-lh-lvef",
    key: "lab.lvef",
    label: "LVEF (echo)",
    value: "62% — within normal limits",
    confidence: 0.99,
    group: "lab",
    specialty: "med-onc",
    source: {
      kind: "report",
      id: "echo-lh-001",
      label: "Echocardiogram · 2026-04-15",
      author: "Dr. A. Singh, Cardiology",
      at: "2026-04-15T09:30:00Z",
    },
    updatedAt: "2026-04-15T09:30:00Z",
  },
  {
    id: "f-lh-presentation",
    key: "history.event.first-presentation",
    label: "First presentation",
    value: "Self-detected painless lump, right breast — 2026-03-10",
    confidence: 0.95,
    group: "history",
    specialty: "nursing",
    source: {
      kind: "email",
      id: "eml-lh-referral",
      label: "2026-03-10_referral_gp_to_medonc.eml",
      at: "2026-03-10T10:00:00Z",
      author: "Dr. M. Bauer (GP)",
    },
    updatedAt: "2026-03-10T10:00:00Z",
  },
  {
    id: "f-lh-fhx",
    key: "history.family",
    label: "Family history",
    value: "Maternal aunt — breast cancer at age 58",
    confidence: 0.9,
    group: "history",
    specialty: "nursing",
    source: {
      kind: "report",
      id: "doc-lh-intake-form",
      label: "health_questionnaire_2026-04-22.md",
      author: "Patient self-report",
      at: "2026-04-22T09:00:00Z",
    },
    updatedAt: "2026-04-22T09:00:00Z",
  },
  {
    id: "f-lh-ngs",
    key: "genomics.panel",
    label: "NGS panel (FoundationOne CDx)",
    value:
      "PIK3CA p.H1047R (VAF 28%, Level 1 actionable) · TP53/BRCA1/BRCA2/ESR1 wild-type · TMB 4 mut/Mb · MSS · HRD negative",
    confidence: 0.95,
    group: "genomics",
    specialty: "pathology",
    source: {
      kind: "genomics",
      id: "ngs-lh-001",
      label: "FoundationOne CDx report · 2026-04-08",
      excerpt:
        "Reportable: PIK3CA c.3140A>G p.H1047R (VAF 28%) — activating missense, Level 1 (alpelisib + fulvestrant in HR+/HER2- MBC). TMB 4. MSS. HRD negative.",
      author: "Dr. A. Tanaka, Foundation Medicine",
      at: "2026-04-08T12:00:00Z",
      specialty: "pathology",
    },
    updatedAt: "2026-04-08T12:00:00Z",
  },
  {
    id: "f-lh-oncokb",
    key: "genomics.oncokb",
    label: "OncoKB therapeutic level",
    value: "PIK3CA H1047R · Level 1 (alpelisib + fulvestrant in HR+/HER2-)",
    confidence: 0.92,
    group: "genomics",
    specialty: "pathology",
    source: {
      kind: "genomics",
      id: "oncokb-lh-001",
      label: "OncoKB lookup · 2026-04-09",
      author: "OncoKB v4.20",
      at: "2026-04-09T08:30:00Z",
      specialty: "pathology",
    },
    updatedAt: "2026-04-09T08:30:00Z",
  },
  {
    id: "f-lh-ecog",
    key: "demographics.performance",
    label: "Performance status",
    value: "ECOG 0",
    confidence: 0.97,
    group: "demographics",
    specialty: "med-onc",
    source: {
      kind: "note",
      id: "note-lh-consult",
      label: "Initial consult note · 2026-04-22",
      author: "Dr. J. Schroeder, Med-Onc",
      at: "2026-04-22T10:48:00Z",
    },
    updatedAt: "2026-04-22T10:48:00Z",
  },
  {
    id: "f-lh-allergy",
    key: "history.allergies",
    label: "Allergies",
    value: "NKDA",
    confidence: 1,
    group: "history",
    specialty: "nursing",
    source: {
      kind: "report",
      id: "doc-lh-allergies",
      label: "allergies.csv (CRM)",
      author: "Reception",
      at: "2026-04-22T08:30:00Z",
    },
    updatedAt: "2026-04-22T08:30:00Z",
  },
  {
    id: "f-lh-comorbid",
    key: "history.comorbidities",
    label: "Comorbidities",
    value: "Mild hypertension (controlled, lisinopril 10 mg)",
    confidence: 0.95,
    group: "history",
    specialty: "med-onc",
    source: {
      kind: "report",
      id: "doc-lh-problems",
      label: "problems.csv (CRM)",
      author: "Dr. M. Bauer (GP)",
      at: "2026-04-22T08:30:00Z",
    },
    updatedAt: "2026-04-22T08:30:00Z",
  },
  {
    id: "f-lh-repro",
    key: "history.reproductive",
    label: "Reproductive history",
    value: "G2P2 · postmenopausal since 2020",
    confidence: 0.95,
    group: "history",
    specialty: "nursing",
    source: {
      kind: "report",
      id: "doc-lh-intake-form",
      label: "health_questionnaire_2026-04-22.md",
      author: "Patient self-report",
      at: "2026-04-22T09:00:00Z",
    },
    updatedAt: "2026-04-22T09:00:00Z",
  },
  {
    id: "f-lh-surg-consult",
    key: "history.surg-consult",
    label: "Surgical consult",
    value:
      "Candidate for BCS + SLNB pending neoadjuvant response; reassess at mid-cycle MRI",
    confidence: 0.88,
    group: "history",
    specialty: "med-onc",
    source: {
      kind: "note",
      id: "note-lh-surg-1",
      label: "Surgical oncology note · 2026-04-23",
      excerpt:
        "32 mm tumour, UOQ. BCS feasible if ≥ 50% volumetric response. SLNB at time of surgery.",
      author: "Dr. S. Chen, Surgical Onc",
      at: "2026-04-23T10:30:00Z",
    },
    updatedAt: "2026-04-23T10:30:00Z",
  },
  {
    id: "f-lh-rt-consult",
    key: "history.rt-consult",
    label: "Radiation oncology consult",
    value:
      "Whole-breast RT post-lumpectomy planned (40.05 Gy / 15 fx); boost if margins narrow",
    confidence: 0.87,
    group: "history",
    specialty: "radiology",
    source: {
      kind: "note",
      id: "note-lh-rt-1",
      label: "Rad-onc consult · 2026-04-23",
      author: "Dr. K. Lee, Rad-Onc",
      at: "2026-04-23T15:00:00Z",
      specialty: "radiology",
    },
    updatedAt: "2026-04-23T15:00:00Z",
  },
  {
    id: "f-lh-pharm",
    key: "medication.pharmacy-review",
    label: "Pharmacy review",
    value:
      "AC-T doses verified vs BSA 1.71 · no QTc / renal flags · pre-meds dexa + ondansetron + aprepitant",
    confidence: 0.97,
    group: "medication",
    specialty: "med-onc",
    source: {
      kind: "note",
      id: "note-lh-pharm-1",
      label: "Clinical pharmacy review · 2026-04-23",
      excerpt:
        "Doxorubicin 60 mg/m² → 103 mg. Cyclophosphamide 600 mg/m² → 1026 mg. Paclitaxel 80 mg/m² weekly → 137 mg. No interactions w/ home meds.",
      author: "PharmD A. Riesgo",
      at: "2026-04-23T16:00:00Z",
    },
    updatedAt: "2026-04-23T16:00:00Z",
  },
  {
    id: "f-lh-cbc-hgb",
    key: "lab.cbc.hgb",
    label: "Haemoglobin (baseline)",
    value: "11.2 g/dL — mild normocytic anaemia",
    confidence: 0.99,
    group: "lab",
    specialty: "med-onc",
    source: {
      kind: "lab",
      id: "lab-lh-cbc-1",
      label: "Baseline CBC · 2026-04-15",
      excerpt: "WBC 5.4 · ANC 3.2 · Hgb 11.2 · Plt 248",
      author: "Dr. T. Becker, Lab Medicine",
      at: "2026-04-15T08:00:00Z",
    },
    updatedAt: "2026-04-15T08:00:00Z",
  },
  {
    id: "f-lh-cbc-anc",
    key: "lab.cbc.anc",
    label: "ANC (baseline)",
    value: "3.2 ×10⁹/L",
    confidence: 0.99,
    group: "lab",
    specialty: "med-onc",
    source: {
      kind: "lab",
      id: "lab-lh-cbc-1",
      label: "Baseline CBC · 2026-04-15",
      author: "Dr. T. Becker, Lab Medicine",
      at: "2026-04-15T08:00:00Z",
    },
    updatedAt: "2026-04-15T08:00:00Z",
  },
  {
    id: "f-lh-cmp-creat",
    key: "lab.cmp.creatinine",
    label: "Creatinine (baseline)",
    value: "0.8 mg/dL",
    confidence: 0.99,
    group: "lab",
    specialty: "med-onc",
    source: {
      kind: "lab",
      id: "lab-lh-cmp-1",
      label: "Baseline CMP · 2026-04-15",
      excerpt: "Cr 0.8 · BUN 14 · ALT 22 · AST 24 · ALP 84 · LDH 188",
      author: "Dr. T. Becker, Lab Medicine",
      at: "2026-04-15T08:00:00Z",
    },
    updatedAt: "2026-04-15T08:00:00Z",
  },
  {
    id: "f-lh-imaging-mri",
    key: "imaging.mri",
    label: "Breast MRI",
    value: "32 mm UOQ mass · no multifocality · single suspicious axillary node",
    confidence: 0.92,
    group: "imaging",
    specialty: "radiology",
    source: {
      kind: "imaging",
      id: "img-lh-mri-002",
      label: "Breast MRI · 2026-03-19",
      excerpt:
        "Single 32 mm spiculated mass right UOQ. No contralateral disease. One enlarged level I axillary node 14 mm.",
      author: "Dr. K. Lee, Radiology",
      at: "2026-03-19T17:30:00Z",
      specialty: "radiology",
    },
    updatedAt: "2026-03-19T17:30:00Z",
  },
  {
    id: "f-lh-coordinator",
    key: "communications.coordinator",
    label: "Coordinator assigned",
    value: "K. Schwarz, RN — Breast Programme",
    confidence: 0.99,
    group: "history",
    specialty: "nursing",
    source: {
      kind: "email",
      id: "eml-lh-mdt-nom",
      label: "2026-04-15_mdt_nomination.eml",
      author: "Dr. J. Schroeder",
      at: "2026-04-15T16:00:00Z",
    },
    updatedAt: "2026-04-15T16:00:00Z",
  },
  {
    id: "f-lh-port",
    key: "operational.port",
    label: "Port placement",
    value: "Scheduled 2026-05-04 · IR clinic",
    confidence: 0.97,
    group: "medication",
    specialty: "med-onc",
    source: {
      kind: "report",
      id: "sch-lh-port",
      label: "port_placement_2026-05-04.json",
      author: "IR scheduling",
      at: "2026-04-22T11:00:00Z",
    },
    updatedAt: "2026-04-22T11:00:00Z",
  },
];

const boardCaseLinda: BoardCase = {
  id: "bc-lh-1",
  patientId: "",
  question: "Confirm neoadjuvant AC-T plan and surgical timing",
  openedAt: "2026-04-22T11:00:00Z",
  attendees: [
    { name: "Dr. J. Schroeder", role: "Med-Onc", tone: "violet" },
    { name: "Dr. R. Patel", role: "Pathology", tone: "rose" },
    { name: "Dr. K. Lee", role: "Radiology", tone: "amber" },
    { name: "Dr. S. Chen", role: "Surgical Onc", tone: "emerald" },
    { name: "K. Schwarz", role: "Coordinator (RN)", tone: "sky" },
  ],
  status: "draft",
  decidedOptionId: null,
};

export const LINDA_PHASE1_OPTIONS: TreatmentOption[] = [
  {
    id: "opt-lh1-A",
    name: "Standard of care",
    shortLabel:
      "Neoadjuvant AC-T → BCS + SLNB → adjuvant letrozole + abemaciclib",
    intent: "curative",
    phases: [
      {
        id: "ph-lh1-A-1",
        name: "Neoadjuvant AC-T",
        type: "chemo",
        regimen: "Dose-dense AC q3w × 4 → paclitaxel weekly × 12",
        status: "planned",
        startDate: "2026-05-05",
        endDate: "2026-09-15",
        cycles: { total: 16, completed: 0 },
      },
      {
        id: "ph-lh1-A-2",
        name: "Lumpectomy + SLNB",
        type: "surgery",
        regimen: "Right breast BCS + sentinel-node biopsy",
        status: "planned",
        startDate: "2026-09-29",
      },
      {
        id: "ph-lh1-A-3",
        name: "Whole-breast RT",
        type: "radiation",
        regimen: "40.05 Gy in 15 fractions",
        status: "planned",
        startDate: "2026-10-20",
        endDate: "2026-11-10",
      },
      {
        id: "ph-lh1-A-4",
        name: "Adjuvant endocrine + CDK4/6",
        type: "hormonal",
        regimen:
          "Letrozole 2.5 mg PO daily + abemaciclib 150 mg BID × 2 y, then letrozole alone × 3–5 y total",
        status: "planned",
        startDate: "2026-11-24",
      },
    ],
    rationale: [
      "HR+/HER2-low Stage IIB with cN1 → neoadjuvant systemic per KSZ-CP-BR-001.",
      "Anthracycline backbone preferred for high-risk node-positive disease.",
      "Adjuvant CDK4/6 indicated by Ki-67 25% + cN1 (monarchE eligibility).",
      "PIK3CA H1047R noted for second-line; not actionable in adjuvant setting.",
    ],
    rationaleFactIds: [
      "f-lh-receptors",
      "f-lh-stage",
      "f-lh-cn",
      "f-lh-ngs",
    ],
    outcomes: [
      { label: "pCR (breast + axilla)", value: "20–25%", citation: "KEYNOTE-756 control" },
      { label: "5-year iDFS", value: "~84%", citation: "monarchE 2022" },
      { label: "5-year OS", value: "~92%", citation: "monarchE 2022" },
    ],
    toxicities: [
      { category: "Cardiotoxicity (anthracyclines)", severity: "Monitor LVEF · ~1–2% gr3+" },
      { category: "Neuropathy (paclitaxel)", severity: "~25% gr2+" },
      { category: "Neutropenia", severity: "G-CSF support; ~10% febrile" },
      { category: "Diarrhea (abemaciclib)", severity: "~80% any grade · ~10% gr3" },
    ],
    evidence: ["NSABP B-49", "monarchE 2022", "NCCN BINV-J", "KSZ-CP-BR-001"],
    burden:
      "≈ 18 mo total · 16 infusions · 1 surgery · 15 RT fractions · 5+ y endocrine + 2 y CDK4/6",
    rankings: [
      { specialist: "Dr. J. Schroeder", specialty: "med-onc", rank: 1, confidence: 0.94 },
      { specialist: "Dr. R. Patel", specialty: "pathology", rank: 1, confidence: 0.9 },
      { specialist: "Dr. S. Chen", specialty: "med-onc", rank: 1, confidence: 0.86 },
      { specialist: "Dr. K. Lee", specialty: "radiology", rank: 1, confidence: 0.9 },
      { specialist: "K. Schwarz", specialty: "nursing", rank: 1, confidence: 0.85 },
    ],
    patientFacing: {
      name: "The standard treatment",
      summary:
        "Several months of chemotherapy first to shrink the tumour, then a smaller surgery, then short daily radiation, then years of pills to block estrogen plus a targeted pill for two years.",
      livesLikeThis:
        "Most intense for the first 4–5 months. Hair loss is expected during chemo. Surgery is one day. Radiation is short daily visits for three weeks. The endocrine + targeted pills are well tolerated overall but the targeted pill commonly causes loose stools. Highest chance of cure for this stage.",
    },
  },
  {
    id: "opt-lh1-B",
    name: "De-escalated chemo",
    shortLabel: "TC × 4 → BCS + SLNB → adjuvant letrozole + abemaciclib",
    intent: "curative",
    phases: [
      {
        id: "ph-lh1-B-1",
        name: "Neoadjuvant TC",
        type: "chemo",
        regimen: "Docetaxel 75 + cyclophosphamide 600 q3w × 4",
        status: "planned",
        startDate: "2026-05-05",
        endDate: "2026-08-04",
        cycles: { total: 4, completed: 0 },
      },
      {
        id: "ph-lh1-B-2",
        name: "Lumpectomy + SLNB",
        type: "surgery",
        regimen: "Right breast BCS + sentinel-node biopsy",
        status: "planned",
        startDate: "2026-08-25",
      },
      {
        id: "ph-lh1-B-3",
        name: "Whole-breast RT",
        type: "radiation",
        regimen: "40.05 Gy in 15 fractions",
        status: "planned",
        startDate: "2026-09-15",
        endDate: "2026-10-06",
      },
      {
        id: "ph-lh1-B-4",
        name: "Adjuvant endocrine + CDK4/6",
        type: "hormonal",
        regimen: "Letrozole + abemaciclib × 2 y, then letrozole alone",
        status: "planned",
        startDate: "2026-10-20",
      },
    ],
    rationale: [
      "Anthracycline-free backbone — avoids cardiotoxicity risk in postmenopausal woman.",
      "Acceptable for HR+/HER2-low disease without high-volume nodal burden.",
      "Adjuvant abemaciclib still indicated by Ki-67 + cN1.",
    ],
    rationaleFactIds: ["f-lh-receptors", "f-lh-cn", "f-lh-lvef"],
    outcomes: [
      { label: "pCR rate", value: "10–15%", citation: "USOR 06-090" },
      { label: "5-year iDFS", value: "~80%", citation: "USOR 06-090" },
    ],
    toxicities: [
      { category: "Neuropathy", severity: "~15% gr2+" },
      { category: "Neutropenia", severity: "G-CSF often required" },
      { category: "Alopecia", severity: "Expected" },
    ],
    evidence: ["USOR 06-090", "NCCN BINV-J"],
    burden:
      "≈ 16 mo · 4 infusions · 1 surgery · 15 RT fractions · 5+ y endocrine + 2 y CDK4/6",
    rankings: [
      { specialist: "Dr. J. Schroeder", specialty: "med-onc", rank: 2, confidence: 0.78 },
      { specialist: "Dr. R. Patel", specialty: "pathology", rank: 1, confidence: 0.85 },
      { specialist: "Dr. S. Chen", specialty: "med-onc", rank: 1, confidence: 0.83 },
    ],
  },
  {
    id: "opt-lh1-C",
    name: "Surgery first",
    shortLabel:
      "Primary lumpectomy → adjuvant TC × 4 → letrozole + abemaciclib",
    intent: "curative",
    phases: [
      {
        id: "ph-lh1-C-1",
        name: "Lumpectomy + SLNB",
        type: "surgery",
        regimen: "Right breast BCS + sentinel-node biopsy",
        status: "planned",
        startDate: "2026-05-12",
      },
      {
        id: "ph-lh1-C-2",
        name: "Adjuvant TC",
        type: "chemo",
        regimen: "Docetaxel + cyclophosphamide q3w × 4",
        status: "planned",
        startDate: "2026-06-23",
        endDate: "2026-09-22",
        cycles: { total: 4, completed: 0 },
      },
      {
        id: "ph-lh1-C-3",
        name: "Whole-breast RT",
        type: "radiation",
        regimen: "40.05 Gy in 15 fractions",
        status: "planned",
        startDate: "2026-10-13",
        endDate: "2026-11-03",
      },
      {
        id: "ph-lh1-C-4",
        name: "Adjuvant endocrine + CDK4/6",
        type: "hormonal",
        regimen: "Letrozole + abemaciclib × 2 y, then letrozole alone",
        status: "planned",
        startDate: "2026-11-17",
      },
    ],
    rationale: [
      "Tumour 32 mm — borderline for upfront BCS but feasible per surgical consult.",
      "Forgoes pCR signal but accelerates definitive surgery.",
      "Patient preference for surgery-first if discussed at MDT.",
    ],
    rationaleFactIds: ["f-lh-ct", "f-lh-cn"],
    outcomes: [
      { label: "5-year iDFS", value: "~78%", citation: "NSABP B-18 retrospective" },
    ],
    toxicities: [
      { category: "Surgical morbidity", severity: "Expected, manageable" },
      { category: "Loss of pCR signal", severity: "Limits adjuvant escalation evidence" },
    ],
    evidence: ["NSABP B-18", "NCCN BINV-J"],
    burden:
      "≈ 14 mo · 1 surgery · 4 infusions · 15 RT fractions · 5+ y endocrine + 2 y CDK4/6",
    rankings: [
      { specialist: "Dr. J. Schroeder", specialty: "med-onc", rank: 3, confidence: 0.62 },
      { specialist: "Dr. S. Chen", specialty: "med-onc", rank: 2, confidence: 0.7 },
    ],
  },
];

export const LINDA_PHASE2_OPTIONS: TreatmentOption[] = [
  {
    id: "opt-lh2-A",
    name: "Letrozole + ribociclib",
    shortLabel: "Letrozole 2.5 mg + ribociclib 600 mg (3w on / 1w off)",
    intent: "palliative",
    phases: [
      {
        id: "ph-lh2-A-1",
        name: "First-line palliative ET + CDK4/6",
        type: "hormonal",
        regimen: "Letrozole + ribociclib (3-week cycles, restage every 12 weeks)",
        status: "planned",
        startDate: "2026-04-29",
      },
    ],
    rationale: [
      "MONALEESA-3 OS benefit in postmenopausal HR+/HER2- MBC.",
      "Best-validated CDK4/6 in 1L for de novo metastatic.",
      "PIK3CA H1047R can be addressed at second line with alpelisib.",
    ],
    rationaleFactIds: ["f-lh-receptors", "f-lh-ngs"],
    outcomes: [
      { label: "Median PFS (1L)", value: "~28 mo", citation: "MONALEESA-3 2018" },
      { label: "Median OS", value: "~64 mo", citation: "MONALEESA-3 2022" },
    ],
    toxicities: [
      { category: "Neutropenia", severity: "~60% any grade · ~20% gr3" },
      { category: "Hepatotoxicity", severity: "Monitor LFTs · ~5% gr3" },
      { category: "QTc prolongation", severity: "Baseline + on-treatment ECG" },
    ],
    evidence: ["MONALEESA-3 2018/2022", "NCCN BINV-Q", "KSZ-CP-BR-002"],
    burden:
      "Indefinite · oral therapy · monthly clinic + bloods · imaging q12w",
    rankings: [
      { specialist: "Dr. J. Schroeder", specialty: "med-onc", rank: 1, confidence: 0.9 },
    ],
    patientFacing: {
      name: "Standard first-line",
      summary:
        "Two pills together — a hormone blocker daily plus a targeted pill three weeks on, one week off. Tablets only, no infusion.",
      livesLikeThis:
        "Most patients live a normal daily life. Bloods every 2 weeks at the start to watch counts. Scans every 3 months. Side effects manageable for most.",
    },
  },
  {
    id: "opt-lh2-B",
    name: "Letrozole + abemaciclib",
    shortLabel: "Letrozole 2.5 mg + abemaciclib 150 mg BID continuous",
    intent: "palliative",
    phases: [
      {
        id: "ph-lh2-B-1",
        name: "First-line palliative ET + CDK4/6 (continuous)",
        type: "hormonal",
        regimen: "Letrozole + abemaciclib continuous dosing",
        status: "planned",
        startDate: "2026-04-29",
      },
    ],
    rationale: [
      "MONARCH-3 OS benefit; continuous dosing avoids one-week-off neutropenia.",
      "Same molecule as planned adjuvant — continuity if patient was already adherent.",
    ],
    rationaleFactIds: ["f-lh-receptors"],
    outcomes: [
      { label: "Median PFS (1L)", value: "~28 mo", citation: "MONARCH-3 2017" },
      { label: "Median OS", value: "~67 mo", citation: "MONARCH-3 2023" },
    ],
    toxicities: [
      { category: "Diarrhea", severity: "~80% any grade · ~10% gr3" },
      { category: "Neutropenia", severity: "Lower than ribociclib" },
    ],
    evidence: ["MONARCH-3 2017/2023", "NCCN BINV-Q"],
    burden: "Indefinite · oral · monthly clinic",
    rankings: [
      { specialist: "Dr. J. Schroeder", specialty: "med-onc", rank: 2, confidence: 0.82 },
    ],
  },
  {
    id: "opt-lh2-C",
    name: "Letrozole + alpelisib",
    shortLabel: "Letrozole 2.5 mg + alpelisib 300 mg PIK3CA-directed",
    intent: "palliative",
    phases: [
      {
        id: "ph-lh2-C-1",
        name: "First-line PIK3CA-directed",
        type: "targeted",
        regimen: "Letrozole + alpelisib (PIK3CA H1047R Level 1)",
        status: "planned",
        startDate: "2026-04-29",
      },
    ],
    rationale: [
      "PIK3CA H1047R · OncoKB Level 1 actionable in HR+/HER2- MBC.",
      "BYLieve and SOLAR-1 demonstrate PFS benefit specifically for PIK3CA-mutated.",
      "Reserves CDK4/6 for second line if PI3K-targeted progresses.",
    ],
    rationaleFactIds: ["f-lh-ngs", "f-lh-oncokb"],
    outcomes: [
      { label: "Median PFS (PIK3CA-mut)", value: "~11 mo", citation: "SOLAR-1 2019" },
    ],
    toxicities: [
      { category: "Hyperglycaemia", severity: "~65% any grade · ~37% gr3" },
      { category: "Rash", severity: "~50% any grade · ~14% gr3" },
      { category: "Diarrhea", severity: "Common" },
    ],
    evidence: ["SOLAR-1 2019", "BYLieve 2021", "OncoKB Level 1"],
    burden: "Indefinite · oral · close metabolic monitoring",
    rankings: [
      { specialist: "Dr. J. Schroeder", specialty: "med-onc", rank: 3, confidence: 0.65 },
      { specialist: "Dr. A. Tanaka", specialty: "pathology", rank: 1, confidence: 0.88 },
    ],
  },
];

export const LINDA_PHASE2_BOARDCASE_QUESTION =
  "Choose first-line systemic therapy for de novo metastatic disease (CDK4/6 vs PI3K-directed)";

const PHASE1_PATIENT: Patient = {
  id: "linda-h",
  name: "Linda Hoffmann",
  initials: "LH",
  dob: "1973-08-14",
  age: 52,
  sex: "F",
  mrn: "MBC-2026-0042",
  status: "active",
  cancerType: "breast",
  cancerLabel: "Breast cancer · Stage IIB (pending staging)",
  diagnosis: "Invasive ductal carcinoma · grade 2 · ER+/PR+/HER2-low",
  staging: "cT2 cN1 cM0 — Stage IIB (clinical, pending staging CT)",
  primaryOncologist: "Dr. J. Schroeder, Med-Onc",
  caseOpenedAt: "2026-04-22",
  avatarTone: "rose",
  vaultAvatars: [
    { initials: "JS", tone: "violet" },
    { initials: "RP", tone: "rose" },
    { initials: "KL", tone: "amber" },
    { initials: "SC", tone: "emerald" },
  ],
  facts: factsLinda,
  plan: [
    {
      id: "ph-lh-1",
      name: "Neoadjuvant AC-T",
      type: "chemo",
      regimen:
        "Dose-dense AC q3w × 4 → paclitaxel weekly × 12",
      status: "planned",
      startDate: "2026-05-05",
      endDate: "2026-09-15",
      cycles: { total: 16, completed: 0 },
      rationale:
        "HR+/HER2-low, Stage IIB → standard neoadjuvant AC-T per KSZ-CP-BR-001 (locoregional pathway).",
    },
    {
      id: "ph-lh-2",
      name: "Surgery",
      type: "surgery",
      regimen:
        "Right breast lumpectomy + sentinel lymph node biopsy (axillary dissection if positive)",
      status: "planned",
      startDate: "2026-09-29",
      rationale:
        "Breast-conserving therapy planned if neoadjuvant achieves volumetric response.",
    },
    {
      id: "ph-lh-3",
      name: "Adjuvant endocrine + targeted",
      type: "hormonal",
      regimen:
        "Letrozole 2.5 mg PO daily + abemaciclib 150 mg BID × 2y, then letrozole alone × 3–5 y total",
      status: "planned",
      startDate: "2026-11-10",
      rationale:
        "ER+/PR+ disease, high-risk features → endocrine + CDK4/6 per NCCN BINV-Q.",
    },
  ],
  options: LINDA_PHASE1_OPTIONS,
  chosenOptionId: null,
  boardCase: boardCaseLinda,
  agent: {
    now: {
      action:
        "Watching elevated tumour markers — staging CT C/A/P scheduled 2026-04-24",
    },
    needsYou: [],
    recent: [
      {
        id: "ev-lh-1",
        action: "Ingested 24 records from Phase 1 workup",
        at: ISO_INGEST,
      },
      {
        id: "ev-lh-2",
        action: "Linked to CRM record MBC-2026-0042 (existing)",
        at: ISO_INGEST,
      },
      {
        id: "ev-lh-3",
        action: "Mapped case to KSZ-CP-BR-001 (locoregional pathway)",
        at: ISO_INGEST,
      },
    ],
  },
};

export type ClonedFile = { fileName: string };

export function cloneLindaPhase1(input: {
  files: ClonedFile[];
  tumorBoard?: string;
  fallbackMrn?: string;
}): Patient {
  // PHASE1_PATIENT is JSON-safe (no Dates/Maps/functions), so structuredClone
  // would also work but adds no clarity here.
  const clone: Patient = JSON.parse(JSON.stringify(PHASE1_PATIENT));

  const nowIso = new Date().toISOString();
  clone.caseOpenedAt = nowIso.slice(0, 10);
  clone.id = `linda-h-${slugSuffix(input.fallbackMrn || PHASE1_PATIENT.mrn)}`;

  if (clone.agent.recent[0]) {
    clone.agent.recent[0].action = `Ingested ${input.files.length} records from Phase 1 workup`;
  }
  for (const ev of clone.agent.recent) ev.at = nowIso;

  if (input.tumorBoard?.trim()) {
    clone.primaryOncologist = `Dr. J. Schroeder, Med-Onc (${input.tumorBoard.trim()})`;
  }

  if (clone.boardCase) clone.boardCase.patientId = clone.id;

  return clone;
}
