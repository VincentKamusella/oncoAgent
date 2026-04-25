-- =============================================
-- Cliniarc — Seed Data
-- Run this AFTER 001_schema.sql
-- =============================================

-- ─────────────────────────────────────
-- CLINICIANS
-- ─────────────────────────────────────

insert into clinicians (id, name, initials, role, specialty, avatar_tone) values
  ('00000000-0000-0000-0000-000000000001', 'Dr. J. Muller',      'JM', 'Medical Oncologist',   'med-onc',    'violet'),
  ('00000000-0000-0000-0000-000000000002', 'Dr. R. Patel',       'RP', 'Pathologist',           'pathology',  'rose'),
  ('00000000-0000-0000-0000-000000000003', 'Dr. S. Chen',        'SC', 'Surgical Oncologist',   'surg-onc',   'emerald'),
  ('00000000-0000-0000-0000-000000000004', 'Dr. K. Lee',         'KL', 'Radiologist / Rad-Onc', 'radiology',  'amber'),
  ('00000000-0000-0000-0000-000000000005', 'PharmD A. Riesgo',   'AR', 'Clinical Pharmacist',   'pharmacy',   'sky'),
  ('00000000-0000-0000-0000-000000000006', 'Dr. C. Romano',      'CR', 'Medical Oncologist',    'med-onc',    'violet'),
  ('00000000-0000-0000-0000-000000000007', 'Dr. F. Park',        'FP', 'Surgical Oncologist',   'surg-onc',   'sky'),
  ('00000000-0000-0000-0000-000000000008', 'Dr. M. Schwarz',     'MS', 'GI Pathologist',        'pathology',  'rose'),
  ('00000000-0000-0000-0000-000000000009', 'Dr. N. Ito',         'NI', 'Radiation Oncologist',  'rad-onc',    'emerald'),
  ('00000000-0000-0000-0000-000000000010', 'Dr. A. Singh',       'AS', 'Cardiologist',          'med-onc',    'emerald');

-- ─────────────────────────────────────
-- PATIENTS
-- ─────────────────────────────────────

insert into patients (id, slug, name, initials, dob, age, sex, mrn, status, cancer_type, cancer_label, diagnosis, staging, primary_oncologist, case_opened_at, avatar_tone) values
  ('10000000-0000-0000-0000-000000000001', 'maria-k',  'Maria Kowalski', 'MK', '1971-09-14', 54, 'F', 'MRN-204881', 'active',       'breast-her2', 'HER2+ breast cancer · Stage IIB',                   'Invasive ductal carcinoma, ER+/PR+/HER2 3+',       'cT2 cN1 cM0',                          'Dr. J. Muller, Med-Onc',  '2026-02-08', 'rose'),
  ('10000000-0000-0000-0000-000000000002', 'thomas-b', 'Thomas Berger',  'TB', '1958-06-21', 67, 'M', 'MRN-198342', 'active',       'rectal',      'Rectal adenocarcinoma · TNT in progress',            'Adenocarcinoma of the rectum, mid-rectum',          'cT3 cN1 cM0 (provisional → cT4a pending)', 'Dr. C. Romano, Med-Onc', '2026-03-01', 'violet'),
  ('10000000-0000-0000-0000-000000000003', 'anna-l',   'Anna Lindqvist', 'AL', '1977-11-02', 48, 'F', 'MRN-176104', 'surveillance', 'breast-er',   'ER+ breast cancer · Surveillance · 23 mo',          'Invasive lobular carcinoma, ER+/PR+/HER2-',         'pT1c pN0 — Stage IA',                   'Dr. J. Muller, Med-Onc',  '2024-02-19', 'emerald');

-- Vault avatars
insert into vault_avatars (patient_id, initials, tone, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'JM', 'violet',  0),
  ('10000000-0000-0000-0000-000000000001', 'RP', 'rose',    1),
  ('10000000-0000-0000-0000-000000000001', 'AS', 'emerald', 2),
  ('10000000-0000-0000-0000-000000000001', 'KL', 'amber',   3),
  ('10000000-0000-0000-0000-000000000002', 'CR', 'violet',  0),
  ('10000000-0000-0000-0000-000000000002', 'MS', 'rose',    1),
  ('10000000-0000-0000-0000-000000000002', 'KL', 'amber',   2),
  ('10000000-0000-0000-0000-000000000002', 'FP', 'sky',     3),
  ('10000000-0000-0000-0000-000000000003', 'JM', 'violet',  0),
  ('10000000-0000-0000-0000-000000000003', 'RP', 'rose',    1),
  ('10000000-0000-0000-0000-000000000003', 'KL', 'amber',   2);

-- ─────────────────────────────────────
-- FACTS — Maria Kowalski (16 facts)
-- ─────────────────────────────────────

