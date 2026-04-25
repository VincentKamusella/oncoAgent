# Database Spec — Supabase

Migrating from in-memory mock data to Supabase. This spec covers schema design, access patterns, auth, and the migration path.

---

## 1. Why Supabase

- **Postgres** — relational model fits the structured medical data well (facts, PRs, meetings have clear relationships)
- **Row-Level Security (RLS)** — critical for patient data scoping, built into the platform
- **Real-time** — subscribable changes for live tumor board updates, new review items arriving
- **Auth** — built-in, maps to our clinician login model
- **Edge Functions** — for webhook receivers (lab feeds, imaging feeds) later
- **Storage** — for imaging files, documents, attachments down the road

---

## 2. Schema

### Core tables

```sql
-- ─────────────────────────────────────
-- USERS & AUTH
-- ─────────────────────────────────────

create table clinicians (
  id            uuid primary key default gen_random_uuid(),
  auth_id       uuid unique references auth.users(id),
  name          text not null,
  initials      text not null,
  role          text not null,                              -- 'oncologist', 'radiologist', etc.
  specialty     text,                                       -- maps to Specialty type
  avatar_tone   text default 'violet',
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────
-- PATIENTS
-- ─────────────────────────────────────

create table patients (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  initials          text not null,
  dob               date not null,
  age               int not null,
  sex               text not null check (sex in ('F', 'M', 'X')),
  mrn               text unique not null,
  status            text not null default 'active'
                    check (status in ('active', 'surveillance', 'archived')),
  cancer_type       text not null,
  cancer_label      text not null,
  diagnosis         text not null,
  staging           text not null,
  primary_oncologist text not null,
  case_opened_at    timestamptz not null default now(),
  avatar_tone       text default 'violet',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Which clinicians have access to which patients
create table patient_team (
  patient_id    uuid references patients(id) on delete cascade,
  clinician_id  uuid references clinicians(id) on delete cascade,
  role          text not null,                              -- 'lead', 'specialist', 'consultant'
  specialty     text,
  added_at      timestamptz default now(),
  primary key (patient_id, clinician_id)
);

-- ─────────────────────────────────────
-- FACTS (the patient record)
-- ─────────────────────────────────────

create table facts (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id) on delete cascade,
  key           text not null,                              -- e.g. 'diagnosis.primary'
  label         text not null,
  value         text not null,
  confidence    numeric(3,2) default 1.0,
  "group"       text not null
                check ("group" in (
                  'demographics', 'diagnosis', 'staging',
                  'medication', 'imaging', 'lab', 'history', 'genomics'
                )),
  specialty     text,                                       -- which specialty owns this fact
  source_kind   text,                                       -- 'lab', 'imaging', 'pathology', etc.
  source_id     text,                                       -- reference to source document
  source_label  text,
  source_at     timestamptz,
  source_author text,
  updated_at    timestamptz default now(),
  created_at    timestamptz default now(),

  -- A fact key should be unique per patient (latest value wins)
  unique (patient_id, key)
);

create index idx_facts_patient on facts(patient_id);
create index idx_facts_group on facts(patient_id, "group");
create index idx_facts_specialty on facts(patient_id, specialty);

-- ─────────────────────────────────────
-- FACT HISTORY (version control)
-- ─────────────────────────────────────

create table fact_history (
  id            uuid primary key default gen_random_uuid(),
  fact_id       uuid not null references facts(id) on delete cascade,
  patient_id    uuid not null references patients(id) on delete cascade,
  key           text not null,
  value         text not null,                              -- the value at this point in time
  changed_by    uuid references clinicians(id),
  review_item_id uuid,                                      -- which review item caused this change
  commit_id     uuid,                                       -- links to record_commits
  created_at    timestamptz default now()
);

create index idx_fact_history_fact on fact_history(fact_id);
create index idx_fact_history_patient on fact_history(patient_id);

-- ─────────────────────────────────────
-- REVIEW ITEMS (PRs)
-- ─────────────────────────────────────

create table review_items (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  title           text not null,
  summary         text,
  status          text not null default 'open'
                  check (status in ('open', 'needs-review', 'conflict', 'signed-off', 'declined')),
  priority        text default 'medium'
                  check (priority in ('low', 'medium', 'high')),
  author_name     text not null,
  author_role     text not null,
  author_specialty text,
  source_kind     text,
  source_id       text,
  source_label    text,
  agent_verdict   text,
  opened_at       timestamptz default now(),
  signed_off_at   timestamptz,
  signed_off_by   uuid references clinicians(id),
  declined_at     timestamptz,
  declined_by     uuid references clinicians(id),
  decline_reason  text,
  is_amendment    boolean default false,
  amends_commit_id uuid,                                    -- if this is an amendment, which commit
  created_at      timestamptz default now()
);

create index idx_review_patient on review_items(patient_id);
create index idx_review_status on review_items(patient_id, status);
create index idx_review_opened on review_items(opened_at desc);

-- Proposed fact changes within a review item
create table review_deltas (
  id              uuid primary key default gen_random_uuid(),
  review_item_id  uuid not null references review_items(id) on delete cascade,
  fact_key        text not null,
  label           text not null,
  before_value    text,                                     -- null for new facts
  after_value     text not null,
  impact          text,
  created_at      timestamptz default now()
);

create index idx_deltas_review on review_deltas(review_item_id);

-- Agent-detected conflicts on a review item
create table review_conflicts (
  id              uuid primary key default gen_random_uuid(),
  review_item_id  uuid not null references review_items(id) on delete cascade,
  fact_key        text not null,
  label           text not null,
  before_value    text not null,
  after_value     text not null,
  severity        text not null check (severity in ('low', 'medium', 'high')),
  rationale       text not null,
  created_at      timestamptz default now()
);

create index idx_conflicts_review on review_conflicts(review_item_id);

-- Agent checks on a review item (block/warn/info)
create table review_checks (
  id                uuid primary key default gen_random_uuid(),
  review_item_id    uuid not null references review_items(id) on delete cascade,
  severity          text not null check (severity in ('block', 'warn', 'info')),
  title             text not null,
  message           text not null,
  evidence          jsonb default '[]',                     -- array of { ref, path, text }
  proposed_resolutions jsonb default '[]',                  -- array of { id, label, isDefault, requires }
  resolved_with     text,                                   -- resolution ID chosen by reviewer
  resolved_at       timestamptz,
  resolved_by       uuid references clinicians(id),
  created_at        timestamptz default now()
);

create index idx_checks_review on review_checks(review_item_id);

-- Sign-offs from multiple reviewers
create table review_signoffs (
  id              uuid primary key default gen_random_uuid(),
  review_item_id  uuid not null references review_items(id) on delete cascade,
  clinician_id    uuid not null references clinicians(id),
  specialty       text,
  note            text,
  signed_at       timestamptz default now(),
  unique (review_item_id, clinician_id)
);

-- ─────────────────────────────────────
-- VERSION HISTORY
-- ─────────────────────────────────────

create table record_commits (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  review_item_id  uuid references review_items(id),
  signed_off_by   uuid references clinicians(id),
  changes         jsonb not null,                           -- the deltas applied
  is_amendment    boolean default false,
  amends_commit_id uuid references record_commits(id),
  committed_at    timestamptz default now()
);

create index idx_commits_patient on record_commits(patient_id, committed_at desc);

-- Full snapshots of patient record at a point in time
create table record_snapshots (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  commit_id       uuid not null references record_commits(id),
  facts           jsonb not null,                           -- full facts array at this point
  plan            jsonb not null,                           -- full plan at this point
  created_at      timestamptz default now()
);

create index idx_snapshots_patient on record_snapshots(patient_id, created_at desc);

-- ─────────────────────────────────────
-- TREATMENT
-- ─────────────────────────────────────

create table treatment_phases (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  option_id       uuid,                                     -- null = active plan, non-null = part of an option
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

create table treatment_options (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  name            text not null,
  short_label     text not null,
  intent          text not null
                  check (intent in ('curative', 'palliative', 'trial', 'watch')),
  rationale       jsonb default '[]',                       -- string array
  rationale_fact_ids jsonb default '[]',                    -- fact ID array
  outcomes        jsonb default '[]',                       -- OutcomeMetric array
  toxicities      jsonb default '[]',                       -- ToxicityNote array
  evidence        jsonb default '[]',                       -- string array of citations
  burden          text,
  patient_facing  jsonb,                                    -- { name, summary, livesLikeThis }
  is_chosen       boolean default false,
  created_at      timestamptz default now()
);

create index idx_options_patient on treatment_options(patient_id);

create table clinician_rankings (
  id              uuid primary key default gen_random_uuid(),
  option_id       uuid not null references treatment_options(id) on delete cascade,
  clinician_id    uuid references clinicians(id),
  specialist_name text not null,
  specialty       text not null,
  rank            int not null,
  confidence      numeric(3,2) not null,
  note            text,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────
-- BOARD
-- ─────────────────────────────────────

create table board_cases (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  question        text not null,
  status          text not null default 'draft'
                  check (status in ('draft', 'live', 'sent-to-patient', 'decided', 'archived')),
  opened_at       timestamptz default now(),
  opened_from_issue text,
  decided_option_id uuid references treatment_options(id),
  decided_at      timestamptz,
  decided_by      text check (decided_by in ('patient', 'team')),
  created_at      timestamptz default now()
);

create index idx_board_patient on board_cases(patient_id);

create table board_attendees (
  board_case_id   uuid references board_cases(id) on delete cascade,
  clinician_id    uuid references clinicians(id),
  name            text not null,
  role            text not null,
  primary key (board_case_id, name)
);

-- ─────────────────────────────────────
-- MEETINGS
-- ─────────────────────────────────────

create table meetings (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients(id) on delete cascade,
  title           text not null,
  date            date not null,
  duration_min    int,
  status          text not null default 'scheduled'
                  check (status in ('scheduled', 'live', 'completed')),
  summary         text,
  proposed_pr_ids jsonb default '[]',
  created_at      timestamptz default now()
);

create index idx_meetings_patient on meetings(patient_id, date desc);

create table meeting_attendees (
  meeting_id      uuid references meetings(id) on delete cascade,
  name            text not null,
  role            text not null,
  tone            text,
  primary key (meeting_id, name)
);

create table transcript_lines (
  id              uuid primary key default gen_random_uuid(),
  meeting_id      uuid not null references meetings(id) on delete cascade,
  speaker         text not null,
  role            text not null,
  tone            text,
  at              text not null,                            -- timestamp within meeting (e.g. "00:02:14")
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
  date            date not null,
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
  cancer_type     text not null,
  title           text not null,
  source          text not null,
  created_at      timestamptz default now()
);

create table guideline_nodes (
  id              uuid primary key default gen_random_uuid(),
  guideline_id    uuid not null references guidelines(id) on delete cascade,
  label           text not null,
  detail          text,
  kind            text not null check (kind in ('decision', 'outcome', 'treatment')),
  patient_path    boolean default false,
  fact_key        text,
  sort_order      int default 0
);

create table guideline_edges (
  id              uuid primary key default gen_random_uuid(),
  guideline_id    uuid not null references guidelines(id) on delete cascade,
  source_node_id  uuid not null references guideline_nodes(id),
  target_node_id  uuid not null references guideline_nodes(id),
  label           text,
  patient_path    boolean default false
);

-- Patient-specific guideline mapping
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
  ref_kind        text,                                     -- 'pr', 'fact', 'meeting'
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
  options         jsonb default '[]',                       -- string array
  answered        boolean default false,
  answered_at     timestamptz,
  created_at      timestamptz default now()
);

create index idx_agent_questions_patient on agent_questions(patient_id);
```

