create or replace function public.admin_list_help_requests()
returns table(
  id uuid,
  service text,
  name text,
  phone text,
  division text,
  district text,
  upazila text,
  union_name text,
  details text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id,service,name,phone,division,district,upazila,union_name,details,status,created_at
  from public.help_requests
  where service in ('আর্থিক সহায়তা','খাদ্য ও প্রয়োজনীয় সামগ্রী','চিকিৎসা সহায়তা')
  order by created_at desc;
$$;

create or replace function public.admin_approve_help_request(
  p_id uuid,
  p_title text,
  p_image_url text default null,
  p_youtube_url text default null,
  p_amount numeric default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare r public.help_requests%rowtype; c_id uuid;
begin
  select * into r from public.help_requests where id=p_id for update;
  if r.id is null then raise exception 'Request not found'; end if;
  if r.service not in ('আর্থিক সহায়তা','খাদ্য ও প্রয়োজনীয় সামগ্রী','চিকিৎসা সহায়তা') then raise exception 'Service cannot be published'; end if;
  if r.status='approved' then raise exception 'Request already approved'; end if;

  insert into public.campaigns(request_id,service,title,name,phone,division,district,upazila,union_name,details,amount,image_url,youtube_url,status)
  values(r.id,r.service,coalesce(nullif(btrim(p_title),''),r.service||' - '||r.name),r.name,r.phone,r.division,r.district,r.upazila,r.union_name,r.details,p_amount,nullif(btrim(coalesce(p_image_url,'')),''),nullif(btrim(coalesce(p_youtube_url,'')),''),'approved')
  returning id into c_id;

  update public.help_requests set status='approved',updated_at=now() where id=r.id;
  return json_build_object('ok',true,'campaign_id',c_id,'request_id',r.id);
end;
$$;

create or replace function public.admin_delete_help_request(p_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.help_requests where id=p_id;
  return json_build_object('ok',true,'id',p_id);
end;
$$;

grant execute on function public.admin_list_help_requests() to service_role;
grant execute on function public.admin_approve_help_request(uuid,text,text,text,numeric) to service_role;
grant execute on function public.admin_delete_help_request(uuid) to service_role;

select pg_notify('pgrst','reload schema');
