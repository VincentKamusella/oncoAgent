-- =============================================
-- Cliniarc — Expanded Seed Data
-- Run this AFTER 003_normalize.sql
-- =============================================

-- ─────────────────────────────────────
-- NEW FACTS — Maria Kowalski (~9 new → total ≥25)
-- ─────────────────────────────────────

insert into facts (patient_id, key, label, value, confidence, "group", specialty, source_kind, source_id, source_label, source_excerpt, source_at, source_author, updated_at) values
  ('10000000-0000-0000-0000-000000000001', 'diagnosis.ki67',           'Ki-67 proliferation index',  '25%',                                                                      0.98, 'diagnosis',    'pathology', 'pathology', 'path-mk-003',       'Ki-67 addendum · 2026-02-15',        'Ki-67 proliferative index 25% by MIB-1 immunostain, moderate proliferative activity.',                              '2026-02-15T12:00:00Z', 'Dr. R. Patel, MD',        '2026-02-15T12:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'diagnosis.tumor-size',     'Tumor size on core biopsy',  '2.3 cm greatest dimension',                                                    0.97, 'diagnosis',    'pathology', 'pathology', 'path-mk-001',       'Path report · core biopsy 2026-02-12','Tumor measures 2.3 cm in greatest dimension on the core.',                                                           '2026-02-13T14:30:00Z', 'Dr. R. Patel, MD',        '2026-02-13T14:30:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'diagnosis.lvi',            'Lymphovascular invasion',    'Not identified on core biopsy',                                                 0.90, 'diagnosis',    'pathology', 'pathology', 'path-mk-001',       'Path report · core biopsy 2026-02-12','No definite lymphovascular invasion identified on core biopsy material.',                                             '2026-02-13T14:30:00Z', 'Dr. R. Patel, MD',        '2026-02-13T14:30:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'imaging.staging-ct',       'Staging CT chest/abdomen',   'No distant metastases',                                                         0.98, 'imaging',      'radiology', 'imaging',   'img-mk-ct-001',     'CT chest/abdomen/pelvis · 2026-02-18','No evidence of pulmonary metastases. Liver, adrenals unremarkable. No suspicious lymphadenopathy above the diaphragm.', '2026-02-18T10:30:00Z', 'Dr. K. Lee, Radiology',   '2026-02-18T10:30:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'imaging.bone-scan',        'Bone scan',                  'No osseous metastases',                                                         0.98, 'imaging',      'radiology', 'imaging',   'img-mk-bone-001',   'Whole-body bone scan · 2026-02-20',   'No abnormal radiotracer uptake to suggest skeletal metastatic disease. Degenerative changes L3-L4.',                 '2026-02-20T14:00:00Z', 'Dr. K. Lee, Radiology',   '2026-02-20T14:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'lab.ecog',                 'ECOG performance status',    '1',                                                                             1.0,  'lab',          'med-onc',   'note',      'note-mk-baseline',  'Med-onc baseline assessment · 2026-02-10','ECOG PS 1. Fully ambulatory, restricted in physically strenuous activity.',                                       '2026-02-10T11:00:00Z', 'Dr. J. Muller, Med-Onc',  '2026-02-10T11:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'demographics.anthropometry','Height / Weight / BSA',     '165 cm / 68 kg / BSA 1.74 m²',                                                 1.0,  'demographics', 'med-onc',   'note',      'note-mk-baseline',  'Med-onc baseline assessment · 2026-02-10','Ht 165 cm, Wt 68 kg, BSA 1.74 m² (DuBois).',                                                                     '2026-02-10T11:00:00Z', 'Dr. J. Muller, Med-Onc',  '2026-02-10T11:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'history.comorbidities',    'Comorbidities',              'None significant',                                                              1.0,  'history',      'med-onc',   'note',      'note-mk-baseline',  'Med-onc baseline assessment · 2026-02-10','PMH: No significant comorbidities. No diabetes, hypertension, or cardiac history.',                                '2026-02-10T11:00:00Z', 'Dr. J. Muller, Med-Onc',  '2026-02-10T11:00:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'demographics.allergies',   'Allergies',                  'NKDA',                                                                          1.0,  'demographics', 'nursing',   'report',    'doc-mk-intake',     'Intake form · 2026-02-08',            'Allergies: No known drug allergies (NKDA).',                                                                        '2026-02-08T09:12:00Z', 'Reception',               '2026-02-08T09:12:00Z'),
  ('10000000-0000-0000-0000-000000000001', 'history.social',           'Social history',             'Non-smoker, primary school teacher, lives with partner',                          0.95, 'history',      'nursing',   'report',    'doc-mk-intake',     'Intake form · 2026-02-08',            'Non-smoker, occasional alcohol (<3 units/week). Occupation: primary school teacher. Lives with partner.',            '2026-02-08T09:12:00Z', 'Reception',               '2026-02-08T09:12:00Z');