---

## 3. Row-Level Security (RLS)

Patient data must be scoped to authorized clinicians. Every table with `patient_id` gets an RLS policy.

```sql
-- Enable RLS on all patient-scoped tables
alter table patients enable row level security;
alter table facts enable row level security;
alter table review_items enable row level security;
alter table meetings enable row level security;
-- ... (all patient-scoped tables)

-- Policy: clinicians can only see patients they're on the team for
create policy "team_access" on patients
  for select using (
    id in (
      select patient_id from patient_team
      where clinician_id = (
        select id from clinicians where auth_id = auth.uid()
      )
    )
  );

-- Policy: facts visible only for patients the clinician has access to
create policy "team_access" on facts
  for select using (
    patient_id in (
      select patient_id from patient_team
      where clinician_id = (
        select id from clinicians where auth_id = auth.uid()
      )
    )
  );

-- Same pattern for all patient_id tables...
-- Insert/Update/Delete policies based on role (lead vs specialist vs consultant)
```

### For the hackathon

Skip RLS initially. All data visible to the logged-in user. Add RLS when multi-user support matters.

---

## 4. Access patterns (queries)

These are the queries the app currently makes, mapped from mock-data functions to SQL:

```sql
-- getPatient(id) — load a single patient with all nested data
-- Split into parallel queries for performance:

-- 1. Patient base
select * from patients where id = $1;

-- 2. Facts
select * from facts where patient_id = $1 order by "group", key;

-- 3. Treatment plan (active phases, not part of an option)
select * from treatment_phases where patient_id = $1 and option_id is null order by sort_order;

-- 4. Agent state
select * from agent_questions where patient_id = $1 and answered = false;
select * from agent_events where patient_id = $1 order by created_at desc limit 10;

-- prsForPatient(id) → review_items
select * from review_items where patient_id = $1 order by opened_at desc;

-- prById(id)
select * from review_items where id = $1;
select * from review_deltas where review_item_id = $1;
select * from review_conflicts where review_item_id = $1;
select * from review_checks where review_item_id = $1;

-- meetingsForPatient(id)
select m.*, array_agg(ma.*) as attendees
from meetings m
left join meeting_attendees ma on ma.meeting_id = m.id
where m.patient_id = $1
group by m.id
order by m.date desc;

-- meetingById(id) — includes transcript
select * from meetings where id = $1;
select * from transcript_lines where meeting_id = $1 order by sort_order;
select * from agent_notes where meeting_id = $1;

-- followupForPatient(id)
select * from followup_items where patient_id = $1 order by date asc;

-- guidelinesFor(patientId)
select g.* from guidelines g
join patient_guidelines pg on pg.guideline_id = g.id
where pg.patient_id = $1;
-- + nodes and edges for that guideline

-- Facts filtered by specialty (vault sidebar)
select * from facts where patient_id = $1 and specialty = $2;

-- Facts filtered by group (tool call)
select * from facts where patient_id = $1 and "group" = $2;

-- Version history for a fact
select * from fact_history where fact_id = $1 order by created_at desc;

-- Record commits (timeline)
select * from record_commits where patient_id = $1 order by committed_at desc;

-- Point-in-time snapshot
select * from record_snapshots
where patient_id = $1 and created_at <= $2
order by created_at desc limit 1;
```

