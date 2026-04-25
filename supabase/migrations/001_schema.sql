-- =============================================
-- Cliniarc — Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================

-- ─────────────────────────────────────
-- CLINICIANS
-- ─────────────────────────────────────

create table clinicians (
  id            uuid primary key default gen_random_uuid(),
  auth_id       uuid unique,
  name          text not null,
  initials      text not null,
  role          text not null,
  specialty     text,
  avatar_tone   text default 'violet',
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────
-- PATIENTS
-- ─────────────────────────────────────

create table patients (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  initials      text not null,
  dob           date not null,
  age           int not null,
  sex           text not null check (sex in ('F', 'M', 'X')),
  mrn           text unique not null,
  status        text not null default 'active'
                check (status in ('active', 'surveillance', 'archived')),
  cancer_type   text not null,
  cancer_label  text not null,
  diagnosis     text not null,
  staging       text not null,
  primary_oncologist text not null,
  case_opened_at date not null,
  avatar_tone   text default 'violet',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table patient_team (
  patient_id    uuid references patients(id) on delete cascade,
  clinician_id  uuid references clinicians(id) on delete cascade,
  role          text not null,
  specialty     text,
  added_at      timestamptz default now(),
  primary key (patient_id, clinician_id)
);

create table vault_avatars (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id) on delete cascade,
  initials      text not null,
  tone          text not null,
  sort_order    int default 0
);

-- ─────────────────────────────────────
-- FACTS
-- ─────────────────────────────────────

create table facts (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id) on delete cascade,
  key           text not null,
  label         text not null,
  value         text not null,
  confidence    numeric(4,3) default 1.0,
  "group"       text not null
                check ("group" in (
                  'demographics', 'diagnosis', 'staging',
                  'medication', 'imaging', 'lab', 'history', 'genomics'
                )),
  specialty     text,
  source_kind   text,
  source_id     text,
  source_label  text,
  source_excerpt text,
  source_at     timestamptz,
  source_author text,
  source_specialty text,
  updated_at    timestamptz default now(),
  created_at    timestamptz default now(),
  unique (patient_id, key)
);

create index idx_facts_patient on facts(patient_id);
create index idx_facts_group on facts(patient_id, "group");
create index idx_facts_specialty on facts(patient_id, specialty);

-- ─────────────────────────────────────
-- FACT HISTORY (version control)
-- ─────────────────────────────────────

create table fact_history (
  id              uuid primary key default gen_random_uuid(),
  fact_id         uuid not null references facts(id) on delete cascade,
  patient_id      uuid not null references patients(id) on delete cascade,
  key             text not null,
  old_value       text,
  new_value       text not null,
  changed_by      uuid references clinicians(id),
  review_item_id  uuid,
  created_at      timestamptz default now()
);

create index idx_fact_history_fact on fact_history(fact_id);
create index idx_fact_history_patient on fact_history(patient_id);

-- ─────────────────────────────────────
-- TREATMENT PLAN
-- ─────────────────────────────────────

create table treatment_phases (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  option_id       uuid,
  name            text not null,
  type            text not null
                  check (type in (
                    'chemo', 'radiation', 'surgery', 'immunotherapy',
                    'targeted', 'hormonal', 'observation'
                  )),
  regimen         text,
  status          text not null default 'planned'
                  check (status in ('done', 'in-progress', 'planned', 'skipped')),
  start_date      date,
  end_date        date,
  cycles_total    int,
  cycles_completed int,
  notes           text,
  rationale       text,
  sort_order      int default 0,
  created_at      timestamptz default now()
);

create index idx_phases_patient on treatment_phases(patient_id);
create index idx_phases_option on treatment_phases(option_id);

-- ─────────────────────────────────────
-- TREATMENT OPTIONS
-- ─────────────────────────────────────

create table treatment_options (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references patients(id) on delete cascade,
  name              text not null,
  short_label       text not null,
  intent            text not null
                    check (intent in ('curative', 'palliative', 'trial', 'watch')),
  rationale         jsonb default '[]',
  rationale_fact_ids jsonb default '[]',
  outcomes          jsonb default '[]',
  toxicities        jsonb default '[]',
  evidence          jsonb default '[]',
  burden            text,
  patient_facing    jsonb,
  is_chosen         boolean default false,
  sort_order        int default 0,
  created_at        timestamptz default now()
);

