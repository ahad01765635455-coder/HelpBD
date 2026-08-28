# HelpBD production database setup

HelpBD now includes a Supabase/Postgres schema and server-side donor API foundation.

## 1. Create a Supabase project
Create a project in Supabase, then open SQL Editor and run `supabase/schema.sql`.

## 2. Add Vercel environment variables
In the HelpBD Vercel project, add:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key must stay server-side and must never be placed in browser JavaScript.

## 3. API
- `POST /api/donors` creates a pending donor application.
- `GET /api/donors?blood_group=...&division=...&district=...&upazila=...&union_name=...` returns approved donor profiles ranked by locality.

## 4. Production requirements
Before public launch, add authenticated Admin routes, server-side approve/reject/delete operations, audit logging, rate limiting, and privacy controls. Birth Registration Numbers are sensitive and should not be exposed in public search responses.