insert into facts (patient_id, key, label, value, confidence, "group", specialty, source_kind, source_id, source_label, source_excerpt, source_at, source_author, updated_at) values
  ('10000000-0000-0000-0000-000000000001', 'demographics.name',        'Name',              'Maria Kowalski',                                                                       1.0,   'demographics', 'nursing',   'report',    'doc-mk-intake',      'Intake form · 2026-02-08',            'Patient: Maria Kowalski, DOB 1971-09-14, female',                                                                  '2026-02-08T09:12:00Z', 'Reception',           '2026-02-08T09:12:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'demographics.dob',         'Date of birth',     '1971-09-14',                                                                            1.0,   'demographics', 'nursing',   'report',    'doc-mk-intake',      'Intake form · 2026-02-08',            null,                                                                                                               '2026-02-08T09:12:00Z', null,                  '2026-02-08T09:12:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'demographics.mrn',         'MRN',               'MRN-204881',                                                                            1.0,   'demographics', 'nursing',   'report',    'doc-mk-intake',      'EHR registration',                    null,                                                                                                               '2026-02-08T09:12:00Z', null,                  '2026-02-08T09:12:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'diagnosis.primary',        'Primary diagnosis', 'Invasive ductal carcinoma, left breast',                                                 0.99,  'diagnosis',    'pathology', 'pathology', 'path-mk-001',        'Path report · core biopsy 2026-02-12','Microscopic: invasive ductal carcinoma, Nottingham grade 2 (3+3+1=7). Tumor measures 2.3 cm in greatest dimension on the core.', '2026-02-13T14:30:00Z', 'Dr. R. Patel, MD',    '2026-02-13T14:30:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'diagnosis.receptors',      'Receptor status',   'ER+ (95%) · PR+ (60%) · HER2 3+ (IHC) confirmed by FISH',                               0.98,  'diagnosis',    'pathology', 'pathology', 'path-mk-002',        'IHC + FISH addendum · 2026-02-15',    'ER 95% strong, PR 60% moderate, HER2 IHC 3+; FISH HER2/CEP17 ratio 4.2 — amplified.',                              '2026-02-15T11:05:00Z', 'Dr. R. Patel, MD',    '2026-02-15T11:05:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'staging.clinical',         'Clinical stage',    'cT2 cN1 cM0 — Stage IIB',                                                               0.95,  'staging',      'radiology', 'imaging',   'img-mk-mri-001',    'Breast MRI · 2026-02-19',             '2.4 cm enhancing mass at 2 o''clock left breast; one suspicious left axillary level I node (1.1 cm).',              '2026-02-19T16:40:00Z', 'Dr. K. Lee, Radiology','2026-02-19T16:40:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'medication.neoadjuvant',   'Neoadjuvant regimen','TCHP — docetaxel + carboplatin + trastuzumab + pertuzumab, q3w × 6',                    0.97,  'medication',   'med-onc',   'note',      'note-mk-tb-1',      'Tumor board minutes · 2026-02-22',    'Consensus: HER2+ Stage IIB → neoadjuvant TCHP × 6 → surgery → adjuvant HP + endocrine therapy.',                   '2026-02-22T10:00:00Z', 'Tumor board',         '2026-02-22T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'medication.cycle',         'Current cycle',     'TCHP cycle 4 of 6 — last infusion 2026-04-15',                                          1.0,   'medication',   'nursing',   'note',      'note-mk-infusion-4','Infusion note · 2026-04-15',          null,                                                                                                               '2026-04-15T13:00:00Z', 'Onc nursing',         '2026-04-15T13:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'lab.lvef',                 'LVEF (echo)',       'EF 62% — within normal limits',                                                                0.99,  'lab',          'med-onc',   'report',    'echo-mk-002',       'Echocardiogram · 2026-04-22',         'Normal LV size and systolic function. EF 62% by Simpson biplane. No regional wall abnormalities.',                  '2026-04-22T09:30:00Z', 'Dr. A. Singh, Cardiology','2026-04-22T09:30:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'lab.cbc',                  'ANC (latest)',      '2.1 ×10⁹/L',                                                                           1.0,   'lab',          'med-onc',   'lab',       'lab-mk-cbc-3',      'CBC · 2026-04-21',                    null,                                                                                                               '2026-04-21T08:15:00Z', 'Hematology lab',      '2026-04-21T08:15:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'history.event.first-presentation','First presentation','Self-detected 2 cm lump, left breast — 2026-02-04',                              0.95,  'history',      'patient',   'note',      'note-mk-pcp',       'PCP referral letter',                 null,                                                                                                               '2026-02-06T10:00:00Z', null,                  '2026-02-06T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'genomics.panel',           'NGS panel (FoundationOne CDx)','PIK3CA p.H1047R · ERBB2 amp · TP53 wild-type · TMB 4 mut/Mb · MSS',          0.95,  'genomics',     'molecular', 'genomics',  'ngs-mk-001',        'FoundationOne CDx report · 2026-02-26','Reportable: ERBB2 amplification (cn=14), PIK3CA c.3140A>G p.H1047R (VAF 32%). VUS: ARID1A. TMB 4. MSS.',            '2026-02-26T12:00:00Z', 'Foundation Medicine', '2026-02-26T12:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'genomics.oncokb',          'OncoKB therapeutic level','ERBB2 amp · Level 1 (trastuzumab + pertuzumab) · PIK3CA H1047R · Level 1 (alpelisib in HR+/HER2-)', 0.92, 'genomics', 'molecular', 'genomics', 'oncokb-mk-001', 'OncoKB lookup · 2026-02-27',          null,                                                                                                               '2026-02-27T08:30:00Z', 'OncoKB v4.20',        '2026-02-27T08:30:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'history.surg-consult',     'Surgical consult',  'Lumpectomy + SLNB feasible if good response to neoadjuvant; reassess at MRI mid-cycle 4', 0.85, 'history',     'surg-onc',  'note',      'note-mk-surg-1',   'Surgical oncology note · 2026-02-21', 'After examination and review of MRI: candidate for breast-conserving surgery if neoadjuvant achieves >50% volumetric response. Plan SLNB at the time of surgery.', '2026-02-21T10:30:00Z', 'Dr. S. Chen, Surgical Onc', '2026-02-21T10:30:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'history.rt-consult',       'Radiation oncology consult','Whole-breast RT post-lumpectomy planned (40.05 Gy / 15 fx); boost to tumor bed if margins narrow', 0.85, 'history', 'rad-onc', 'note', 'note-mk-rt-1', 'Rad-onc consult · 2026-02-23', null, '2026-02-23T15:00:00Z', 'Dr. K. Lee, Rad-Onc', '2026-02-23T15:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'medication.pharmacy-review','Pharmacy review',  'TCHP doses verified vs BSA 1.74; no QTc / renal flags; pre-meds dexa+ondansetron+aprepitant', 0.98, 'medication', 'pharmacy', 'note', 'note-mk-pharm-1', 'Clinical pharmacy review · 2026-02-24', 'Docetaxel 75 mg/m² → 130 mg. Carboplatin AUC 6 (Calvert, GFR 88) → 540 mg. Trastuzumab 8 mg/kg loading, 6 mg/kg q3w. Pertuzumab 840 mg loading, 420 mg q3w. No interactions w/ home meds.', '2026-02-24T16:00:00Z', 'PharmD A. Riesgo', '2026-02-24T16:00:00Z');

-- ─────────────────────────────────────
-- FACTS — Thomas Berger (9 facts)
-- ─────────────────────────────────────

insert into facts (patient_id, key, label, value, confidence, "group", specialty, source_kind, source_id, source_label, source_excerpt, source_at, source_author, updated_at) values
  ('10000000-0000-0000-0000-000000000002', 'demographics.name',    'Name',              'Thomas Berger',                                                         1.0,  'demographics', 'nursing',   'report',    'doc-tb-intake',      'Intake form · 2026-03-01',        null, '2026-03-01T08:30:00Z', null, '2026-03-01T08:30:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'demographics.dob',     'Date of birth',     '1958-06-21',                                                            1.0,  'demographics', 'nursing',   'report',    'doc-tb-intake',      'Intake form',                     null, '2026-03-01T08:30:00Z', null, '2026-03-01T08:30:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'demographics.mrn',     'MRN',               'MRN-198342',                                                            1.0,  'demographics', 'nursing',   'report',    'doc-tb-intake',      'EHR registration',                null, '2026-03-01T08:30:00Z', null, '2026-03-01T08:30:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'diagnosis.primary',    'Primary diagnosis', 'Adenocarcinoma of the rectum, mid-rectum (8 cm from anal verge)',        0.99, 'diagnosis',    'pathology', 'pathology', 'path-tb-001',        'Colonoscopy biopsy report · 2026-03-04', 'Mid-rectum 3.5 cm ulcerated mass at 8 cm from anal verge. Biopsy: moderately differentiated adenocarcinoma.', '2026-03-04T15:20:00Z', 'Dr. M. Schwarz, GI Path', '2026-03-04T15:20:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'staging.clinical',     'Clinical stage',    'cT3 cN1 cM0 — Stage IIIB',                                              0.7,  'staging',      'radiology', 'imaging',   'img-tb-mri-001',    'Pelvic MRI · 2026-03-08',         'Mid-rectal mass with extramural extension into mesorectal fat (cT3, EMVI-). One suspicious mesorectal node 9 mm.', '2026-03-08T11:10:00Z', 'Dr. K. Lee, Radiology', '2026-03-08T11:10:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'lab.cea',              'CEA',               '8.4 ng/mL (elevated)',                                                  1.0,  'lab',          'med-onc',   'lab',       'lab-tb-cea-1',      'CEA · 2026-03-05',                null, '2026-03-05T07:50:00Z', null, '2026-03-05T07:50:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'medication.induction',  'Induction chemotherapy','FOLFOX × 4 cycles (TNT — induction phase)',                         0.96, 'medication',   'med-onc',   'note',      'note-tb-tb-1',      'Tumor board minutes · 2026-03-12','Plan: total neoadjuvant therapy — induction FOLFOX × 4 → long-course CRT → TME → adjuvant if indicated.', '2026-03-12T09:00:00Z', 'Tumor board', '2026-03-12T09:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'medication.cycle',     'Current cycle',     'FOLFOX cycle 4 of 4 — completed 2026-04-18',                            1.0,  'medication',   'nursing',   'note',      'note-tb-infusion-4','Infusion note · 2026-04-18',      null, '2026-04-18T14:20:00Z', null, '2026-04-18T14:20:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'imaging.restage',      'Restaging MRI',     'Pelvic MRI · 2026-04-22 (incoming PR)',                                 0.85, 'imaging',      'radiology', 'imaging',   'img-tb-mri-002',   'Pelvic MRI · 2026-04-22',         'Compared to 2026-03-08: tumor enhancement reduced ~30% but anterior extension now contacts visceral peritoneum (suggestive of cT4a). One persistent 7 mm mesorectal node.', '2026-04-22T16:00:00Z', 'Dr. K. Lee, Radiology', '2026-04-22T16:00:00Z');

-- ─────────────────────────────────────
-- FACTS — Anna Lindqvist (9 facts)
-- ─────────────────────────────────────

insert into facts (patient_id, key, label, value, confidence, "group", specialty, source_kind, source_id, source_label, source_excerpt, source_at, source_author, updated_at) values
  ('10000000-0000-0000-0000-000000000003', 'demographics.name',    'Name',              'Anna Lindqvist',                                                       1.0,  'demographics', 'nursing',   'report',    'doc-al-intake',     'Intake form · 2024-02-19',        null, '2024-02-19T10:00:00Z', null, '2024-02-19T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'demographics.dob',     'Date of birth',     '1977-11-02',                                                           1.0,  'demographics', 'nursing',   'report',    'doc-al-intake',     'Intake form',                     null, '2024-02-19T10:00:00Z', null, '2024-02-19T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'demographics.mrn',     'MRN',               'MRN-176104',                                                           1.0,  'demographics', 'nursing',   'report',    'doc-al-intake',     'EHR registration',                null, '2024-02-19T10:00:00Z', null, '2024-02-19T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'diagnosis.primary',    'Primary diagnosis', 'Invasive lobular carcinoma, right breast',                              0.98, 'diagnosis',    'pathology', 'pathology', 'path-al-001',       'Lumpectomy specimen · 2024-04-09','Invasive lobular carcinoma, 1.4 cm, grade 2. Margins clear. 0/2 sentinel nodes positive.', '2024-04-12T11:00:00Z', 'Dr. R. Patel, MD', '2024-04-12T11:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'staging.pathologic',   'Pathologic stage',  'pT1c pN0 — Stage IA',                                                  0.99, 'staging',      'pathology', 'pathology', 'path-al-001',       'Lumpectomy specimen · 2024-04-09', null, '2024-04-12T11:00:00Z', null, '2024-04-12T11:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'diagnosis.receptors',  'Receptor status',   'ER+ (98%) · PR+ (75%) · HER2 0 (negative)',                             0.98, 'diagnosis',    'pathology', 'pathology', 'path-al-001',       'IHC panel',                       null, '2024-04-12T11:00:00Z', null, '2024-04-12T11:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'medication.endocrine', 'Endocrine therapy', 'Tamoxifen 20 mg daily — start 2024-08-12, planned ≥ 5 yrs',             1.0,  'medication',   'med-onc',   'note',      'note-al-tam',       'Med-onc note · 2024-08-05',       null, '2024-08-05T13:00:00Z', 'Dr. J. Muller, Med-Onc', '2024-08-05T13:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'imaging.surveillance', 'Last mammogram',    'Bilateral mammogram · 2025-10-14 — BI-RADS 2 (benign)',                 0.99, 'imaging',      'radiology', 'imaging',   'img-al-mam-3',     'Mammogram · 2025-10-14',          null, '2025-10-14T09:00:00Z', 'Dr. K. Lee, Radiology', '2025-10-14T09:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'lab.ca153',            'CA 15-3',           '21 U/mL (within normal)',                                               1.0,  'lab',          'med-onc',   'lab',       'lab-al-ca153-2',    'CA 15-3 · 2026-04-04',            null, '2026-04-04T08:00:00Z', null, '2026-04-04T08:00:00Z');

-- ─────────────────────────────────────
-- TREATMENT PLAN PHASES (active plans, option_id = null)
-- ─────────────────────────────────────

-- Maria (4 phases)
insert into treatment_phases (patient_id, option_id, name, type, regimen, status, start_date, end_date, cycles_total, cycles_completed, rationale, sort_order) values
  ('10000000-0000-0000-0000-000000000001', null, 'Neoadjuvant TCHP', 'chemo',    'Docetaxel · carboplatin · trastuzumab · pertuzumab',                     'in-progress', '2026-02-25', '2026-06-10', 6, 4, 'HER2+ Stage IIB → standard of care neoadjuvant TCHP × 6 (NCCN BINV-J).', 0),
  ('10000000-0000-0000-0000-000000000001', null, 'Surgery',          'surgery',  'Lumpectomy + sentinel node biopsy (axillary dissection if positive)',      'planned',     '2026-07-08', null,         null, null, 'Clinical stage IIB with planned breast-conserving therapy if good response.', 1),
  ('10000000-0000-0000-0000-000000000001', null, 'Adjuvant HP',      'targeted', 'Trastuzumab + pertuzumab to complete 1 year HER2-targeted therapy',       'planned',     '2026-08-12', '2027-02-25', null, null, '1-year HER2 blockade reduces recurrence risk.', 2),
  ('10000000-0000-0000-0000-000000000001', null, 'Adjuvant endocrine','hormonal','Aromatase inhibitor (post-menopausal) for ≥ 5 years',                     'planned',     '2026-08-12', null,         null, null, 'ER/PR positive disease — endocrine therapy for ≥ 5 years.', 3);

-- Thomas (4 phases)
insert into treatment_phases (patient_id, option_id, name, type, regimen, status, start_date, end_date, cycles_total, cycles_completed, rationale, sort_order) values
  ('10000000-0000-0000-0000-000000000002', null, 'Induction FOLFOX',     'chemo',    'Oxaliplatin + 5-FU + leucovorin, q2w × 4',                 'done',        '2026-03-15', '2026-04-18', 4, 4, 'Total neoadjuvant therapy — induction phase.', 0),
  ('10000000-0000-0000-0000-000000000002', null, 'Long-course CRT',      'radiation','50.4 Gy in 28 fractions + concurrent capecitabine',         'planned',     '2026-05-06', '2026-06-17', null, null, 'TNT consolidation — long-course chemoradiation.', 1),
  ('10000000-0000-0000-0000-000000000002', null, 'TME surgery',          'surgery',  'Total mesorectal excision (low anterior resection)',         'planned',     '2026-08-05', null,         null, null, 'Standard surgical approach following TNT, 6-8 weeks after CRT completion.', 2),
  ('10000000-0000-0000-0000-000000000002', null, 'Adjuvant (if indicated)','chemo',  'Adjuvant FOLFOX or capecitabine if path response < grade 3','planned',     '2026-09-23', null,         null, null, 'Risk-adapted adjuvant per pathologic response.', 3);

-- Anna (4 phases)
insert into treatment_phases (patient_id, option_id, name, type, regimen, status, start_date, end_date, cycles_total, cycles_completed, rationale, sort_order) values
  ('10000000-0000-0000-0000-000000000003', null, 'Lumpectomy + SLNB',   'surgery',     null,                                                     'done',        '2024-04-09', '2024-04-09', null, null, 'Breast-conserving surgery, sentinel node biopsy negative.', 0),
  ('10000000-0000-0000-0000-000000000003', null, 'Adjuvant radiation',  'radiation',   'Whole-breast 40.05 Gy in 15 fractions',                   'done',        '2024-06-03', '2024-07-12', null, null, null, 1),
  ('10000000-0000-0000-0000-000000000003', null, 'Endocrine therapy',   'hormonal',    'Tamoxifen 20 mg daily ≥ 5 yrs',                           'in-progress', '2024-08-12', '2029-08-12', null, null, null, 2),
  ('10000000-0000-0000-0000-000000000003', null, 'Surveillance',        'observation', 'Mammography q6mo × 2 yrs, then annually · clinical exam q3mo', 'in-progress', '2024-08-15', null, null, null, null, 3);

-- ─────────────────────────────────────
-- TREATMENT OPTIONS — Maria (3 options)
-- ─────────────────────────────────────

insert into treatment_options (id, patient_id, name, short_label, intent, rationale, rationale_fact_ids, outcomes, toxicities, evidence, burden, patient_facing, is_chosen, sort_order) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'Standard of care',
   'Neoadjuvant TCHP × 6 → lumpectomy + SLNB → adjuvant HP + endocrine',
   'curative',
   '["HER2+ Stage IIB → matches NCCN BINV pathway for neoadjuvant systemic.", "ER+ → endocrine therapy after HER2 blockade.", "LVEF 62% → safe for trastuzumab + pertuzumab.", "ERBB2 amp confirmed (OncoKB Level 1) → HER2 blockade backbone."]',
   '["f-mk-receptors", "f-mk-stage", "f-mk-lvef", "f-mk-ngs", "f-mk-oncokb"]',
   '[{"label":"pCR (breast + axilla)","value":"50–65%","citation":"NeoSphere 2012"},{"label":"5-year iDFS","value":"~84%","citation":"APHINITY 2017"},{"label":"5-year OS","value":"~94%","citation":"APHINITY 2017"}]',
   '[{"category":"Cardiotoxicity","severity":"Monitor LVEF q3 mo · ~2% gr3+"},{"category":"Neuropathy (docetaxel)","severity":"~30% gr2+"},{"category":"Neutropenia","severity":"G-CSF support; ~10% febrile"},{"category":"Alopecia","severity":"Expected, reversible"}]',
   '["NeoSphere 2012", "APHINITY 2017", "KATHERINE 2019", "NCCN BINV"]',
   '≈ 14 mo total · 18 infusions · 1 surgery · 15 RT fractions · 5+ yrs endocrine',
   '{"name":"The standard treatment","summary":"Six rounds of chemotherapy with two HER2-targeted antibodies, then surgery to remove the tumor (keeping the breast), then radiation and a year of antibody-only treatment, plus a daily pill to block estrogen for at least five years.","livesLikeThis":"Most intense for the first 4–5 months. Hair loss is expected during chemo. Surgery is one day. Radiation is short daily visits for three weeks. The antibody year and the estrogen pill are well tolerated. Highest chance of cure."}',
   false, 0),

  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
   'De-escalated',
   'Neoadjuvant TH × 4 → lumpectomy → adjuvant T-DM1 if residual disease',
   'curative',
   '["Stage IIB but cT2 (smaller end) — APT/ATEMPT-style de-escalation candidate.", "Patient prioritizes lower toxicity, especially neuropathy.", "Response-adapted adjuvant via KATHERINE — switch to T-DM1 if non-pCR."]',
   '["f-mk-stage", "f-mk-receptors", "f-mk-oncokb"]',
   '[{"label":"pCR (breast + axilla)","value":"35–45%","citation":"ATEMPT 2021"},{"label":"5-year iDFS","value":"~80%","citation":"KATHERINE 2019"},{"label":"Severe neuropathy","value":"~10% (vs ~30% TCHP)","citation":"ATEMPT 2021"}]',
   '[{"category":"Neuropathy","severity":"~10% gr2+"},{"category":"Cardiotoxicity","severity":"Single-antibody risk lower"},{"category":"Neutropenia","severity":"Mild"}]',
   '["ATEMPT 2021", "KATHERINE 2019", "NCCN BINV"]',
   '≈ 14 mo total · 12 weekly infusions · 1 surgery · 5+ yrs endocrine',
   '{"name":"A gentler path","summary":"A milder weekly chemotherapy with one HER2 antibody for three months, then surgery, then up to a year of an antibody-only treatment that''s adjusted to how well the chemo worked.","livesLikeThis":"Less intense weekly visits, much less likely to cause numb fingers/toes long-term. Slightly lower chance of complete tumor disappearance before surgery, but the year of antibody-only treatment afterwards catches up much of that gap."}',
   false, 1),

  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
   'Trial — alpelisib add-on',
   'TCHP × 6 + alpelisib (PIK3CA H1047R) → surgery → adjuvant per response',
   'trial',
   '["PIK3CA H1047R activating mutation present (OncoKB Level 1 in HR+/HER2-; investigational here).", "Open trial slot at NCT##### for HER2+ + PIK3CA-mut.", "Patient is interested in trial participation."]',
   '["f-mk-ngs", "f-mk-oncokb"]',
   '[{"label":"pCR (estimated)","value":"55–70%","citation":"NeoPHOEBE-style estimate"},{"label":"Hyperglycemia gr3+","value":"~10%","citation":"SOLAR-1 2019"}]',
   '[{"category":"Hyperglycemia","severity":"Common — SMBG required"},{"category":"Rash","severity":"~10% gr2+"},{"category":"Diarrhea","severity":"Common"}]',
   '["SOLAR-1 2019", "trial protocol NCT-PLACEHOLDER"]',
   'Same as Standard of care + daily oral pill + extra labs/visits for trial monitoring',
   '{"name":"A clinical trial","summary":"The standard treatment plus an additional daily pill that targets a specific change in your tumor (PIK3CA), to see if it improves the chance of complete tumor disappearance.","livesLikeThis":"Same as the standard path, with extra blood-sugar monitoring and more frequent check-ins. Side effects we know about: high blood sugar, rash, diarrhea."}',
   false, 2);