-- ─────────────────────────────────────
-- NEW FACTS — Thomas Berger (~16 new → total ≥25)
-- ─────────────────────────────────────

insert into facts (patient_id, key, label, value, confidence, "group", specialty, source_kind, source_id, source_label, source_excerpt, source_at, source_author, updated_at) values
  -- Pathology
  ('10000000-0000-0000-0000-000000000002', 'diagnosis.msi',            'Microsatellite status',      'MSS (microsatellite stable)',                                                   0.99, 'diagnosis',    'pathology', 'pathology', 'path-tb-002',       'MSI/IHC panel · 2026-03-06',          'Intact nuclear expression of MLH1, MSH2, MSH6, PMS2. Conclusion: MSS.',                                             '2026-03-06T10:00:00Z', 'Dr. M. Schwarz, GI Path', '2026-03-06T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'genomics.kras',            'KRAS status',                'Wild-type',                                                                     0.98, 'genomics',     'pathology', 'pathology', 'path-tb-003',       'Molecular panel · 2026-03-10',        'KRAS exon 2/3/4 wild-type. NRAS wild-type. BRAF V600 wild-type.',                                                    '2026-03-10T14:00:00Z', 'Dr. M. Schwarz, GI Path', '2026-03-10T14:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'genomics.braf',            'BRAF status',                'V600 wild-type',                                                                0.98, 'genomics',     'pathology', 'pathology', 'path-tb-003',       'Molecular panel · 2026-03-10',        'BRAF V600E/K not detected.',                                                                                         '2026-03-10T14:00:00Z', 'Dr. M. Schwarz, GI Path', '2026-03-10T14:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'diagnosis.grade',          'Tumor grade',                'Moderately differentiated (G2)',                                                 0.99, 'diagnosis',    'pathology', 'pathology', 'path-tb-001',       'Colonoscopy biopsy report · 2026-03-04','Moderately differentiated adenocarcinoma.',                                                                         '2026-03-04T15:20:00Z', 'Dr. M. Schwarz, GI Path', '2026-03-04T15:20:00Z'),
  -- Radiology
  ('10000000-0000-0000-0000-000000000002', 'imaging.staging-ct',       'Staging CT chest/abdomen',   'No distant metastases',                                                         0.98, 'imaging',      'radiology', 'imaging',   'img-tb-ct-001',     'CT chest/abdomen/pelvis · 2026-03-06','No pulmonary nodules. Liver homogeneous, no focal lesions. No peritoneal disease. No distant metastases (cM0).',      '2026-03-06T09:00:00Z', 'Dr. K. Lee, Radiology',   '2026-03-06T09:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'imaging.emvi',             'EMVI status (MRI)',          'EMVI negative',                                                                 0.90, 'imaging',      'radiology', 'imaging',   'img-tb-mri-001',    'Pelvic MRI · 2026-03-08',             'Extramural vascular invasion (EMVI) not identified on baseline MRI.',                                                '2026-03-08T11:10:00Z', 'Dr. K. Lee, Radiology',   '2026-03-08T11:10:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'imaging.tumor-distance',   'Distance from anal verge',   '8 cm (mid-rectum)',                                                              0.99, 'imaging',      'radiology', 'imaging',   'img-tb-mri-001',    'Pelvic MRI · 2026-03-08',             'Mass centered at 8 cm from anal verge, mid-rectal. Inferior margin at 6.5 cm.',                                      '2026-03-08T11:10:00Z', 'Dr. K. Lee, Radiology',   '2026-03-08T11:10:00Z'),
  -- Med-onc
  ('10000000-0000-0000-0000-000000000002', 'lab.ecog',                 'ECOG performance status',    '1',                                                                              1.0, 'lab',          'med-onc',   'note',      'note-tb-baseline',  'Med-onc baseline assessment · 2026-03-02','ECOG PS 1. Active, able to carry out work of a light or sedentary nature.',                                       '2026-03-02T10:00:00Z', 'Dr. C. Romano, Med-Onc',  '2026-03-02T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'lab.cea-post',             'CEA post-induction',         '4.2 ng/mL (declining from 8.4)',                                                 1.0, 'lab',          'med-onc',   'lab',       'lab-tb-cea-2',      'CEA · 2026-04-20',                    'CEA 4.2 ng/mL. Previous: 8.4 ng/mL (2026-03-05). 50% decline during induction.',                                    '2026-04-20T08:00:00Z', 'Biochemistry lab',        '2026-04-20T08:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'lab.lft',                  'Liver function',             'Normal — ALT 22, AST 19, bilirubin 0.8',                                         1.0, 'lab',          'med-onc',   'lab',       'lab-tb-cmp-1',      'CMP · 2026-03-14',                    'ALT 22 U/L, AST 19 U/L, total bilirubin 0.8 mg/dL, albumin 4.1 g/dL. All within normal limits.',                    '2026-03-14T08:00:00Z', 'Biochemistry lab',        '2026-03-14T08:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'lab.renal',                'Renal function',             'Normal — creatinine 0.9, GFR >90',                                               1.0, 'lab',          'med-onc',   'lab',       'lab-tb-cmp-1',      'CMP · 2026-03-14',                    'Creatinine 0.9 mg/dL, eGFR >90 mL/min. Adequate for oxaliplatin dosing.',                                            '2026-03-14T08:00:00Z', 'Biochemistry lab',        '2026-03-14T08:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'history.event.neuropathy', 'Oxaliplatin neuropathy',     'Grade 1 cold-triggered paresthesias, onset cycle 3',                              0.95, 'history',      'med-onc',   'note',      'note-tb-neuro-1',   'Toxicity assessment · 2026-04-10',    'Patient reports tingling in fingertips with cold exposure since cycle 3. No functional impairment. CTCAE grade 1.',   '2026-04-10T11:00:00Z', 'Dr. C. Romano, Med-Onc',  '2026-04-10T11:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'lab.treatment-response',   'Treatment response',         'Partial response — CEA declining, tumor enhancement reduced 30%',                 0.85, 'lab',          'med-onc',   'note',      'note-tb-response',  'Post-induction assessment · 2026-04-22','CEA halved (8.4→4.2). Restaging MRI shows ~30% reduction in tumor enhancement. Partial response to induction.',     '2026-04-22T17:00:00Z', 'Dr. C. Romano, Med-Onc',  '2026-04-22T17:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'demographics.anthropometry','Weight / BSA',              '82 kg / BSA 1.96 m²',                                                            1.0, 'demographics', 'med-onc',   'note',      'note-tb-baseline',  'Med-onc baseline assessment · 2026-03-02','Ht 178 cm, Wt 82 kg, BSA 1.96 m² (DuBois).',                                                                     '2026-03-02T10:00:00Z', 'Dr. C. Romano, Med-Onc',  '2026-03-02T10:00:00Z'),
  -- Nursing
  ('10000000-0000-0000-0000-000000000002', 'demographics.allergies',   'Allergies',                  'NKDA',                                                                            1.0, 'demographics', 'nursing',   'report',    'doc-tb-intake',     'Intake form · 2026-03-01',            'Allergies: No known drug allergies (NKDA).',                                                                          '2026-03-01T08:30:00Z', null,                      '2026-03-01T08:30:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'demographics.height-weight','Height / Weight',           '178 cm / 82 kg',                                                                  1.0, 'demographics', 'nursing',   'report',    'doc-tb-intake',     'Intake form · 2026-03-01',            'Height 178 cm, Weight 82 kg.',                                                                                        '2026-03-01T08:30:00Z', null,                      '2026-03-01T08:30:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'history.social',           'Social history',             'Retired engineer, non-smoker, lives with wife',                                    0.95, 'history',      'nursing',   'report',    'doc-tb-intake',     'Intake form · 2026-03-01',            'Retired mechanical engineer. Non-smoker. Alcohol: rare. Lives with wife.',                                             '2026-03-01T08:30:00Z', null,                      '2026-03-01T08:30:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'medication.infusion-tolerance','Infusion tolerance',     'Tolerated all 4 FOLFOX cycles without dose modification',                          1.0, 'medication',   'nursing',   'note',      'note-tb-infusion-4','Infusion note · 2026-04-18',          'No infusion reactions. Full doses delivered all cycles. Grade 1 nausea managed with ondansetron.',                     '2026-04-18T14:20:00Z', 'Onc nursing',             '2026-04-18T14:20:00Z');

-- ─────────────────────────────────────
-- NEW FACTS — Anna Lindqvist (~16 new → total ≥25)
-- ─────────────────────────────────────

insert into facts (patient_id, key, label, value, confidence, "group", specialty, source_kind, source_id, source_label, source_excerpt, source_at, source_author, updated_at) values
  -- Pathology
  ('10000000-0000-0000-0000-000000000003', 'genomics.oncotype',        'Oncotype DX recurrence score','18 (low-intermediate risk)',                                                   0.98, 'genomics',     'pathology', 'genomics',  'onco-al-001',       'Oncotype DX report · 2024-05-02',     'Oncotype DX Breast Recurrence Score: 18. Risk category: low-intermediate. Estimated 10-year distant recurrence: 11%.','2024-05-02T10:00:00Z', 'Genomic Health',          '2024-05-02T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'diagnosis.ki67',           'Ki-67 proliferation index',  '15%',                                                                           0.97, 'diagnosis',    'pathology', 'pathology', 'path-al-002',       'Ki-67 addendum · 2024-04-14',         'Ki-67 proliferative index 15% by MIB-1 immunostain, low-moderate proliferative activity.',                            '2024-04-14T09:00:00Z', 'Dr. R. Patel, MD',        '2024-04-14T09:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'diagnosis.margins',        'Surgical margins',           'Clear, closest margin 5 mm (medial)',                                            0.99, 'diagnosis',    'pathology', 'pathology', 'path-al-001',       'Lumpectomy specimen · 2024-04-09',    'All margins clear. Closest margin: 5 mm medial. No ink on tumor.',                                                    '2024-04-12T11:00:00Z', 'Dr. R. Patel, MD',        '2024-04-12T11:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'genomics.brca',            'BRCA1/2 status',             'Wild-type (no pathogenic variants)',                                             0.99, 'genomics',     'pathology', 'genomics',  'gen-al-001',        'Germline panel · 2024-05-20',         'BRCA1: no pathogenic or likely pathogenic variant. BRCA2: no pathogenic or likely pathogenic variant. PALB2, CHEK2, ATM: negative.', '2024-05-20T14:00:00Z', 'Invitae Genetics',  '2024-05-20T14:00:00Z'),
  -- Radiology
  ('10000000-0000-0000-0000-000000000003', 'imaging.post-surgical',    'Post-surgical baseline mammogram','Bilateral mammogram · 2024-08-20 — BI-RADS 2 (benign, post-surgical changes)', 0.99, 'imaging', 'radiology', 'imaging',   'img-al-mam-1',     'Mammogram · 2024-08-20',              'Right breast: expected post-lumpectomy changes. Left breast unremarkable. BI-RADS 2.',                                '2024-08-20T09:00:00Z', 'Dr. K. Lee, Radiology',   '2024-08-20T09:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'imaging.dexa',             'Bone density scan',          'Normal (T-score -0.8 lumbar spine, -0.5 femoral neck)',                           0.99, 'imaging',      'radiology', 'imaging',   'img-al-dexa-1',     'DEXA scan · 2024-09-10',              'T-score lumbar spine -0.8, femoral neck -0.5. Normal bone density. Baseline prior to tamoxifen.',                      '2024-09-10T10:00:00Z', 'Dr. K. Lee, Radiology',   '2024-09-10T10:00:00Z'),
  -- Med-onc
  ('10000000-0000-0000-0000-000000000003', 'medication.adherence',     'Tamoxifen adherence',        'Good — patient reports daily compliance, pill count consistent',                  0.95, 'medication',   'med-onc',   'note',      'note-al-fu-4',      'Med-onc follow-up · 2026-04-15',      'Tamoxifen adherence confirmed. Patient takes 20 mg daily without missed doses. Pill count consistent.',                '2026-04-15T14:00:00Z', 'Dr. J. Muller, Med-Onc',  '2026-04-15T14:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'demographics.menopausal',  'Menopausal status',          'Premenopausal',                                                                  0.98, 'demographics', 'med-onc',   'note',      'note-al-tam',       'Med-onc note · 2024-08-05',           'Premenopausal. Regular menses. Tamoxifen selected over AI per NCCN recommendation for premenopausal patients.',       '2024-08-05T13:00:00Z', 'Dr. J. Muller, Med-Onc',  '2024-08-05T13:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'lab.lipids',               'Lipid panel',                'Normal — TC 195, LDL 110, HDL 62, TG 115',                                       1.0, 'lab',          'med-onc',   'lab',       'lab-al-lipid-1',    'Lipid panel · 2026-04-04',            'TC 195, LDL 110, HDL 62, TG 115 mg/dL. All within normal limits. Tamoxifen-related monitoring.',                      '2026-04-04T08:00:00Z', 'Biochemistry lab',        '2026-04-04T08:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'history.event.endocrine-se','Endocrine side effects',    'Hot flashes (grade 1), no thromboembolic events',                                 0.95, 'history',      'med-onc',   'note',      'note-al-fu-4',      'Med-onc follow-up · 2026-04-15',      'Reports mild hot flashes (CTCAE grade 1), manageable. No vaginal bleeding. No DVT/PE symptoms.',                      '2026-04-15T14:00:00Z', 'Dr. J. Muller, Med-Onc',  '2026-04-15T14:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'lab.ecog',                 'ECOG performance status',    '0',                                                                               1.0, 'lab',          'med-onc',   'note',      'note-al-fu-4',      'Med-onc follow-up · 2026-04-15',      'ECOG PS 0. Fully active, no restrictions.',                                                                           '2026-04-15T14:00:00Z', 'Dr. J. Muller, Med-Onc',  '2026-04-15T14:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'demographics.anthropometry','Weight',                    '64 kg (stable)',                                                                  1.0, 'demographics', 'med-onc',   'note',      'note-al-fu-4',      'Med-onc follow-up · 2026-04-15',      'Weight 64 kg, stable from baseline. BMI 23.4.',                                                                       '2026-04-15T14:00:00Z', 'Dr. J. Muller, Med-Onc',  '2026-04-15T14:00:00Z'),
  -- Nursing
  ('10000000-0000-0000-0000-000000000003', 'history.qol',              'Patient-reported QOL',       'Good — FACT-B score 112/148',                                                     0.90, 'history',      'nursing',   'report',    'doc-al-qol-1',      'PRO questionnaire · 2026-04-15',      'FACT-B total score 112/148. Physical well-being 24/28, functional 22/28. Overall: good quality of life.',              '2026-04-15T09:30:00Z', 'Onc nursing',             '2026-04-15T09:30:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'history.appointment-adherence','Appointment adherence',  '100% — all scheduled visits attended',                                             1.0, 'history',      'nursing',   'report',    'doc-al-adherence',  'Clinic records · 2026-04-15',         '8/8 scheduled appointments attended over 23 months. No cancellations or no-shows.',                                   '2026-04-15T09:30:00Z', 'Onc nursing',             '2026-04-15T09:30:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'demographics.contact-pref','Contact preferences',        'Email preferred, mobile as backup',                                                1.0, 'demographics', 'nursing',   'report',    'doc-al-intake',     'Intake form · 2024-02-19',            'Preferred contact: email. Backup: mobile phone. Consented to patient portal communications.',                          '2024-02-19T10:00:00Z', null,                      '2024-02-19T10:00:00Z'),
  ('10000000-0000-0000-0000-000000000003', 'demographics.allergies',   'Allergies',                  'Penicillin (rash)',                                                                1.0, 'demographics', 'nursing',   'report',    'doc-al-intake',     'Intake form · 2024-02-19',            'Drug allergy: Penicillin — maculopapular rash. No anaphylaxis history.',                                               '2024-02-19T10:00:00Z', null,                      '2024-02-19T10:00:00Z');

-- ─────────────────────────────────────
-- NEW REVIEW ITEMS (PRs)
-- ─────────────────────────────────────

-- Thomas: needs-review PR for oxaliplatin neuropathy assessment
insert into review_items (id, patient_id, title, summary, status, author_name, author_role, source_kind, source_id, source_label, source_excerpt, source_at, source_author, agent_verdict, opened_at) values
  ('40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002',
   'Oxaliplatin neuropathy assessment — grade 1',
   'Toxicity assessment documents grade 1 cold-triggered paresthesias during FOLFOX induction. Needs clinician confirmation before CRT phase.',
   'needs-review', 'Dr. C. Romano', 'Medical Oncology', 'note', 'note-tb-neuro-1', 'Toxicity assessment · 2026-04-10',
   'Patient reports tingling in fingertips with cold exposure since cycle 3. No functional impairment. CTCAE grade 1.',
   '2026-04-10T11:00:00Z', 'Dr. C. Romano, Med-Onc',
   'Neuropathy grade 1 — no dose modification required for completed FOLFOX. Document for CRT baseline.',
   '2026-04-10T11:30:00Z');

-- Thomas: declined PR for duplicate CEA entry
insert into review_items (id, patient_id, title, summary, status, author_name, author_role, source_kind, source_id, source_label, source_excerpt, source_at, source_author, agent_verdict, opened_at, declined_at, decline_reason) values
  ('40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002',
   'CEA 2026-03-05 — duplicate entry',
   'Duplicate CEA value submission from lab interface. Already captured in lab.cea fact.',
   'declined', 'Lab feed', 'Auto-feed', 'lab', 'lab-tb-cea-dup', 'CEA · 2026-03-05 (duplicate)',
   'CEA 8.4 ng/mL.',
   '2026-03-05T09:00:00Z', 'Biochemistry lab',
   'Duplicate of existing lab.cea fact. Declined — no new information.',
   '2026-03-05T09:10:00Z', '2026-03-05T09:15:00Z', 'Duplicate data — same CEA value already recorded from initial lab feed.');

-- Anna: open PR for upcoming 18-month mammogram result
insert into review_items (id, patient_id, title, summary, status, author_name, author_role, source_kind, source_id, source_label, source_excerpt, source_at, source_author, agent_verdict, opened_at) values
  ('40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003',
   '18-month mammogram · scheduled 2026-05-08',
   'Bilateral mammogram scheduled for surveillance protocol. Awaiting result to update imaging.surveillance fact.',
   'open', 'Surveillance scheduler', 'Triage agent', 'imaging', 'img-al-mam-4', 'Mammogram · 2026-05-08 (pending)',
   null,
   '2026-05-08T09:00:00Z', 'Dr. K. Lee, Radiology',
   'Awaiting result. Will auto-merge if BI-RADS 1-2; flag for review if BI-RADS 3+.',
   '2026-04-20T10:00:00Z');

-- Anna: needs-review PR for tamoxifen adherence note
insert into review_items (id, patient_id, title, summary, status, author_name, author_role, source_kind, source_id, source_label, source_excerpt, source_at, source_author, agent_verdict, opened_at) values
  ('40000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003',
   'Tamoxifen adherence confirmed · 2026-04-15',
   'Med-onc follow-up documents continued daily tamoxifen compliance. Updates medication.adherence fact.',
   'needs-review', 'Dr. J. Muller', 'Medical Oncology', 'note', 'note-al-fu-4', 'Med-onc follow-up · 2026-04-15',
   'Tamoxifen adherence confirmed. Patient takes 20 mg daily without missed doses.',
   '2026-04-15T14:00:00Z', 'Dr. J. Muller, Med-Onc',
   'Adherence update — recommend merge. No concern noted.',
   '2026-04-15T14:30:00Z');

-- Maria: open PR for mid-treatment breast MRI scheduling
insert into review_items (id, patient_id, title, summary, status, author_name, author_role, source_kind, source_id, source_label, source_excerpt, source_at, source_author, agent_verdict, opened_at) values
  ('40000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001',
   'Mid-treatment breast MRI · scheduled 2026-05-13',
   'Response assessment MRI scheduled per protocol at mid-cycle 4. Result will guide surgical planning.',
   'open', 'Surveillance scheduler', 'Triage agent', 'imaging', 'img-mk-mri-002', 'Breast MRI · 2026-05-13 (pending)',
   null,
   '2026-05-13T09:00:00Z', 'Dr. K. Lee, Radiology',
   'Awaiting result. Key decision point: >50% volumetric response → breast-conserving surgery feasible.',
   '2026-04-19T16:14:00Z');

-- ─────────────────────────────────────
-- REVIEW DELTAS for new PRs
-- ─────────────────────────────────────

insert into review_deltas (review_item_id, fact_key, label, before_value, after_value, impact, sort_order) values
  -- Thomas neuropathy PR
  ('40000000-0000-0000-0000-000000000010', 'history.event.neuropathy', 'Adverse event — neuropathy', null, 'Grade 1 cold-triggered paresthesias, fingertips, onset cycle 3', 'Document for CRT baseline. No dose change needed (FOLFOX completed).', 0),
  -- Thomas duplicate CEA PR
  ('40000000-0000-0000-0000-000000000011', 'lab.cea', 'CEA', '8.4 ng/mL (elevated)', '8.4 ng/mL (elevated) — duplicate', 'No change — duplicate submission.', 0),
  -- Anna mammogram PR
  ('40000000-0000-0000-0000-000000000012', 'imaging.surveillance', 'Last mammogram', 'Bilateral mammogram · 2025-10-14 — BI-RADS 2', 'Bilateral mammogram · 2026-05-08 (pending)', 'Surveillance imaging — 18-month protocol.', 0),
  -- Anna tamoxifen adherence PR
  ('40000000-0000-0000-0000-000000000013', 'medication.adherence', 'Tamoxifen adherence', null, 'Good — daily compliance confirmed 2026-04-15', 'Positive adherence signal. Continue current regimen.', 0),
  -- Maria MRI PR
  ('40000000-0000-0000-0000-000000000014', 'imaging.response-mri', 'Mid-treatment breast MRI', null, 'Breast MRI · 2026-05-13 (scheduled)', 'Key response assessment — determines surgical approach.', 0);

-- ─────────────────────────────────────
-- MEETINGS — updates and additions
-- ─────────────────────────────────────

-- Thomas: change scheduled tumor board to completed with transcript
UPDATE meetings
SET status = 'completed',
    duration_min = 28,
    summary = 'Tumor board reviewed restaging MRI showing cT4a upstage. Consensus: proceed with long-course CRT as planned. Surgical approach may require extended resection. Re-evaluate with post-CRT MRI. CEA decline (8.4→4.2) is encouraging despite T-stage concern.'
WHERE id = '50000000-0000-0000-0000-000000000001';

insert into transcript_lines (id, meeting_id, speaker, role, tone, at, text, sort_order) values
  ('60000000-0000-0000-0000-000000000020', '50000000-0000-0000-0000-000000000001', 'Dr. K. Lee',    'Radiology',          'amber',   '00:01', 'Restaging MRI shows ~30% reduction in enhancement but anterior extension now contacts visceral peritoneum. Favoring upstage to cT4a.', 0),
  ('60000000-0000-0000-0000-000000000021', '50000000-0000-0000-0000-000000000001', 'Dr. M. Schwarz','GI Pathology',       'rose',    '00:04', 'Histologically MSS, KRAS and BRAF wild-type. No molecular contraindication to standard CRT.', 1),
  ('60000000-0000-0000-0000-000000000022', '50000000-0000-0000-0000-000000000001', 'Dr. F. Park',   'Surgical Oncology',  'sky',     '00:07', 'If cT4a is confirmed post-CRT, we may need an extended resection — possible beyond TME. Let us reassess after CRT MRI.', 2),
  ('60000000-0000-0000-0000-000000000023', '50000000-0000-0000-0000-000000000001', 'Dr. N. Ito',    'Radiation Oncology', 'emerald', '00:11', 'CRT plan unchanged — 50.4 Gy with concurrent capecitabine. The peritoneal contact does not alter our field or dose.', 3),
  ('60000000-0000-0000-0000-000000000024', '50000000-0000-0000-0000-000000000001', 'Dr. C. Romano', 'Medical Oncology',   'violet',  '00:15', 'CEA dropped 50% — encouraging biochemical response despite imaging concern. Proceed with CRT, re-stage post-CRT, then finalize surgical approach.', 4);

insert into agent_notes (meeting_id, attached_to_line_id, at, text) values
  ('50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000020', '00:01', 'Staging conflict confirmed at tumor board: cT3→cT4a.'),
  ('50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000022', '00:07', 'Surgical plan may change — flagged for post-CRT re-evaluation.'),
  ('50000000-0000-0000-0000-000000000001', null,                                   '00:15', 'Consensus: proceed CRT as planned, re-stage post-CRT, surgical decision deferred.');

-- Anna: surveillance check-in meeting (completed)
insert into meetings (id, patient_id, title, date, duration_min, status, summary) values
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003',
   'Surveillance check-in · 23-month review',
   '2026-04-15T14:00:00Z', 12, 'completed',
   'All surveillance markers stable. Tamoxifen well tolerated with grade 1 hot flashes only. CA 15-3 normal. Next mammogram scheduled 2026-05-08. Continue current regimen.');

insert into meeting_attendees (meeting_id, name, role, tone) values
  ('50000000-0000-0000-0000-000000000004', 'Dr. J. Muller', 'Medical Oncology', 'violet'),
  ('50000000-0000-0000-0000-000000000004', 'Onc nursing',   'Nursing',          'rose');

insert into transcript_lines (id, meeting_id, speaker, role, tone, at, text, sort_order) values
  ('60000000-0000-0000-0000-000000000030', '50000000-0000-0000-0000-000000000004', 'Dr. J. Muller', 'Med-Onc',  'violet', '00:00', 'Anna is 23 months post-diagnosis. Tamoxifen ongoing, good adherence. CA 15-3 21, stable. Last mammogram BI-RADS 2.', 0),
  ('60000000-0000-0000-0000-000000000031', '50000000-0000-0000-0000-000000000004', 'Onc nursing',   'Nursing',  'rose',   '00:03', 'PRO scores good. Reports mild hot flashes. No new symptoms. Appointment adherence 100%.', 1),
  ('60000000-0000-0000-0000-000000000032', '50000000-0000-0000-0000-000000000004', 'Dr. J. Muller', 'Med-Onc',  'violet', '00:06', 'Continue tamoxifen. 18-month mammogram booked for May 8th. Next visit in 3 months.', 2);

insert into agent_notes (meeting_id, at, text) values
  ('50000000-0000-0000-0000-000000000004', '00:00', 'Surveillance on track. All markers stable.'),
  ('50000000-0000-0000-0000-000000000004', '00:06', 'Confirmed next mammogram 2026-05-08 and follow-up visit schedule.');

-- Maria: cycle 4 follow-up meeting discussing neuropathy (completed)
insert into meetings (id, patient_id, title, date, duration_min, status, summary) values
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001',
   'Cycle 4 follow-up · neuropathy and response assessment',
   '2026-04-23T14:00:00Z', 15, 'completed',
   'Cycle 4 TCHP completed. ANC 2.1 — marginal but acceptable. Grade 1 neuropathy reported (fingertip tingling). LVEF stable at 62%. Plan: continue cycle 5 on schedule. Mid-treatment breast MRI scheduled 2026-05-13.');

insert into meeting_attendees (meeting_id, name, role, tone) values
  ('50000000-0000-0000-0000-000000000005', 'Dr. J. Muller', 'Medical Oncology', 'violet'),
  ('50000000-0000-0000-0000-000000000005', 'Onc nursing',   'Nursing',          'rose'),
  ('50000000-0000-0000-0000-000000000005', 'Dr. A. Singh',  'Cardiology',       'emerald');

insert into transcript_lines (id, meeting_id, speaker, role, tone, at, text, sort_order) values
  ('60000000-0000-0000-0000-000000000040', '50000000-0000-0000-0000-000000000005', 'Dr. J. Muller', 'Med-Onc',     'violet',  '00:00', 'TCHP cycle 4 delivered on schedule. ANC 2.1, marginal. Patient reports new fingertip tingling — grade 1 neuropathy.', 0),
  ('60000000-0000-0000-0000-000000000041', '50000000-0000-0000-0000-000000000005', 'Onc nursing',   'Nursing',     'rose',    '00:03', 'Tingling in both hands, no pain, no functional limitation. Patient reports it worsens in cold. No other new symptoms.', 1),
  ('60000000-0000-0000-0000-000000000042', '50000000-0000-0000-0000-000000000005', 'Dr. A. Singh',  'Cardiology',  'emerald', '00:06', 'Echo from yesterday — LVEF 62%, stable. No wall motion abnormalities. Safe to continue trastuzumab.', 2),
  ('60000000-0000-0000-0000-000000000043', '50000000-0000-0000-0000-000000000005', 'Dr. J. Muller', 'Med-Onc',     'violet',  '00:09', 'Neuropathy grade 1 — continue docetaxel at current dose. If it progresses to grade 2, consider dose reduction. Mid-treatment MRI on May 13th.', 3);

insert into agent_notes (meeting_id, attached_to_line_id, at, text) values
  ('50000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000040', '00:00', 'Grade 1 neuropathy documented. No dose change at this stage.'),
  ('50000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000042', '00:06', 'LVEF stable — cardiac clearance confirmed for cycle 5.'),
  ('50000000-0000-0000-0000-000000000005', null,                                   '00:09', 'Cycle 5 approved. Mid-treatment MRI confirmed 2026-05-13.');