create index idx_options_patient on treatment_options(patient_id);

-- Now add FK from treatment_phases.option_id
alter table treatment_phases
  add constraint fk_phases_option
  foreign key (option_id) references treatment_options(id) on delete cascade;

create table clinician_rankings (
  id              uuid primary key default gen_random_uuid(),
  option_id       uuid not null references treatment_options(id) on delete cascade,
  specialist_name text not null,
  specialty       text not null,
  rank            int not null,
  confidence      numeric(4,3) not null,
  note            text,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────
-- BOARD CASES
-- ─────────────────────────────────────

create table board_cases (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references patients(id) on delete cascade,
  question          text not null,
  status            text not null default 'draft'
                    check (status in ('draft', 'live', 'sent-to-patient', 'decided', 'archived')),
  opened_at         timestamptz default now(),
  opened_from_issue text,
  decided_option_id uuid references treatment_options(id),
  decided_at        timestamptz,
  decided_by        text check (decided_by in ('patient', 'team')),
  created_at        timestamptz default now()
);

create index idx_board_patient on board_cases(patient_id);

create table board_attendees (
  id              uuid primary key default gen_random_uuid(),
  board_case_id   uuid not null references board_cases(id) on delete cascade,
  name            text not null,
  role            text not null,
  tone            text
);

-- ─────────────────────────────────────
-- REVIEW ITEMS (PRs)
-- ─────────────────────────────────────

create table review_items (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  title           text not null,
  summary         text,
  status          text not null default 'open'
                  check (status in ('open', 'needs-review', 'conflict', 'merged', 'declined')),
  priority        text default 'medium'
                  check (priority in ('low', 'medium', 'high')),
  author_name     text not null,
  author_role     text not null,
  source_kind     text,
  source_id       text,
  source_label    text,
  source_excerpt  text,
  source_at       timestamptz,
  source_author   text,
  agent_verdict   text,
  opened_at       timestamptz default now(),
  merged_at       timestamptz,
  merged_by       uuid references clinicians(id),
  declined_at     timestamptz,
  declined_by     uuid references clinicians(id),
  decline_reason  text,
  is_amendment    boolean default false,
  amends_commit_id uuid,
  created_at      timestamptz default now()
);

create index idx_review_patient on review_items(patient_id);
create index idx_review_status on review_items(patient_id, status);
create index idx_review_opened on review_items(opened_at desc);

create table review_deltas (
  id              uuid primary key default gen_random_uuid(),
  review_item_id  uuid not null references review_items(id) on delete cascade,
  fact_key        text not null,
  label           text not null,
  before_value    text,
  after_value     text not null,
  impact          text,
  sort_order      int default 0
);

create index idx_deltas_review on review_deltas(review_item_id);

create table review_conflicts (
  id              uuid primary key default gen_random_uuid(),
  review_item_id  uuid not null references review_items(id) on delete cascade,
  fact_key        text not null,
  label           text not null,
  before_value    text not null,
  after_value     text not null,
  severity        text not null check (severity in ('low', 'medium', 'high')),
  rationale       text not null
);

create index idx_conflicts_review on review_conflicts(review_item_id);

-- ─────────────────────────────────────
-- VERSION HISTORY
-- ─────────────────────────────────────

create table record_commits (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  review_item_id  uuid references review_items(id),
  signed_off_by   uuid references clinicians(id),
  changes         jsonb not null,
  is_amendment    boolean default false,
  amends_commit_id uuid references record_commits(id),
  committed_at    timestamptz default now()
);

create index idx_commits_patient on record_commits(patient_id, committed_at desc);

create table record_snapshots (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  commit_id       uuid not null references record_commits(id),
  facts           jsonb not null,
  plan            jsonb not null,
  created_at      timestamptz default now()
);

create index idx_snapshots_patient on record_snapshots(patient_id, created_at desc);

-- ─────────────────────────────────────
-- MEETINGS
-- ─────────────────────────────────────

create table meetings (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  title           text not null,
  date            timestamptz not null,
  duration_min    int,
  status          text not null default 'scheduled'
                  check (status in ('scheduled', 'live', 'completed')),
  summary         text,
  proposed_pr_ids jsonb default '[]',
  created_at      timestamptz default now()
);

create index idx_meetings_patient on meetings(patient_id, date desc);

create table meeting_attendees (
  id              uuid primary key default gen_random_uuid(),
  meeting_id      uuid not null references meetings(id) on delete cascade,
  name            text not null,
  role            text not null,
  tone            text
);

create table transcript_lines (
  id              uuid primary key default gen_random_uuid(),
  meeting_id      uuid not null references meetings(id) on delete cascade,
  speaker         text not null,
  role            text not null,
  tone            text,
  at              text not null,
  text            text not null,
  sort_order      int default 0
);

create index idx_transcript_meeting on transcript_lines(meeting_id, sort_order);

create table agent_notes (
  id                    uuid primary key default gen_random_uuid(),
  meeting_id            uuid not null references meetings(id) on delete cascade,
  attached_to_line_id   uuid references transcript_lines(id),
  at                    text not null,
  text                  text not null,
  created_at            timestamptz default now()
);

-- ─────────────────────────────────────
-- FOLLOW-UP
-- ─────────────────────────────────────

create table followup_items (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  date            timestamptz not null,
  type            text not null
                  check (type in ('imaging', 'lab', 'visit', 'discussion')),
  label           text not null,
  prep            text,
  status          text not null default 'scheduled'
                  check (status in ('scheduled', 'completed', 'overdue')),
  created_at      timestamptz default now()
);

create index idx_followup_patient on followup_items(patient_id, date);

-- ─────────────────────────────────────
-- GUIDELINES
-- ─────────────────────────────────────

create table guidelines (
  id              uuid primary key default gen_random_uuid(),
  cancer_type     text not null unique,
  title           text not null,
  source          text not null,
  created_at      timestamptz default now()
);

create table guideline_nodes (
  id              uuid primary key default gen_random_uuid(),
  guideline_id    uuid not null references guidelines(id) on delete cascade,
  node_key        text not null,
  label           text not null,
  detail          text,
  kind            text not null check (kind in ('decision', 'outcome', 'treatment')),
  patient_path    boolean default false,
  fact_key        text,
  sort_order      int default 0
);

create index idx_gnodes_guideline on guideline_nodes(guideline_id);

create table guideline_edges (
  id              uuid primary key default gen_random_uuid(),
  guideline_id    uuid not null references guidelines(id) on delete cascade,
  source_node_key text not null,
  target_node_key text not null,
  label           text,
  patient_path    boolean default false
);

create index idx_gedges_guideline on guideline_edges(guideline_id);

create table patient_guidelines (
  patient_id      uuid references patients(id) on delete cascade,
  guideline_id    uuid references guidelines(id) on delete cascade,
  primary key (patient_id, guideline_id)
);

-- ─────────────────────────────────────
-- AGENT STATE
-- ─────────────────────────────────────

create table agent_events (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  action          text not null,
  ref_kind        text,
  ref_id          text,
  ref_label       text,
  created_at      timestamptz default now()
);

create index idx_agent_events_patient on agent_events(patient_id, created_at desc);

create table agent_questions (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  question        text not null,
  detail          text,
  ref_kind        text,
  ref_id          text,
  ref_label       text,
  options         jsonb default '[]',
  answered        boolean default false,
  answered_at     timestamptz,
  created_at      timestamptz default now()
);

create index idx_agent_questions_patient on agent_questions(patient_id);

create table agent_current_action (
  patient_id      uuid primary key references patients(id) on delete cascade,
  action          text not null,
  ref_kind        text,
  ref_id          text,
  ref_label       text,
  updated_at      timestamptz default now()
);

-- ─────────────────────────────────────
-- DATA SOURCES & ACTIVE AGENTS (operational)
-- ─────────────────────────────────────

create table data_sources (
  id              uuid primary key default gen_random_uuid(),
  label           text not null,
  kind            text not null,
  status          text not null default 'active'
                  check (status in ('active', 'warn', 'muted')),
  last_sync       text,
  frequency       text,
  created_at      timestamptz default now()
);

create table active_agents (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  name            text not null,
  task            text not null,
  type            text not null,
  status          text not null default 'active'
                  check (status in ('active', 'warn', 'muted')),
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger patients_updated_at
  before update on patients
  for each row execute function update_updated_at();