-- Clinician rankings for options
insert into clinician_rankings (option_id, specialist_name, specialty, rank, confidence) values
  ('20000000-0000-0000-0000-000000000001', 'Dr. J. Muller',      'med-onc',   1, 0.95),
  ('20000000-0000-0000-0000-000000000001', 'Dr. R. Patel',       'pathology', 1, 0.90),
  ('20000000-0000-0000-0000-000000000001', 'Dr. S. Chen',        'surg-onc',  1, 0.85),
  ('20000000-0000-0000-0000-000000000001', 'Dr. K. Lee',         'rad-onc',   1, 0.92),
  ('20000000-0000-0000-0000-000000000001', 'PharmD A. Riesgo',   'pharmacy',  1, 0.88),
  ('20000000-0000-0000-0000-000000000002', 'Dr. J. Muller',      'med-onc',   2, 0.70),
  ('20000000-0000-0000-0000-000000000002', 'Dr. R. Patel',       'pathology', 2, 0.65),
  ('20000000-0000-0000-0000-000000000002', 'Dr. S. Chen',        'surg-onc',  2, 0.70),
  ('20000000-0000-0000-0000-000000000002', 'Dr. K. Lee',         'rad-onc',   2, 0.70),
  ('20000000-0000-0000-0000-000000000002', 'PharmD A. Riesgo',   'pharmacy',  2, 0.75),
  ('20000000-0000-0000-0000-000000000003', 'Dr. J. Muller',      'med-onc',   3, 0.55),
  ('20000000-0000-0000-0000-000000000003', 'Dr. R. Patel',       'pathology', 2, 0.70),
  ('20000000-0000-0000-0000-000000000003', 'Dr. S. Chen',        'surg-onc',  3, 0.50),
  ('20000000-0000-0000-0000-000000000003', 'Dr. K. Lee',         'rad-onc',   3, 0.50),
  ('20000000-0000-0000-0000-000000000003', 'PharmD A. Riesgo',   'pharmacy',  3, 0.60);

