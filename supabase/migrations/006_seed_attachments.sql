-- =============================================
-- Cliniarc — Seed Attachments
-- Pretend-uploaded documents matching existing facts/sources
-- Run this AFTER 003_normalize.sql (attachments table must exist)
-- =============================================

-- ─────────────────────────────────────
-- Maria Kowalski — 10 attachments
-- ─────────────────────────────────────

INSERT INTO attachments (patient_id, specialty, kind, name, storage_path, size_kb, mime_type, uploaded_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'pathology', 'pdf',    'Core biopsy report — left breast',       '/vault/maria-k/pathology/core-biopsy-report.pdf',      412,  'application/pdf',  '2026-02-08T09:14:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'pathology', 'image',  'IHC HER2 — 3+ membrane stain',           '/vault/maria-k/pathology/ihc-her2-stain.png',          1820, 'image/png',        '2026-02-09T15:02:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'pathology', 'pdf',    'NGS panel — 523 genes',                   '/vault/maria-k/pathology/ngs-panel-523.pdf',           198,  'application/pdf',  '2026-02-18T16:20:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'pathology', 'pdf',    'Ki-67 addendum',                          '/vault/maria-k/pathology/ki67-addendum.pdf',           85,   'application/pdf',  '2026-02-15T12:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'radiology', 'image',  'Mammogram — bilateral',                   '/vault/maria-k/radiology/mammogram-bilateral.dcm',     2840, 'application/dicom','2026-02-04T10:30:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'radiology', 'image',  'MRI breast — pre-treatment',              '/vault/maria-k/radiology/mri-breast-pre.dcm',          5120, 'application/dicom','2026-02-12T11:45:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'radiology', 'pdf',    'Staging CT chest/abdomen/pelvis report',  '/vault/maria-k/radiology/staging-ct-report.pdf',       310,  'application/pdf',  '2026-02-18T10:30:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'radiology', 'pdf',    'Bone scan report',                        '/vault/maria-k/radiology/bone-scan-report.pdf',        145,  'application/pdf',  '2026-02-20T14:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'med-onc',   'table',  'CBC trend — 6 cycles',                    '/vault/maria-k/med-onc/cbc-trend.csv',                 24,   'text/csv',         '2026-04-18T08:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'med-onc',   'report', 'Cycle 4 visit note',                      '/vault/maria-k/med-onc/cycle4-visit-note.pdf',         156,  'application/pdf',  '2026-04-15T10:30:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'med-onc',   'pdf',    'Baseline assessment — Dr. Muller',        '/vault/maria-k/med-onc/baseline-assessment.pdf',       220,  'application/pdf',  '2026-02-10T11:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'nursing',   'table',  'Infusion log — TCHP',                     '/vault/maria-k/nursing/infusion-log-tchp.csv',         18,   'text/csv',         '2026-04-15T09:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'nursing',   'report', 'Intake form',                             '/vault/maria-k/nursing/intake-form.pdf',               95,   'application/pdf',  '2026-02-08T09:12:00Z');

-- ─────────────────────────────────────
-- Thomas Berger — 14 attachments
-- ─────────────────────────────────────

