-- Ink Homes CRM — schema (mirrors Google Sheet 1:1, per HWT-141 spec)
-- 4 entities: contacts, leads, conversation_logs, follow_ups + lookup enums

-- ============ ENUMS ============

create type lead_stage as enum (
  'new',            -- ใหม่ / Uncontacted
  'contacted',      -- ติดต่อ / Intake
  'qualified',      -- สนใจ / Qualified
  'site_visit',     -- นัดดูโชว์รูม/ที่ดิน
  'proposal',       -- เสนอราคา / Quote
  'won',            -- ปิดการขาย
  'unqualified',    -- ไม่ผ่าน
  'lost',           -- หลุด
  'duplicate',      -- ซ้ำ
  'no_answer'       -- ไม่ตอบ
);

create type lead_source as enum (
  'FACEBOOK', 'WEBSITE', 'LINE', 'CALL', 'OTHER'
);

create type channel_type as enum (
  'PHONE', 'LINE', 'MESSENGER', 'WHATSAPP', 'EMAIL', 'SITE_FORM', 'OTHER'
);

create type direction_type as enum ('IN', 'OUT');

create type priority_type as enum ('low', 'medium', 'high', 'urgent');

create type followup_status as enum ('open', 'done', 'cancelled');

-- ============ CONTACTS (30 fields) ============

create table contacts (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,               -- Contact ID from sheet (e.g. CT-001)
  full_name text not null,
  primary_phone text,
  normalized_phone text unique,        -- dedupe key (strip - and spaces)
  email text,
  line_id text,
  fb_name text,
  province text,
  preferred_contact_time text,
  first_source lead_source,
  first_lead_date timestamptz,
  latest_lead_id text,
  interest text,                       -- Interest/Project Type
  budget_range text,
  land_status text,
  timeline text,
  crm_stage lead_stage default 'new',
  contacted_yet boolean default false,
  last_contact_date timestamptz,
  last_contact_channel channel_type,
  last_contact_outcome text,
  latest_conversation_summary text,
  next_followup_date timestamptz,
  next_action text,
  owner text,                          -- team member name
  priority priority_type default 'medium',
  do_not_contact boolean default false,
  notes text,
  all_linked_lead_ids text[] default '{}',
  log_count int default 0,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_contacts_phone on contacts(normalized_phone);
create index idx_contacts_stage on contacts(crm_stage);
create index idx_contacts_owner on contacts(owner);
create index idx_contacts_deleted on contacts(deleted_at) where deleted_at is null;

-- ============ LEADS (28 fields) ============

create table leads (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,               -- Lead ID from sheet (e.g. LD-MAY26-061)
  contact_id uuid references contacts(id) on delete set null,
  legacy_contact_id text,              -- original sheet Contact ID for migration mapping
  lead_date timestamptz default now(),
  month_tab text,
  original_statuses text,
  crm_stage lead_stage default 'new',
  priority priority_type default 'medium',
  full_name text not null,
  phone text,
  email text,
  province text,
  source lead_source default 'FACEBOOK',
  interest text,
  preferred_contact_time text,
  owner text,
  next_followup_date timestamptz,
  last_contact_date timestamptz,
  last_contact_channel channel_type,
  last_contact_summary text,
  deal_value numeric(12,2),
  probability_pct int,
  next_action text,
  archived boolean default false,
  meta_lead_id text,                   -- FB leadgen ID
  duplicate_check text,                -- match key for dup detection
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_leads_contact on leads(contact_id);
create index idx_leads_stage on leads(crm_stage);
create index idx_leads_source on leads(source);
create index idx_leads_owner on leads(owner);
create index idx_leads_date on leads(lead_date);
create index idx_leads_meta on leads(meta_lead_id);

-- ============ CONVERSATION LOGS ============

create table conversation_logs (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  lead_id uuid references leads(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  logged_at timestamptz default now(),
  channel channel_type,
  direction direction_type default 'IN',
  team_member text,
  outcome text,
  summary text,
  next_action text,
  next_followup_date timestamptz,
  attachment_link text,
  created_at timestamptz default now()
);

create index idx_logs_contact on conversation_logs(contact_id);
create index idx_logs_lead on conversation_logs(lead_id);
create index idx_logs_logged_at on conversation_logs(logged_at desc);

-- ============ FOLLOW UPS ============

create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  lead_id uuid references leads(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  due_date date,
  due_time time,
  task_type text,
  owner text,
  priority priority_type default 'medium',
  status followup_status default 'open',
  latest_note text,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_fu_contact on follow_ups(contact_id);
create index idx_fu_due on follow_ups(due_date, status);
create index idx_fu_owner on follow_ups(owner, status);

-- ============ UPDATED_AT TRIGGER ============

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_contacts_updated before update on contacts
  for each row execute function set_updated_at();
create trigger trg_leads_updated before update on leads
  for each row execute function set_updated_at();
create trigger trg_followups_updated before update on follow_ups
  for each row execute function set_updated_at();

-- ============ RLS ============
-- staff (authenticated) can read/write; admin can delete (soft). service_role bypasses.

alter table contacts enable row level security;
alter table leads enable row level security;
alter table conversation_logs enable row level security;
alter table follow_ups enable row level security;

create policy "contacts_read" on contacts for select using (auth.role() = 'authenticated');
create policy "contacts_write" on contacts for insert with check (auth.role() = 'authenticated');
create policy "contacts_update" on contacts for update using (auth.role() = 'authenticated');
create policy "contacts_delete" on contacts for delete using (auth.jwt() ->> 'role' = 'admin');

create policy "leads_read" on leads for select using (auth.role() = 'authenticated');
create policy "leads_write" on leads for insert with check (auth.role() = 'authenticated');
create policy "leads_update" on leads for update using (auth.role() = 'authenticated');
create policy "leads_delete" on leads for delete using (auth.jwt() ->> 'role' = 'admin');

create policy "logs_read" on conversation_logs for select using (auth.role() = 'authenticated');
create policy "logs_write" on conversation_logs for insert with check (auth.role() = 'authenticated');
create policy "logs_update" on conversation_logs for update using (auth.role() = 'authenticated');
create policy "logs_delete" on conversation_logs for delete using (auth.jwt() ->> 'role' = 'admin');

create policy "fu_read" on follow_ups for select using (auth.role() = 'authenticated');
create policy "fu_write" on follow_ups for insert with check (auth.role() = 'authenticated');
create policy "fu_update" on follow_ups for update using (auth.role() = 'authenticated');
create policy "fu_delete" on follow_ups for delete using (auth.jwt() ->> 'role' = 'admin');

-- ============ SEED: lookup reference (stages) ============

create table if not exists stage_lookup (
  key lead_stage primary key,
  label_th text not null,
  color text not null
);

insert into stage_lookup (key, label_th, color) values
  ('new', 'ใหม่', '#64748B'),
  ('contacted', 'ติดต่อแล้ว', '#0369A1'),
  ('qualified', 'สนใจ', '#15803D'),
  ('site_visit', 'นัดดู', '#6D28D9'),
  ('proposal', 'เสนอราคา', '#B45309'),
  ('won', 'ปิดการขาย', '#166534'),
  ('unqualified', 'ไม่ผ่าน', '#64748B'),
  ('lost', 'หลุด', '#B91C1C'),
  ('duplicate', 'ซ้ำ', '#64748B'),
  ('no_answer', 'ไม่ตอบ', '#C2410C')
on conflict (key) do nothing;
