create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.help_requests(id) on delete cascade,
  service text not null check (service in ('আর্থিক সহায়তা','খাদ্য ও প্রয়োজনীয় সামগ্রী','চিকিৎসা সহায়তা')),
  title text not null,
  name text not null,
  phone text not null,
  division text,
  district text,
  upazila text,
  union_name text,
  details text not null,
  amount numeric,
  image_url text,
  youtube_url text,
  status text not null default 'approved' check (status in ('approved','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_public_idx on public.campaigns(status, service, created_at desc);

alter table public.campaigns enable row level security;

create or replace function public.submit_help_request(
  p_service text,
  p_name text,
  p_phone text,
  p_division text,
  p_district text,
  p_upazila text,
  p_union_name text,
  p_details text,
  p_amount numeric default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_service not in ('আর্থিক সহায়তা','খাদ্য ও প্রয়োজনীয় সামগ্রী','চিকিৎসা সহায়তা') then
    raise exception 'Invalid service';
  end if;
  if p_name is null or btrim(p_name) = '' then raise exception 'Name is required'; end if;
  if p_phone !~ '^01[0-9]{9}$' then raise exception 'Invalid Bangladesh mobile number'; end if;
  if p_details is null or btrim(p_details) = '' then raise exception 'Details are required'; end if;

  insert into public.help_requests(service,name,phone,division,district,upazila,union_name,details)
  values (p_service,btrim(p_name),p_phone,p_division,p_district,p_upazila,p_union_name,btrim(p_details))
  returning id into new_id;

  return json_build_object('ok',true,'id',new_id,'status','pending');
end;
$$;

grant execute on function public.submit_help_request(text,text,text,text,text,text,text,text,numeric) to anon, authenticated;

create or replace function public.list_approved_campaigns()
returns table(
  id uuid,
  service text,
  title text,
  name text,
  division text,
  district text,
  upazila text,
  union_name text,
  details text,
  amount numeric,
  image_url text,
  youtube_url text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select c.id,c.service,c.title,c.name,c.division,c.district,c.upazila,c.union_name,c.details,c.amount,c.image_url,c.youtube_url,c.created_at
  from public.campaigns c
  where c.status='approved'
  order by c.created_at desc;
$$;

grant execute on function public.list_approved_campaigns() to anon, authenticated;

select pg_notify('pgrst','reload schema');
