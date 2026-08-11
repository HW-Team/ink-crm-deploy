-- Ink Homes CRM — schema v3: calendar UX (idempotent)
-- follow_ups.location (สถานที่นัด + Google Maps) + confirmed (ยืนยันนัดแล้ว)

alter table follow_ups add column if not exists location text;
alter table follow_ups add column if not exists confirmed boolean not null default false;