---

## 5. Migration from mock data

### Strategy

Keep mock data as the seed. Write a migration script that:

1. Reads the TypeScript mock-data objects
2. Transforms them to match the SQL schema (camelCase → snake_case, nested objects → flat rows)
3. Inserts into Supabase via the client SDK

### Seed script outline

```typescript
// scripts/seed.ts
import { createClient } from '@supabase/supabase-js';
import { patients } from '@/lib/mock-data/patients';
import { allPRs } from '@/lib/mock-data/prs';
import { allMeetings } from '@/lib/mock-data/meetings';
import { allFollowups } from '@/lib/mock-data/followup';
import { allGuidelines } from '@/lib/mock-data/guidelines';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role for seeding
);

async function seed() {
  // 1. Create demo clinician
  // 2. Insert patients
  // 3. Insert patient_team (link clinician to all patients)
  // 4. Insert facts (flatten patient.facts[])
  // 5. Insert treatment_phases (flatten patient.plan[])
  // 6. Insert review_items (from PRs, mapping fields)
  // 7. Insert meetings + attendees + transcript_lines + agent_notes
  // 8. Insert followup_items
  // 9. Insert guidelines + nodes + edges + patient_guidelines
  // 10. Insert agent_events + agent_questions
  // 11. Insert treatment_options + clinician_rankings (for patients that have them)
  // 12. Insert board_cases + board_attendees
}
```

