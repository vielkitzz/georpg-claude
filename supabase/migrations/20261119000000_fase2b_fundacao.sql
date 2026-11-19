-- Fase 2B: all founding writes run inside ONE PostgreSQL transaction.
-- Only the server-side service role can execute this RPC.
create or replace function public.commit_nation_founding(
  p_owner_id uuid, p_name text, p_name_key text, p_slug text,
  p_short_name text, p_capital text, p_region_id integer,
  p_regime text, p_motto text, p_politics jsonb, p_economy jsonb,
  p_society jsonb, p_color text
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare v_id uuid;
begin
  if p_owner_id is null or p_region_id not between 1 and 50
    or length(trim(p_name)) not between 2 and 100
    or length(trim(p_capital)) not between 2 and 60
    or p_color !~ '^#[0-9A-Fa-f]{6}$'
  then raise exception 'invalid founding data' using errcode = '22023'; end if;

  if not exists (
    select 1 from public.users
    where id = p_owner_id and banned = false and discord_id is not null
  ) then raise exception 'player is not eligible' using errcode = '42501'; end if;

  insert into public.nations (
    owner_id, name, name_key, slug, short_name, capital, region_id,
    regime, currency_code, currency_name, motto
  ) values (
    p_owner_id, p_name, p_name_key, p_slug, p_short_name, p_capital, p_region_id,
    p_regime, 'GEO', 'Moeda nacional', p_motto
  ) returning id into v_id;

  insert into public.nation_modules(nation_id, politics, economy, society)
  values (v_id, p_politics, p_economy, p_society);

  insert into public.territory_claims(territory_id, nation_id, name, color)
  values (p_region_id, v_id, p_short_name, p_color);

  return v_id;
end;
$$;
revoke all on function public.commit_nation_founding(uuid,text,text,text,text,text,integer,text,text,jsonb,jsonb,jsonb,text) from public, anon, authenticated;
grant execute on function public.commit_nation_founding(uuid,text,text,text,text,text,integer,text,text,jsonb,jsonb,jsonb,text) to service_role;
