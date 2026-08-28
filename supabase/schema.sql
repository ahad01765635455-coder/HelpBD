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

-- Public users must not query raw donor PII directly.
-- Add narrowly-scoped RPC/API policies only after the Admin auth flow is enabled.