### Parallel operation

During migration, both mock data and Supabase can coexist:

```typescript
// lib/data.ts — data access layer
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

export async function getPatient(id: string) {
  if (USE_SUPABASE) {
    return getPatientFromSupabase(id);
  }
  return getPatientFromMock(id);  // current behavior
}
```

This lets us switch between mock and real data with an env var, keeping the app working while we wire things up.

---

## 6. Supabase client setup

```typescript
// lib/supabase/client.ts — browser client
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/server.ts — server client (route handlers, server components)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # server-side only, for seed script
NEXT_PUBLIC_USE_SUPABASE=false          # toggle mock vs real data
```

---

## 7. Real-time subscriptions

For live features (tumor board, new review items):

```typescript
// Subscribe to new review items for a patient
supabase
  .channel('review-items')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'review_items',
    filter: `patient_id=eq.${patientId}`,
  }, (payload) => {
    // New review item arrived — update UI
  })
  .subscribe();

// Subscribe to board case status changes (live tumor board)
supabase
  .channel('board-case')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'board_cases',
    filter: `id=eq.${caseId}`,
  }, (payload) => {
    // Board case status changed — update UI
  })
  .subscribe();
```

---

## 8. Build priority

### Phase 1 — Foundation
- Install `@supabase/supabase-js` and `@supabase/ssr`
- Create Supabase project, add env vars
- Run schema migration (create all tables)
- Create `lib/supabase/client.ts` and `lib/supabase/server.ts`
- Write and run seed script to populate from mock data
- Create `lib/data.ts` abstraction layer with `USE_SUPABASE` toggle

