export type IngestCategory =
  | "pathology"
  | "radiology"
  | "genomics"
  | "labs"
  | "notes"
  | "communications"
  | "operational"
  | "reference";

export type CategoryMeta = {
  id: IngestCategory;
  label: string;
  hint: string;
  // tailwind class fragments — referenced in lane.tsx and file-chip.tsx
  swatch: string; // background tone
  ink: string; // foreground tone
  ring: string; // ring/border tone
};

export const CATEGORY_ORDER: IngestCategory[] = [
  "pathology",
  "radiology",
  "genomics",
  "labs",
  "notes",
  "communications",
  "operational",
  "reference",
];

export const CATEGORIES: Record<IngestCategory, CategoryMeta> = {
  pathology: {
    id: "pathology",
    label: "Pathology",
    hint: "Histology · IHC · biopsy",
    swatch: "bg-violet-50",
    ink: "text-violet-700",
    ring: "ring-violet-200",
  },
  radiology: {
    id: "radiology",
    label: "Radiology",
    hint: "MRI · CT · mammo · US",
    swatch: "bg-sky-50",
    ink: "text-sky-700",
    ring: "ring-sky-200",
  },
  genomics: {
    id: "genomics",
    label: "Genomics",
    hint: "NGS · variants · biomarkers",
    swatch: "bg-emerald-50",
    ink: "text-emerald-700",
    ring: "ring-emerald-200",
  },
  labs: {
    id: "labs",
    label: "Labs",
    hint: "CBC · CMP · tumor markers",
    swatch: "bg-amber-50",
    ink: "text-amber-700",
    ring: "ring-amber-200",
  },
  notes: {
    id: "notes",
    label: "Clinical notes",
    hint: "Consults · intake · summaries",
    swatch: "bg-rose-50",
    ink: "text-rose-700",
    ring: "ring-rose-200",
  },
  communications: {
    id: "communications",
    label: "Communications",
    hint: "Email threads · chat",
    swatch: "bg-indigo-50",
    ink: "text-indigo-700",
    ring: "ring-indigo-200",
  },
  operational: {
    id: "operational",
    label: "Operational",
    hint: "Scheduling · prior auth",
    swatch: "bg-slate-100",
    ink: "text-slate-700",
    ring: "ring-slate-200",
  },
  reference: {
    id: "reference",
    label: "Reference",
    hint: "Formulary · directories · pathways",
    swatch: "bg-neutral-100",
    ink: "text-neutral-700",
    ring: "ring-neutral-300",
  },
};

export type Classification = {
  category: IngestCategory;
  confidence: number; // 0..1
  /** A short human-readable label of what we identified in this file */
  detected: string;
};