-- ─────────────────────────────────────
-- BOARD CASE — Maria
-- ─────────────────────────────────────

insert into board_cases (id, patient_id, question, status, opened_at) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'HER2+ Stage IIB · ERBB2 amp · PIK3CA H1047R — neoadjuvant strategy and adjuvant sequencing.',
   'draft', '2026-04-22T17:30:00Z');

insert into board_attendees (board_case_id, name, role, tone) values
  ('30000000-0000-0000-0000-000000000001', 'Dr. J. Muller',      'Med-Onc',                'violet'),
  ('30000000-0000-0000-0000-000000000001', 'Dr. R. Patel',       'Pathology',              'rose'),
  ('30000000-0000-0000-0000-000000000001', 'Dr. S. Chen',        'Surgical Onc',           'emerald'),
  ('30000000-0000-0000-0000-000000000001', 'Dr. K. Lee',         'Rad-Onc + Radiology',    'amber'),
  ('30000000-0000-0000-0000-000000000001', 'PharmD A. Riesgo',   'Pharmacy',               'sky');

-- ─────────────────────────────────────
-- REVIEW ITEMS (PRs)
-- ─────────────────────────────────────

insert into review_items (id, patient_id, title, summary, status, author_name, author_role, source_kind, source_id, source_label, source_excerpt, source_at, source_author, agent_verdict, opened_at) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Restaging MRI 2026-04-22 — staging change cT3 → cT4a', 'New pelvic MRI shows anterior tumor extension contacting visceral peritoneum. Conflicts with baseline cT3 staging.', 'conflict', 'Dr. K. Lee', 'Radiology', 'imaging', 'img-tb-mri-002', 'Pelvic MRI · 2026-04-22', 'Compared to 2026-03-08: tumor enhancement reduced ~30% but anterior extension now contacts visceral peritoneum (suggestive of cT4a). One persistent 7 mm mesorectal node.', '2026-04-22T16:00:00Z', 'Dr. K. Lee, Radiology', 'Conflict on staging.clinical. Auto-merge blocked. Recommended action: tumor board review on 2026-04-26.', '2026-04-22T17:14:00Z'),

  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'CBC 2026-04-21 — neutrophils 2.1', 'Routine pre-cycle 5 CBC. ANC marginal but acceptable.', 'merged', 'Hematology lab', 'Auto-feed', 'lab', 'lab-mk-cbc-3', 'CBC · 2026-04-21', 'WBC 4.1, ANC 2.1, Hgb 11.4 g/dL, Plt 188 ×10⁹/L. No transfusion threshold met.', '2026-04-21T08:15:00Z', 'Hematology lab', 'Auto-merged — within normal protocol thresholds, no DLT.', '2026-04-21T08:21:00Z'),

  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Echocardiogram 2026-04-22 — LVEF 62%', 'Routine cardiac surveillance during trastuzumab. Normal function.', 'merged', 'Dr. A. Singh', 'Cardiology', 'report', 'echo-mk-002', 'Echocardiogram · 2026-04-22', null, '2026-04-22T09:30:00Z', 'Dr. A. Singh, Cardiology', 'Auto-merged — change within measurement noise, LVEF stable.', '2026-04-22T11:02:00Z'),

  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'FOLFOX cycle 4 infusion note', 'Final induction cycle delivered without dose modification.', 'merged', 'Onc nursing', 'Care team', 'note', 'note-tb-infusion-4', 'Infusion note · 2026-04-18', null, '2026-04-18T14:20:00Z', null, 'Auto-merged.', '2026-04-18T15:00:00Z'),

  ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Patient-reported neuropathy onset', 'Patient mentioned grade 1 numbness in fingertips during cycle 4 follow-up call.', 'needs-review', 'Onc nursing', 'Care team', 'note', 'note-mk-call-4', 'Nurse call note · 2026-04-23', 'Patient reports tingling in fingertips, no functional impairment. No reported pain.', '2026-04-23T10:30:00Z', 'Onc nursing', 'Light review needed — confirm grade and symptom mapping with the treating oncologist.', '2026-04-23T10:35:00Z'),

  ('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'CA 15-3 result · 2026-04-04', 'Routine surveillance tumor marker, within normal limits.', 'merged', 'Lab feed', 'Auto-feed', 'lab', 'lab-al-ca153-2', 'CA 15-3 · 2026-04-04', null, '2026-04-04T08:00:00Z', null, 'Auto-merged — stable, no action needed.', '2026-04-04T08:45:00Z');

-- Review deltas
insert into review_deltas (review_item_id, fact_key, label, before_value, after_value, impact, sort_order) values
  ('40000000-0000-0000-0000-000000000001', 'staging.clinical',  'Clinical stage',           'cT3 cN1 cM0 — Stage IIIB',     'cT4a cN1 cM0 — Stage IIIB (upstaged T)', 'Treatment intensification likely indicated.', 0),
  ('40000000-0000-0000-0000-000000000001', 'imaging.restage',   'Restaging MRI',             null,                            'Pelvic MRI · 2026-04-22 (post-induction)', null, 1),
  ('40000000-0000-0000-0000-000000000001', 'plan.escalation',   'Plan escalation candidate', null,                            'Discuss adding short-course RT boost or earlier surgery', 'Tumor board decision required.', 2),
  ('40000000-0000-0000-0000-000000000002', 'lab.cbc',           'ANC (latest)',              '2.6 ×10⁹/L (2026-03-31)',       '2.1 ×10⁹/L', null, 0),
  ('40000000-0000-0000-0000-000000000003', 'lab.lvef',          'LVEF (echo)',               '61% (2026-03-04)',              'EF 62% — within normal limits', null, 0),
  ('40000000-0000-0000-0000-000000000004', 'medication.cycle',  'Current cycle',             'FOLFOX cycle 3 of 4',           'FOLFOX cycle 4 of 4 — completed 2026-04-18', null, 0),
  ('40000000-0000-0000-0000-000000000005', 'history.event.neuropathy', 'Adverse event',      null,                            'Grade 1 peripheral neuropathy, fingertips, onset cycle 4', 'Monitor; no dose change indicated at G1.', 0),
  ('40000000-0000-0000-0000-000000000006', 'lab.ca153',         'CA 15-3',                   '19 U/mL (2025-10-12)',          '21 U/mL (within normal)', null, 0);

-- Review conflicts (only on Thomas staging PR)
insert into review_conflicts (review_item_id, fact_key, label, before_value, after_value, severity, rationale) values
  ('40000000-0000-0000-0000-000000000001', 'staging.clinical', 'Clinical stage', 'cT3 cN1 cM0', 'cT4a cN1 cM0', 'high', 'Visceral peritoneum involvement (cT4a) materially changes prognosis and surgical plan. Cannot be auto-merged — requires multidisciplinary review.');

-- ─────────────────────────────────────
-- MEETINGS
-- ─────────────────────────────────────

-- Thomas: scheduled tumor board
insert into meetings (id, patient_id, title, date, duration_min, status) values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Tumor board · staging reconciliation', '2026-04-26T09:00:00Z', 25, 'scheduled');

insert into meeting_attendees (meeting_id, name, role, tone) values
  ('50000000-0000-0000-0000-000000000001', 'Dr. C. Romano', 'Medical Oncology',    'violet'),
  ('50000000-0000-0000-0000-000000000001', 'Dr. F. Park',   'Surgical Oncology',   'sky'),
  ('50000000-0000-0000-0000-000000000001', 'Dr. K. Lee',    'Radiology',           'amber'),
  ('50000000-0000-0000-0000-000000000001', 'Dr. M. Schwarz','GI Pathology',        'rose'),
  ('50000000-0000-0000-0000-000000000001', 'Dr. N. Ito',    'Radiation Oncology',  'emerald');

-- Thomas: completed TNT kickoff
insert into meetings (id, patient_id, title, date, duration_min, status, summary, proposed_pr_ids) values
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Tumor board · TNT plan kickoff', '2026-03-12T09:00:00Z', 22, 'completed',
   'Tumor board adopted Total Neoadjuvant Therapy: induction FOLFOX × 4 → long-course CRT (50.4 Gy + capecitabine) → TME at 6-8 weeks post-CRT → adjuvant chemo if path response < grade 3. Restaging MRI scheduled post-induction.',
   '["pr-tb-2"]');