### Phase 2 — Read path
- Replace mock-data imports with Supabase queries in data layer
- Verify all pages render correctly from Supabase data
- Keep mock data as fallback

### Phase 3 — Write path
- Review item sign-off writes to `review_items`, `facts`, `fact_history`, `record_commits`
- Review item decline writes status + reason
- Amendment creation
- Treatment option selection

### Phase 4 — Auth & RLS
- Set up Supabase Auth (email/password for hackathon)
- Create clinician record on signup
- Enable RLS policies
- Scope all queries to authenticated user's patient team

### Phase 5 — Real-time & advanced
- Real-time subscriptions for live features
- Edge Functions for incoming data webhooks
- Storage for document attachments
- Snapshot creation on each commit

---

## 9. Type generation

Use Supabase CLI to generate TypeScript types from the schema:

```bash
npx supabase gen types typescript --project-id xxxx > lib/supabase/types.ts
```

This replaces hand-maintained types for database rows. The existing `lib/types.ts` types remain for UI-specific shapes (they may extend or transform the DB types).

---

## 10. What stays in mock data

Even after Supabase is live, some data makes sense to keep as static config:

| Data | Why |
|---|---|
| Guideline graphs | Reference data, not patient-specific. Could be a separate table but rarely changes. |
| Specialty labels & display names | UI constants |
| Agent check definitions | Logic, not data — stays in code |
| Demo/seed data | For testing and demo mode |
