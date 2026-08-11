# Ink Homes CRM

Internal CRM for Ink (Ink Homes). One source of truth for **leads, contacts, conversations, and follow-ups** — used by the Ink team (web app) and the Ink agent (API).

## Stack

- **Backend:** Supabase (Postgres) — schema mirrors the legacy Google Sheet 1:1
- **Web app:** Next.js (deploy: Coolify)
- **Agent access:** REST API + dedicated service key (Hermes tool config for the Ink agent)

## Workstreams (Multica — 🏠 Ink Homes CRM)

| ID | Task |
|---|---|
| HWT-141 | Backend — Supabase schema + API |
| HWT-142 | Web app — Next.js CRM UI |
| HWT-143 | Agent-access API + Hermes tool config |
| HWT-144 | Migrate Google Sheet data → CRM (806 leads / 440 contacts / 778 follow-ups) |
| HWT-145 | Rewire FB + Payload webhooks → new CRM |

## Source of truth (legacy)

Google Sheet: [Ink Prefab CRM](https://docs.google.com/spreadsheets/d/1MiUkEkptq9hKL6wiq5Rh5YygM4uNqJuyHK1YsHNySkI) — read-only archive after cutover.

## Build report

https://astral-fable-wgng.here.now/