/** Pure-function classifier from a file's name + size + mime. */
export function classify(file: { name: string; size: number; type?: string }): Classification {
  const n = file.name.toLowerCase();
  const ext = n.split(".").pop() ?? "";
  const stem = n.replace(/\.[^.]+$/, "");

  // Communications: EML files are always emails. Check this first so subject keywords
  // (chemo, radiology, etc.) inside filenames don't pull them into clinical lanes.
  if (ext === "eml" || /email|inbox/i.test(n) || /(phone.?call|message.?log|voicemail)/i.test(n)) {
    return { category: "communications", confidence: 0.96, detected: detectedFor("communications", stem) };
  }
  if (ext === "jsonl" && /chat|thread|messages/i.test(n)) {
    return { category: "communications", confidence: 0.92, detected: "Team chat thread" };
  }

  // Operational signals (chemo cycles, scheduling, prior auth)
  if (
    /(scheduling|appointment|prior.?auth|^pa[-_]?\d|order_|^order|insurance|referral|chemo[_-]?c\d|cycle.?\d|port[_-]?placement|infusion|preop|postop)/i.test(
      n,
    )
  ) {
    return { category: "operational", confidence: 0.93, detected: detectedFor("operational", stem) };
  }

  // Pathology signals
  if (/(pathology|biopsy|histo|h.?and.?e|ihc|fish|cytology|tumor.?board|frozen.?section)/i.test(n)) {
    return { category: "pathology", confidence: 0.96, detected: detectedFor("pathology", stem) };
  }

  // Genomics signals
  if (/(ngs|foundation|genomic|panel.?ngs|variants?|fusion|mutation|mut_|sequencing|tmb|msi|brca)/i.test(n)) {
    return { category: "genomics", confidence: 0.95, detected: detectedFor("genomics", stem) };
  }

  // Radiology signals
  if (
    /(mammo|ultrasound|us[-_]?breast|mri|^ct[_-]|_ct[_-]|ct_chest|ct_abdomen|petct|pet[-_]?ct|radiology|imaging|staging[_-]?ct|restaging|axial|sagittal)/i.test(
      n,
    )
  ) {
    return { category: "radiology", confidence: 0.94, detected: detectedFor("radiology", stem) };
  }

  // Labs (more specific — avoid generic "chem" matches like "chemo")
  if (
    /(\blabs?\b|cbc|cmp|tumor.?marker|ca[-_ ]?15|ca[-_ ]?125|cea|psa|hba1c|metabolic.?panel|chemistry.?panel)/i.test(
      n,
    )
  ) {
    return { category: "labs", confidence: 0.92, detected: detectedFor("labs", stem) };
  }

  // Clinical notes
  if (/(consult|intake|^note|_note|h&p|hpi|summary|discharge|progress|history)/i.test(n)) {
    return { category: "notes", confidence: 0.9, detected: detectedFor("notes", stem) };
  }

  // Reference / org context
  if (/(crm|formulary|directory|hr_|policy|pathway|^sop|_sop|rota|guideline|nccn)/i.test(n)) {
    return { category: "reference", confidence: 0.88, detected: detectedFor("reference", stem) };
  }

  // Extension fallbacks
  if (ext === "pdf") return { category: "notes", confidence: 0.55, detected: "Clinical document" };
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "dcm") {
    return { category: "radiology", confidence: 0.6, detected: "Medical image" };
  }
  if (ext === "csv") return { category: "reference", confidence: 0.5, detected: "Reference table" };
  if (ext === "json") return { category: "operational", confidence: 0.5, detected: "Structured record" };
  if (ext === "md" || ext === "txt") return { category: "notes", confidence: 0.45, detected: "Note" };

  return { category: "notes", confidence: 0.3, detected: "Unclassified document" };
}

function detectedFor(cat: IngestCategory, stem: string): string {
  const pretty = stem.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  switch (cat) {
    case "pathology":
      return /biopsy/.test(stem) ? "Core biopsy report" : /ihc|fish/.test(stem) ? "IHC / FISH addendum" : "Histopathology";
    case "radiology":
      if (/mammo/.test(stem)) return "Mammography";
      if (/mri/.test(stem)) return "Breast MRI";
      if (/ct/.test(stem)) return /staging|restaging/.test(stem) ? "Staging CT" : "CT study";
      if (/ultrasound|us/.test(stem)) return "Ultrasound";
      if (/pet/.test(stem)) return "PET / CT";
      return "Imaging study";
    case "genomics":
      if (/foundation/.test(stem)) return "FoundationOne CDX";
      return "Genomic panel";
    case "labs":
      if (/cbc/.test(stem)) return "CBC";
      if (/cmp/.test(stem)) return "Comprehensive metabolic panel";
      if (/marker/.test(stem)) return "Tumor markers";
      return "Laboratory panel";
    case "notes":
      if (/consult/.test(stem)) return "Consultation note";
      if (/intake/.test(stem)) return "Intake form";
      if (/summary|discharge/.test(stem)) return "Discharge summary";
      return "Clinical note";
    case "communications":
      return "Communication";
    case "operational":
      if (/prior.?auth|^pa/.test(stem)) return "Prior authorization";
      if (/scheduling|appointment|order/.test(stem)) return "Scheduling order";
      return "Operational record";
    case "reference":
      if (/formulary/.test(stem)) return "Drug formulary";
      if (/crm/.test(stem)) return "CRM extract";
      if (/directory|rota|hr_/.test(stem)) return "Personnel directory";
      if (/policy|pathway|sop|guideline/.test(stem)) return "Clinical pathway";
      return "Reference data";
  }
  return pretty;
}

/** A simple flag for files that should trigger a "conflicts with prior records" pill. */
export function isPotentialConflict(name: string): boolean {
  return /(restaging|staging.?ct|cascade|update|amendment|addendum|revised)/i.test(name);
}