insert into meeting_attendees (meeting_id, name, role, tone) values
  ('50000000-0000-0000-0000-000000000002', 'Dr. C. Romano', 'Medical Oncology',    'violet'),
  ('50000000-0000-0000-0000-000000000002', 'Dr. F. Park',   'Surgical Oncology',   'sky'),
  ('50000000-0000-0000-0000-000000000002', 'Dr. K. Lee',    'Radiology',           'amber'),
  ('50000000-0000-0000-0000-000000000002', 'Dr. N. Ito',    'Radiation Oncology',  'emerald');

insert into transcript_lines (id, meeting_id, speaker, role, tone, at, text, sort_order) values
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'Dr. C. Romano', 'Med-Onc',  'violet',  '00:01', 'Mid-rectal adenocarcinoma, cT3 cN1 by MRI. CEA 8.4. Performance status 1. Proposing TNT.', 0),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'Dr. F. Park',   'Surgery',  'sky',     '00:03', 'Tumor at 8 cm — sphincter preservation feasible if good response. Comfortable with TME after CRT.', 1),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'Dr. N. Ito',    'Rad-Onc',  'emerald', '00:06', 'Long-course 50.4 Gy with concurrent capecitabine, standard. Start 4 weeks after final FOLFOX.', 2),
  ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', 'Dr. K. Lee',    'Radiology','amber',   '00:10', 'Will repeat MRI after induction to assess response and re-stage before CRT.', 3),
  ('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000002', 'Dr. C. Romano', 'Med-Onc',  'violet',  '00:14', 'Consensus: induction FOLFOX × 4 → CRT → TME → adjuvant if path response is poor.', 4);

