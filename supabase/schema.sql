create extension if not exists pgcrypto;

create table if not exists public.donor_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  dob date not null,
  birth_registration_no text not null,
  blood_group text not null,
  division text not null,
  district text not null,
  upazila text not null,
  union_name text not null,
  verification_status text not null default 'not_checked' check (verification_status in ('not_checked','verified','not_verified')),
  status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists donor_search_idx on public.donor_applications (blood_group, division, district, upazila, union_name, status);

create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  name text not null,
  phone text not null,
  division text,
  district text,
  upazila text,
  union_name text,
  details text,
  status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists help_requests_idx on public.help_requests (service, status, division, district, upazila, union_name);

alter table public.donor_applications enable row level security;
alter table public.help_requests enable row level security;

-- Public visitors may submit applications, but must not read raw records.
drop policy if exists "Public can submit donor applications" on public.donor_applications;
create policy "Public can submit donor applications"
on public.donor_applications
for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can submit help requests" on public.help_requests;
create policy "Public can submit help requests"
on public.help_requests
for insert
to anon, authenticated
with check (true);

-- Table privileges are required in addition to RLS policies.
grant usage on schema public to anon, authenticated;
grant insert on table public.donor_applications to anon, authenticated;
grant insert on table public.help_requests to anon, authenticated;
