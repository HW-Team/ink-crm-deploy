-- Ink Homes CRM — schema v4: call_logs (โทรออก + บันทึกผลอัตโนมัติ) (idempotent)

create table if not exists call_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  contact_id uuid references contacts(id),
  user_id uuid references users(id),
  owner text,
  phone text,
  called_at timestamptz not null default now(),
  duration_sec int,
  outcome text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_call_logs_lead on call_logs(lead_id, called_at desc);
create index if not exists idx_call_logs_user on call_logs(user_id, called_at desc);
