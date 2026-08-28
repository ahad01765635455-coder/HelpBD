create or replace function public.submit_donor_application(
  p_name text,
  p_phone text,
  p_dob date,
  p_birth_registration_no text,
  p_blood_group text,
  p_division text,
  p_district text,
  p_upazila text,
  p_union_name text
)
returns table(id uuid, status text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_name is null or btrim(p_name) = '' then raise exception 'Name is required'; end if;
  if p_phone !~ '^01[0-9]{9}$' then raise exception 'Invalid Bangladesh mobile number'; end if;
  if p_birth_registration_no !~ '^[0-9]{17}$' then raise exception 'Birth Registration Number must be 17 digits'; end if;
  if p_dob is null then raise exception 'Date of birth is required'; end if;
  if p_blood_group is null or p_blood_group = '' then raise exception 'Blood group is required'; end if;
  if p_division is null or p_district is null or p_upazila is null or p_union_name is null then raise exception 'Complete location is required'; end if;

  if exists (
    select 1 from public.donor_applications
    where phone = p_phone and status in ('pending','approved')
  ) then
    raise exception 'An active donor application already exists for this mobile number';
  end if;

  return query
  insert into public.donor_applications (
    name, phone, dob, birth_registration_no, blood_group,
    division, district, upazila, union_name
  )
  values (
    btrim(p_name), p_phone, p_dob, p_birth_registration_no, p_blood_group,
    p_division, p_district, p_upazila, p_union_name
  )
  returning donor_applications.id, donor_applications.status, donor_applications.created_at;
end;
$$;

create or replace function public.search_approved_donors(
  p_blood_group text,
  p_division text,
  p_district text,
  p_upazila text,
  p_union_name text
)
returns table(
  id uuid,
  name text,
  phone text,
  blood_group text,
  division text,
  district text,
  upazila text,
  union_name text,
  match_level text
)
language sql
security definer
set search_path = public
as $$
  select
    d.id, d.name, d.phone, d.blood_group, d.division, d.district, d.upazila, d.union_name,
    case
      when d.union_name = p_union_name and d.upazila = p_upazila and d.district = p_district and d.division = p_division then 'same_union'
      when d.upazila = p_upazila and d.district = p_district and d.division = p_division then 'same_upazila'
      when d.district = p_district and d.division = p_division then 'same_district'
      when d.division = p_division then 'same_division'
    end as match_level
  from public.donor_applications d
  where d.status = 'approved'
    and d.blood_group = p_blood_group
    and d.division = p_division
  order by
    case
      when d.union_name = p_union_name and d.upazila = p_upazila and d.district = p_district then 0
      when d.upazila = p_upazila and d.district = p_district then 1
      when d.district = p_district then 2
      else 3
    end,
    d.created_at asc
  limit 200;
$$;

revoke all on function public.submit_donor_application(text,text,date,text,text,text,text,text,text) from public;
revoke all on function public.search_approved_donors(text,text,text,text,text) from public;
grant execute on function public.submit_donor_application(text,text,date,text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.search_approved_donors(text,text,text,text,text) to anon, authenticated;