INSERT INTO attachments (patient_id, specialty, kind, name, storage_path, size_kb, mime_type, uploaded_at) VALUES
  ('10000000-0000-0000-0000-000000000002', 'pathology', 'pdf',    'Colonoscopy biopsy — adenocarcinoma',     '/vault/thomas-b/pathology/colonoscopy-biopsy.pdf',     380,  'application/pdf',  '2026-03-04T15:20:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'pathology', 'pdf',    'MSI/IHC panel report',                    '/vault/thomas-b/pathology/msi-ihc-panel.pdf',          165,  'application/pdf',  '2026-03-06T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'pathology', 'pdf',    'Molecular panel — KRAS/NRAS/BRAF',        '/vault/thomas-b/pathology/molecular-panel.pdf',        210,  'application/pdf',  '2026-03-10T14:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'radiology', 'pdf',    'Staging CT chest/abdomen/pelvis',         '/vault/thomas-b/radiology/staging-ct-report.pdf',      295,  'application/pdf',  '2026-03-06T09:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'radiology', 'image',  'Pelvic MRI — baseline',                   '/vault/thomas-b/radiology/pelvic-mri-baseline.dcm',    6200, 'application/dicom','2026-03-08T11:10:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'radiology', 'pdf',    'Pelvic MRI report — EMVI/distance',       '/vault/thomas-b/radiology/pelvic-mri-report.pdf',      175,  'application/pdf',  '2026-03-08T11:10:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'med-onc',   'pdf',    'Baseline assessment — Dr. Romano',        '/vault/thomas-b/med-onc/baseline-assessment.pdf',      240,  'application/pdf',  '2026-03-02T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'med-onc',   'table',  'CEA trend — pre/post induction',          '/vault/thomas-b/med-onc/cea-trend.csv',                12,   'text/csv',         '2026-04-20T08:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'med-onc',   'table',  'CMP — liver/renal function',              '/vault/thomas-b/med-onc/cmp-labs.csv',                 15,   'text/csv',         '2026-03-14T08:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'med-onc',   'report', 'Toxicity assessment — neuropathy',        '/vault/thomas-b/med-onc/toxicity-neuropathy.pdf',      110,  'application/pdf',  '2026-04-10T11:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'med-onc',   'report', 'Post-induction response assessment',      '/vault/thomas-b/med-onc/post-induction-response.pdf',  185,  'application/pdf',  '2026-04-22T17:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'nursing',   'report', 'Intake form',                             '/vault/thomas-b/nursing/intake-form.pdf',              88,   'application/pdf',  '2026-03-01T08:30:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'nursing',   'report', 'Infusion note — cycle 4',                 '/vault/thomas-b/nursing/infusion-note-c4.pdf',         72,   'application/pdf',  '2026-04-18T14:20:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'nursing',   'table',  'Infusion log — FOLFOX 4 cycles',          '/vault/thomas-b/nursing/infusion-log-folfox.csv',      20,   'text/csv',         '2026-04-18T14:20:00Z');

-- ─────────────────────────────────────
-- Anna Lindqvist — 13 attachments
-- ─────────────────────────────────────

INSERT INTO attachments (patient_id, specialty, kind, name, storage_path, size_kb, mime_type, uploaded_at) VALUES
  ('10000000-0000-0000-0000-000000000003', 'pathology', 'pdf',    'Lumpectomy specimen — surgical path',     '/vault/anna-l/pathology/lumpectomy-specimen.pdf',      450,  'application/pdf',  '2024-04-12T11:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'pathology', 'pdf',    'Ki-67 addendum',                          '/vault/anna-l/pathology/ki67-addendum.pdf',            78,   'application/pdf',  '2024-04-14T09:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'pathology', 'pdf',    'Oncotype DX recurrence score report',     '/vault/anna-l/pathology/oncotype-dx-report.pdf',       340,  'application/pdf',  '2024-05-02T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'pathology', 'pdf',    'Germline panel — BRCA1/2, PALB2, CHEK2',  '/vault/anna-l/pathology/germline-panel.pdf',           195,  'application/pdf',  '2024-05-20T14:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'radiology', 'image',  'Post-surgical mammogram — bilateral',     '/vault/anna-l/radiology/post-surg-mammogram.dcm',      3100, 'application/dicom','2024-10-15T09:30:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'radiology', 'pdf',    'Post-surgical mammogram report',          '/vault/anna-l/radiology/post-surg-mammogram-report.pdf',130,  'application/pdf',  '2024-10-15T09:30:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'radiology', 'pdf',    'DEXA scan — bone density baseline',       '/vault/anna-l/radiology/dexa-scan-report.pdf',         95,   'application/pdf',  '2024-06-10T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'med-onc',   'report', 'Tamoxifen adherence review',              '/vault/anna-l/med-onc/tamoxifen-adherence.pdf',        120,  'application/pdf',  '2025-04-01T14:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'med-onc',   'table',  'Lipid panel trend',                       '/vault/anna-l/med-onc/lipid-panel-trend.csv',          10,   'text/csv',         '2025-10-05T08:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'med-onc',   'report', 'Endocrine side effects note',             '/vault/anna-l/med-onc/endocrine-side-effects.pdf',     98,   'application/pdf',  '2025-10-15T09:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'nursing',   'report', 'Intake form',                             '/vault/anna-l/nursing/intake-form.pdf',                82,   'application/pdf',  '2024-04-01T08:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'nursing',   'report', 'QOL assessment — FACT-B',                 '/vault/anna-l/nursing/qol-fact-b.pdf',                 45,   'application/pdf',  '2025-10-15T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'nursing',   'report', 'Contact preferences form',                '/vault/anna-l/nursing/contact-preferences.pdf',        30,   'application/pdf',  '2024-04-01T08:15:00Z');