insert into agent_notes (meeting_id, attached_to_line_id, at, text) values
  ('50000000-0000-0000-0000-000000000002', null,                                   '00:01', 'Captured proposed plan: TNT (induction → CRT → TME → adjuvant).'),
  ('50000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000004', '00:10', 'Auto-scheduled restaging MRI at week 8 post-induction.'),
  ('50000000-0000-0000-0000-000000000002', null,                                   '00:14', 'Drafted PR #1 — TNT plan adoption with cited consensus.');

-- Maria: completed neoadjuvant plan meeting
insert into meetings (id, patient_id, title, date, duration_min, status, summary) values
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Tumor board · HER2+ neoadjuvant plan', '2026-02-22T10:00:00Z', 18, 'completed',
   'Plan: TCHP × 6 (q3w) → surgery → adjuvant HP to 1 yr + endocrine therapy. Echo at baseline and every 3 cycles. Surgery type guided by neoadjuvant response.');

insert into meeting_attendees (meeting_id, name, role, tone) values
  ('50000000-0000-0000-0000-000000000003', 'Dr. J. Muller', 'Medical Oncology',  'violet'),
  ('50000000-0000-0000-0000-000000000003', 'Dr. R. Patel',  'Pathology',         'rose'),
  ('50000000-0000-0000-0000-000000000003', 'Dr. F. Park',   'Surgical Oncology', 'sky'),
  ('50000000-0000-0000-0000-000000000003', 'Dr. A. Singh',  'Cardiology',        'emerald');

insert into transcript_lines (id, meeting_id, speaker, role, tone, at, text, sort_order) values
  ('60000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000003', 'Dr. R. Patel',  'Pathology', 'rose',    '00:00', 'IDC, NG2, ER 95% PR 60% HER2 3+ confirmed FISH. No LVI on core.', 0),
  ('60000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000003', 'Dr. J. Muller', 'Med-Onc',   'violet',  '00:02', 'Stage IIB clinical. Standard is neoadjuvant TCHP × 6 → surgery → adjuvant HP + endocrine.', 1),
  ('60000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000003', 'Dr. A. Singh',  'Cardiology','emerald', '00:06', 'Baseline echo normal. Recommend echocardiography q3 cycles during HER2 therapy.', 2),
  ('60000000-0000-0000-0000-000000000013', '50000000-0000-0000-0000-000000000003', 'Dr. F. Park',   'Surgery',   'sky',     '00:09', 'Plan breast conservation if good response, otherwise mastectomy. Sentinel nodes per response.', 3);

insert into agent_notes (meeting_id, at, text) values
  ('50000000-0000-0000-0000-000000000003', '00:02', 'Captured TCHP plan and timing.'),
  ('50000000-0000-0000-0000-000000000003', '00:06', 'Auto-booked echocardiogram every 3 cycles, attached to monitoring SOP.');

-- ─────────────────────────────────────
-- FOLLOW-UP ITEMS
-- ─────────────────────────────────────

