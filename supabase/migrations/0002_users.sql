-- Ink Homes CRM — schema v2: multi-user foundation (HWT-141 extension)
-- users table + owner_id FKs (leads/follow_ups) + agent user

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  role text not null default 'sales' check (role in ('sales','manager','agent')),
  password_hash text,               -- NULL for agent (API key auth) / future Google-only users
  google_id text unique,
  avatar_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_users_email on users(email);

-- owner_id on leads (keep legacy text owner for display/backfill)
alter table leads add column if not exists owner_id uuid references users(id) on delete set null;
create index if not exists idx_leads_owner_id on leads(owner_id);

-- owner_id on follow_ups
alter table follow_ups add column if not exists owner_id uuid references users(id) on delete set null;
create index if not exists idx_fu_owner_id on follow_ups(owner_id);

-- conversation logs: attributor user
alter table conversation_logs add column if not exists user_id uuid references users(id) on delete set null;
create index if not exists idx_logs_user on conversation_logs(user_id);
