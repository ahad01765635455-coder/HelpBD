-- Emergency help requests need to be accepted by the shared RPC and returned to Admin.
alter table public.help_requests add column if not exists request_type text;
alter table public.help_requests add column if not exists urgency text;

drop function if exists public.submit_help_request(text,text,text,text,text,text,text,text,numeric);
create function public.submit_help_request(
  p_service text,
  p_name text,
  p_phone text,
  p_division text,
  p_district text,
  p_upazila text,
  p_union_name text,
  p_details text,
  p_amount numeric default null,
  p_type text default null,
  p_urgency text default null
)
returns json
language plpgsql security definer set search_path=public
as $$
declare new_id uuid;
begin
  if p_service not in ('আর্থিক সহায়তা','খাদ্য ও প্রয়োজনীয় সামগ্রী','চিকিৎসা সহায়তা','জরুরি সহায়তা') then
    raise exception 'Invalid service';
  end if;
  if p_name is null or btrim(p_name) = '' then raise exception 'Name is required'; end if;
  if p_phone !~ '^01[0-9]{9}$' then raise exception 'Invalid Bangladesh mobile number'; end if;
  if p_details is null or btrim(p_details) = '' then raise exception 'Details are required'; end if;
  insert into public.help_requests(service,name,phone,division,district,upazila,union_name,details,request_type,urgency)
  values (btrim(p_service),btrim(p_name),p_phone,nullif(btrim(p_division),''),nullif(btrim(p_district),''),nullif(btrim(p_upazila),''),nullif(btrim(p_union_name),''),btrim(p_details),nullif(btrim(p_type),''),nullif(btrim(p_urgency),''))
  returning id into new_id;
  return json_build_object('ok',true,'id',new_id,'status','pending');
end;
$$;
revoke all on function public.submit_help_request(text,text,text,text,text,text,text,text,numeric,text,text) from public;
grant execute on function public.submit_help_request(text,text,text,text,text,text,text,text,numeric,text,text) to anon, authenticated;

drop function if exists public.admin_list_help_requests();
create function public.admin_list_help_requests()
returns table(id uuid,service text,name text,phone text,division text,district text,upazila text,union_name text,details text,status text,created_at timestamptz,type text,urgency text)
language sql security definer set search_path=public
as $$
  select h.id,h.service,h.name,h.phone,h.division,h.district,h.upazila,h.union_name,h.details,h.status,h.created_at,h.request_type,h.urgency
  from public.help_requests h
  order by h.created_at desc;
$$;
grant execute on function public.admin_list_help_requests() to service_role;
select pg_notify('pgrst','reload schema');