insert into followup_items (patient_id, date, type, label, prep, status) values
  -- Maria
  ('10000000-0000-0000-0000-000000000001', '2026-05-06T10:00:00Z', 'lab',        'Pre-cycle 5 CBC + CMP',        'Fasting not required.',                            'scheduled'),
  ('10000000-0000-0000-0000-000000000001', '2026-05-06T13:30:00Z', 'visit',      'Cycle 5 TCHP infusion',        'Premedication 30 min prior.',                      'scheduled'),
  ('10000000-0000-0000-0000-000000000001', '2026-05-13T09:00:00Z', 'imaging',    'Mid-treatment breast MRI',     'Fast 4 h, IV contrast, remove implants if any.',   'scheduled'),
  ('10000000-0000-0000-0000-000000000001', '2026-05-27T14:00:00Z', 'visit',      'Cycle 6 TCHP infusion',        null,                                                'scheduled'),
  ('10000000-0000-0000-0000-000000000001', '2026-06-10T10:00:00Z', 'discussion', 'Surgical planning consult',    null,                                                'scheduled'),
  -- Thomas
  ('10000000-0000-0000-0000-000000000002', '2026-04-26T09:00:00Z', 'discussion', 'Tumor board · staging reconciliation', 'Review PR #3 and updated MRI.',             'scheduled'),
  ('10000000-0000-0000-0000-000000000002', '2026-05-05T11:00:00Z', 'visit',      'RT planning visit',            'Bring prior MRI and treatment summary.',            'scheduled'),
  ('10000000-0000-0000-0000-000000000002', '2026-05-06T09:00:00Z', 'imaging',    'RT simulation CT',             null,                                                'scheduled'),
  ('10000000-0000-0000-0000-000000000002', '2026-06-17T09:00:00Z', 'imaging',    'End-of-CRT MRI',              null,                                                'scheduled'),
  -- Anna
  ('10000000-0000-0000-0000-000000000003', '2025-10-14T09:00:00Z', 'imaging',    'Mammogram (12-mo)',            null,                                                'completed'),
  ('10000000-0000-0000-0000-000000000003', '2026-04-04T08:00:00Z', 'lab',        'CA 15-3 (completed)',          null,                                                'completed'),
  ('10000000-0000-0000-0000-000000000003', '2026-05-08T09:00:00Z', 'imaging',    'Bilateral mammogram (18-mo)', 'No deodorant on day of exam.',                       'scheduled'),
  ('10000000-0000-0000-0000-000000000003', '2026-05-15T11:00:00Z', 'visit',      'Med-Onc surveillance visit',   null,                                                'scheduled'),
  ('10000000-0000-0000-0000-000000000003', '2026-07-04T08:00:00Z', 'lab',        'CMP + CA 15-3',               null,                                                'scheduled');

-- ─────────────────────────────────────
-- GUIDELINES
-- ─────────────────────────────────────

insert into guidelines (id, cancer_type, title, source) values
  ('70000000-0000-0000-0000-000000000001', 'breast-her2', 'HER2+ early breast cancer · simplified pathway',  'NCCN BINV-J (adapted)'),
  ('70000000-0000-0000-0000-000000000002', 'rectal',      'Locally advanced rectal cancer · simplified pathway', 'NCCN RECT-3 (adapted)'),
  ('70000000-0000-0000-0000-000000000003', 'breast-er',   'ER+ early breast cancer · surveillance pathway',  'NCCN BINV-16 (adapted)');

insert into patient_guidelines (patient_id, guideline_id) values
  ('10000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000003');

-- Guideline nodes (breast-her2)
insert into guideline_nodes (guideline_id, node_key, label, kind, patient_path, fact_key, sort_order) values
  ('70000000-0000-0000-0000-000000000001', 'g1',  'Confirmed invasive breast cancer',        'decision',  true,  'diagnosis.primary',    0),
  ('70000000-0000-0000-0000-000000000001', 'g2',  'Receptor status',                          'decision',  true,  'diagnosis.receptors',  1),
  ('70000000-0000-0000-0000-000000000001', 'g3',  'HER2-',                                    'decision',  false, null,                   2),
  ('70000000-0000-0000-0000-000000000001', 'g4',  'HER2+',                                    'decision',  true,  null,                   3),
  ('70000000-0000-0000-0000-000000000001', 'g5',  'Clinical stage',                           'decision',  true,  'staging.clinical',     4),
  ('70000000-0000-0000-0000-000000000001', 'g6',  'T ≤ 1 cm, N0',                             'treatment', false, null,                   5),
  ('70000000-0000-0000-0000-000000000001', 'g7',  'T ≥ 2 cm or N+',                           'treatment', true,  null,                   6),
  ('70000000-0000-0000-0000-000000000001', 'g8',  'Adjuvant paclitaxel + trastuzumab',        'treatment', false, null,                   7),
  ('70000000-0000-0000-0000-000000000001', 'g9',  'Neoadjuvant TCHP × 6',                     'treatment', true,  null,                   8),
  ('70000000-0000-0000-0000-000000000001', 'g10', 'Surgery',                                   'treatment', true,  null,                   9),
  ('70000000-0000-0000-0000-000000000001', 'g11', 'Adjuvant HP (1 yr) + endocrine',           'outcome',   true,  null,                   10);

insert into guideline_edges (guideline_id, source_node_key, target_node_key, label, patient_path) values
  ('70000000-0000-0000-0000-000000000001', 'g1',  'g2',  null,              true),
  ('70000000-0000-0000-0000-000000000001', 'g2',  'g3',  'HER2 0-2+',      false),
  ('70000000-0000-0000-0000-000000000001', 'g2',  'g4',  'HER2 3+ / FISH+',true),
  ('70000000-0000-0000-0000-000000000001', 'g4',  'g5',  null,              true),
  ('70000000-0000-0000-0000-000000000001', 'g5',  'g6',  'Stage I',         false),
  ('70000000-0000-0000-0000-000000000001', 'g5',  'g7',  '≥ Stage IIA',     true),
  ('70000000-0000-0000-0000-000000000001', 'g6',  'g8',  null,              false),
  ('70000000-0000-0000-0000-000000000001', 'g7',  'g9',  null,              true),
  ('70000000-0000-0000-0000-000000000001', 'g9',  'g10', null,              true),
  ('70000000-0000-0000-0000-000000000001', 'g10', 'g11', null,              true);

-- Guideline nodes (rectal)
insert into guideline_nodes (guideline_id, node_key, label, kind, patient_path, fact_key, sort_order) values
  ('70000000-0000-0000-0000-000000000002', 'g1',  'Rectal adenocarcinoma',           'decision',  true,  'diagnosis.primary', 0),
  ('70000000-0000-0000-0000-000000000002', 'g2',  'Stage by MRI',                     'decision',  true,  'staging.clinical',  1),
  ('70000000-0000-0000-0000-000000000002', 'g3',  'cT1-T2 N0',                        'treatment', false, null,                2),
  ('70000000-0000-0000-0000-000000000002', 'g4',  'cT3 N0-N+ or cT4 any N',          'decision',  true,  null,                3),
  ('70000000-0000-0000-0000-000000000002', 'g5',  'Local excision',                   'treatment', false, null,                4),
  ('70000000-0000-0000-0000-000000000002', 'g6',  'Total Neoadjuvant Therapy (TNT)',  'treatment', true,  null,                5),
  ('70000000-0000-0000-0000-000000000002', 'g7',  'Induction FOLFOX × 4',             'treatment', true,  null,                6),
  ('70000000-0000-0000-0000-000000000002', 'g8',  'Long-course CRT (50.4 Gy + cape)', 'treatment', true,  null,                7),
  ('70000000-0000-0000-0000-000000000002', 'g9',  'Restaging MRI',                    'decision',  true,  'imaging.restage',   8),
  ('70000000-0000-0000-0000-000000000002', 'g10', 'TME surgery',                      'treatment', true,  null,                9),
  ('70000000-0000-0000-0000-000000000002', 'g11', 'Watch-and-wait (if cCR)',          'outcome',   false, null,                10),
  ('70000000-0000-0000-0000-000000000002', 'g12', 'Risk-adapted adjuvant',            'outcome',   true,  null,                11);

