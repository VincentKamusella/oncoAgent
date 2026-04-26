/**
 * Parse patient identity signals from a list of dropped filenames.
 * No external resources read — purely heuristic.
 */
export type IdentitySignals = {
  name?: string;
  mrn?: string;
  cancerType?: string;
};

const MRN_PATTERNS = [
  /\b(MRN[-_]?\d{4,8})\b/i,
  /\b(MBC[-_]\d{4}[-_]\d{4})\b/i,
  /\b(EMR[-_]?\d{4,8})\b/i,
];

const NAME_PATTERN = /\b([A-Z][a-z]+)[ _-]([A-Z][a-z]+)\b/;

const CANCER_KEYWORDS: { match: RegExp; type: string }[] = [
  { match: /(breast|mammary|mbc|her2|er[-_+]|pr[-_+])/i, type: "Breast" },
  { match: /(lung|nsclc|sclc)/i, type: "Lung" },
  { match: /(prostate|psa)/i, type: "Prostate" },
  { match: /(colon|colorectal|crc)/i, type: "Colorectal" },
  { match: /(pancreas|pancreatic)/i, type: "Pancreatic" },
  { match: /(melanoma|skin)/i, type: "Melanoma" },
  { match: /(lymphoma|hodgkin)/i, type: "Lymphoma" },
  { match: /(leukemia|aml|cml|all)/i, type: "Leukemia" },
];

export function parseIdentity(files: { name: string }[]): IdentitySignals {
  const out: IdentitySignals = {};

  for (const f of files) {
    const n = f.name;

    if (!out.mrn) {
      for (const re of MRN_PATTERNS) {
        const m = n.match(re);
        if (m) {
          out.mrn = m[1].toUpperCase().replace(/_/g, "-");
          break;
        }
      }
    }

    if (!out.name) {
      const m = n.replace(/\.[^.]+$/, "").match(NAME_PATTERN);
      if (m && !/(report|panel|order|note|email|chat|policy|formulary|crm|hr|rota|directory)/i.test(m[0])) {
        out.name = `${m[1]} ${m[2]}`;
      }
    }

    if (!out.cancerType) {
      for (const k of CANCER_KEYWORDS) {
        if (k.match.test(n)) {
          out.cancerType = k.type;
          break;
        }
      }
    }

    if (out.mrn && out.name && out.cancerType) break;
  }

  return out;
}
