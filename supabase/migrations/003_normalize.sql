-- =============================================
-- Cliniarc — Normalize Specialties + Attachments
-- Run this AFTER 002_seed.sql
-- =============================================

-- ─────────────────────────────────────
-- 1) REASSIGN FACT SPECIALTIES → 4 canonical
-- ─────────────────────────────────────

UPDATE facts SET specialty = 'med-onc'    WHERE specialty IN ('surg-onc', 'rad-onc', 'pharmacy');
UPDATE facts SET specialty = 'pathology'  WHERE specialty IN ('molecular', 'genetics');
UPDATE facts SET specialty = 'nursing'    WHERE specialty = 'patient';
UPDATE facts SET specialty = 'radiology'  WHERE specialty IN ('nuc-med', 'ir');

-- ─────────────────────────────────────
-- 2) ATTACHMENTS TABLE
-- ─────────────────────────────────────

CREATE TABLE attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specialty     TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('image', 'pdf', 'table', 'report')),
  name          TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  size_kb       INTEGER,
  mime_type     TEXT,
  parsed        BOOLEAN DEFAULT FALSE,
  review_item_id UUID REFERENCES review_items(id),
  uploaded_by   UUID REFERENCES clinicians(id),
  uploaded_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attachments_patient ON attachments(patient_id);
