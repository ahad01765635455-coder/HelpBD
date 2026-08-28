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
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_name is null or btrim(p_name) = '' then
    raise exception 'Name is required';
  end if;

  if p_phone is null or p_phone !~ '^01[0-9]{9}$' then
    raise exception 'Invalid Bangladesh mobile number';
  end if;

  if p_birth_registration_no is null or p_birth_registration_no !~ '^[0-9]{17}$' then
    raise exception 'Birth Registration Number must be 17 digits';
  end if;

  if p_dob is null then
    raise exception 'Date of birth is required';
  end if;

  if p_blood_group is null or btrim(p_blood_group) = '' then
    raise exception 'Blood group is required';
  end if;

  if p_division is null or p_district is null or p_upazila is null or p_union_name is null then
    raise exception 'Complete location is required';
  end if;

  if exists (
    select 1
    from public.donor_applications da
    where da.phone = p_phone
      and da.status in ('pending', 'approved')
  ) then
    raise exception 'An active donor application already exists for this mobile number';
  end if;

  insert into public.donor_applications (
    name, phone, dob, birth_registration_no, blood_group,
    division, district, upazila, union_name
  )
  values (
    btrim(p_name), p_phone, p_dob, p_birth_registration_no, btrim(p_blood_group),
    btrim(p_division), btrim(p_district), btrim(p_upazila), btrim(p_union_name)
  )
  returning donor_applications.id into v_id;

  return v_id;
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
    da.id,
    da.name,
    da.phone,
    da.blood_group,
    da.division,
    da.district,
    da.upazila,
    da.union_name,
    case
      when da.union_name = p_union_name
       and da.upazila = p_upazila
       and da.district = p_district
       and da.division = p_division then 'same_union'
      when da.upazila = p_upazila
       and da.district = p_district
       and da.division = p_division then 'same_upazila'
      when da.district = p_district
       and da.division = p_division then 'same_district'
      when da.division = p_division then 'same_division'
    end
  from public.donor_applications da
  where da.status = 'approved'
    and da.blood_group = p_blood_group
    and da.division = p_division
  order by
    case
      when da.union_name = p_union_name
       and da.upazila = p_upazila
       and da.district = p_district then 0
      when da.upazila = p_upazila
       and da.district = p_district then 1
      when da.district = p_district then 2
      else 3
    end,
    da.created_at asc
  limit 200;
$$;

revoke all on function public.submit_donor_application(text,text,date,text,text,text,text,text,text) from public;
revoke all on function public.search_approved_donors(text,text,text,text,text) from public;
grant execute on function public.submit_donor_application(text,text,date,text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.search_approved_donors(text,text,text,text,text) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
