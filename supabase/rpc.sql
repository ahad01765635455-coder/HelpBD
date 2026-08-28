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

revoke all on function public.submit_donor_application(text,text,date,text,text,text,text,text,text) from public;
grant execute on function public.submit_donor_application(text,text,date,text,text,text,text,text,text) to anon, authenticated;
