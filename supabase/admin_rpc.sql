create or replace function public.admin_list_donors()
returns setof public.donor_applications
language sql
security definer
set search_path = public
as $$
  select d.*
  from public.donor_applications d
  order by d.created_at desc;
$$;

create or replace function public.admin_set_donor_verification(
  p_id uuid,
  p_status text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('verified','not_verified') then
    raise exception 'Invalid verification status';
  end if;

  update public.donor_applications d
  set verification_status = p_status,
      updated_at = now()
  where d.id = p_id;

  if not found then
    raise exception 'Donor not found';
  end if;

  return json_build_object('ok', true, 'id', p_id, 'verification_status', p_status);
end;
$$;

create or replace function public.admin_approve_donor(p_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_verification text;
begin
  select d.verification_status
    into v_verification
  from public.donor_applications d
  where d.id = p_id;

  if v_verification is null then
    raise exception 'Donor not found';
  end if;

  if v_verification <> 'verified' then
    raise exception 'Verify the donor before approval';
  end if;

  update public.donor_applications d
  set status = 'approved',
      updated_at = now()
  where d.id = p_id;

  return json_build_object('ok', true, 'id', p_id, 'status', 'approved');
end;
$$;

create or replace function public.admin_delete_donor(p_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.donor_applications d
  where d.id = p_id;

  if not found then
    raise exception 'Donor not found';
  end if;

  return json_build_object('ok', true, 'id', p_id);
end;
$$;

revoke all on function public.admin_list_donors() from public;
revoke all on function public.admin_set_donor_verification(uuid,text) from public;
revoke all on function public.admin_approve_donor(uuid) from public;
revoke all on function public.admin_delete_donor(uuid) from public;

grant execute on function public.admin_list_donors() to anon, authenticated;
grant execute on function public.admin_set_donor_verification(uuid,text) to anon, authenticated;
grant execute on function public.admin_approve_donor(uuid) to anon, authenticated;
grant execute on function public.admin_delete_donor(uuid) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