insert into guideline_edges (guideline_id, source_node_key, target_node_key, label, patient_path) values
  ('70000000-0000-0000-0000-000000000002', 'g1',  'g2',  null,                true),
  ('70000000-0000-0000-0000-000000000002', 'g2',  'g3',  'cT1-T2 N0',        false),
  ('70000000-0000-0000-0000-000000000002', 'g2',  'g4',  'cT3+ or N+',       true),
  ('70000000-0000-0000-0000-000000000002', 'g3',  'g5',  null,                false),
  ('70000000-0000-0000-0000-000000000002', 'g4',  'g6',  null,                true),
  ('70000000-0000-0000-0000-000000000002', 'g6',  'g7',  null,                true),
  ('70000000-0000-0000-0000-000000000002', 'g7',  'g8',  null,                true),
  ('70000000-0000-0000-0000-000000000002', 'g8',  'g9',  null,                true),
  ('70000000-0000-0000-0000-000000000002', 'g9',  'g10', 'Residual disease',  true),
  ('70000000-0000-0000-0000-000000000002', 'g9',  'g11', 'Clinical CR',       false),
  ('70000000-0000-0000-0000-000000000002', 'g10', 'g12', null,                true);

-- Guideline nodes (breast-er surveillance)
insert into guideline_nodes (guideline_id, node_key, label, kind, patient_path, fact_key, sort_order) values
  ('70000000-0000-0000-0000-000000000003', 'g1', 'Completed primary therapy',      'decision',  true,  null,                    0),
  ('70000000-0000-0000-0000-000000000003', 'g2', 'Endocrine therapy 5-10 yrs',     'treatment', true,  'medication.endocrine',  1),
  ('70000000-0000-0000-0000-000000000003', 'g3', 'Mammogram q6mo × 2 yrs',         'treatment', true,  'imaging.surveillance',  2),
  ('70000000-0000-0000-0000-000000000003', 'g4', 'Then annual mammography',         'treatment', false, null,                    3),
  ('70000000-0000-0000-0000-000000000003', 'g5', 'Recurrence workup',              'decision',  false, null,                    4),
  ('70000000-0000-0000-0000-000000000003', 'g6', 'Continued surveillance',          'outcome',   true,  null,                    5);

insert into guideline_edges (guideline_id, source_node_key, target_node_key, label, patient_path) values
  ('70000000-0000-0000-0000-000000000003', 'g1', 'g2', null,      true),
  ('70000000-0000-0000-0000-000000000003', 'g1', 'g3', null,      true),
  ('70000000-0000-0000-0000-000000000003', 'g3', 'g4', null,      false),
  ('70000000-0000-0000-0000-000000000003', 'g3', 'g5', 'Abnormal', false),
  ('70000000-0000-0000-0000-000000000003', 'g3', 'g6', 'Stable',   true),
  ('70000000-0000-0000-0000-000000000003', 'g4', 'g6', null,       false);

-- ─────────────────────────────────────
-- AGENT STATE
-- ─────────────────────────────────────

insert into agent_current_action (patient_id, action, ref_kind, ref_id, ref_label) values
  ('10000000-0000-0000-0000-000000000001', 'Reviewing 2026-04-22 echocardiogram for trastuzumab cardiac monitoring', null, null, null),
  ('10000000-0000-0000-0000-000000000002', 'Reconciling restaging MRI vs. baseline staging', 'pr', 'pr-tb-1', 'PR #3 — MRI 2026-04-22'),
  ('10000000-0000-0000-0000-000000000003', 'Drafting 18-month surveillance summary', null, null, null);

insert into agent_questions (patient_id, question, detail, ref_kind, ref_id, ref_label, options) values
  ('10000000-0000-0000-0000-000000000001', 'Confirm continued TCHP after Cycle 4 — ANC 2.1, no DLT', 'Neutrophils marginal but acceptable per protocol. Endorse continuation of cycle 5 on schedule?', 'fact', 'f-mk-cbc', 'ANC 2.1 ×10⁹/L', '["Continue on schedule", "Delay 1 week", "Reduce dose"]'),
  ('10000000-0000-0000-0000-000000000002', 'MRI 2026-04-22 suggests cT4a — change of staging vs. cT3', 'Anterior extension contacts visceral peritoneum. This conflicts with the prior cT3 from 2026-03-08. Possible explanations: progression on induction, MRI re-read, or interval inflammation. Plan implications: TNT may need to escalate, consider surgical re-staging.', 'pr', 'pr-tb-1', 'PR #3 — MRI 2026-04-22', '["Accept cT4a — escalate plan", "Request second MRI read", "Discuss at tumor board"]');

insert into agent_events (patient_id, action, ref_kind, ref_id, ref_label, created_at) values
  ('10000000-0000-0000-0000-000000000001', 'Merged echocardiogram report · LVEF 62%',          'pr',      'pr-mk-2', 'Echo 2026-04-22',            '2026-04-22T11:02:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'Linked CBC 2026-04-21 to cycle 4 progress',        null,      null,       null,                          '2026-04-21T08:30:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'Auto-scheduled mid-treatment MRI for 2026-05-13',   null,      null,       null,                          '2026-04-19T16:14:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'Flagged staging conflict on MRI 2026-04-22',       'pr',      'pr-tb-1', 'PR #3',                        '2026-04-22T17:14:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'Merged FOLFOX cycle 4 infusion note',              null,      null,       null,                          '2026-04-18T15:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'Auto-booked tumor board slot · 2026-04-26 09:00',  'meeting', 'mtg-tb-1','Tumor board · 2026-04-26',     '2026-04-22T17:30:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'Auto-booked mammogram for 2026-05-08',             'fact',    'f-al-mam','Mammography schedule',          '2026-04-20T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'Merged CA 15-3 result · 21 U/mL',                  null,      null,       null,                          '2026-04-04T08:45:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'Refilled tamoxifen · 90-day supply',               null,      null,       null,                          '2026-03-22T14:00:00Z');

-- ─────────────────────────────────────
-- DATA SOURCES & ACTIVE AGENTS
-- ─────────────────────────────────────

insert into data_sources (label, kind, status, last_sync, frequency) values
  ('PACS imaging archive',         'PACS',       'active', '13 minutes ago', 'Real-time'),
  ('Epic EHR connection',          'EHR',        'active', '27 minutes ago', 'Hourly'),
  ('Laboratory results (LIS)',     'LIS',        'active', '2 hours ago',    'Hourly'),
  ('Pathology dictation system',   'PathologyDB','warn',   '11 hours ago',   'Daily'),
  ('Tumor board mailbox',          'Email',      'active', '9 minutes ago',  'Real-time'),
  ('Clinician dictation notes',    'Notes',      'muted',  'Yesterday',      'Daily');

insert into active_agents (patient_id, name, task, type, status) values
  ('10000000-0000-0000-0000-000000000002', 'Staging reviewer',     'Reconciling MRI cT3 → cT4a',   'Specialist', 'warn'),
  ('10000000-0000-0000-0000-000000000001', 'Cardio-onc monitor',   'LVEF surveillance',             'Compliance', 'active'),
  ('10000000-0000-0000-0000-000000000002', 'Claude triage',        'Drafting tumor board summary',  'Claude',     'active'),
  ('10000000-0000-0000-0000-000000000003', 'Surveillance scheduler','Booking 18-mo mammogram',      'Triage',     'muted');
