-- Preserva as nações existentes e reutiliza seus campos de moeda e identidade.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nation-symbols', 'nation-symbols', false, 262144, array['image/png']);

-- Leitores autenticados podem abrir imagens vinculadas a uma nação. A função
-- de fundação grava os objetos e seus caminhos com a credencial de serviço.
create policy nation_symbols_read_committed
on storage.objects for select to authenticated
using (
  bucket_id = 'nation-symbols'
  and exists (
    select 1 from public.nations n
    where n.symbols ->> 'flag' = objects.name
       or n.symbols ->> 'coatOfArms' = objects.name
  )
);

create function public.nation_founding_name_taken(p_short_name text, p_name_key text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.nations n
    where n.name_key = p_name_key
      or pg_catalog.btrim(pg_catalog.regexp_replace(
        pg_catalog.lower(pg_catalog.regexp_replace(normalize(n.short_name, NFD), U&'[\0300-\036f]', '', 'g')),
        '[[:space:]''’.-]+', ' ', 'g'
      )) = pg_catalog.btrim(pg_catalog.regexp_replace(
        pg_catalog.lower(pg_catalog.regexp_replace(normalize(p_short_name, NFD), U&'[\0300-\036f]', '', 'g')),
        '[[:space:]''’.-]+', ' ', 'g'
      ))
  );
$$;

revoke all on function public.nation_founding_name_taken(text,text) from public, anon, authenticated;
grant execute on function public.nation_founding_name_taken(text,text) to service_role;

-- Desativa a assinatura anterior, que aceitava fundações sem prévia e gravava
-- valores fixos para a moeda. As duas assinaturas têm argumentos distintos.
revoke all on function public.commit_nation_founding(uuid,text,text,text,text,text,integer,text,text,jsonb,jsonb,jsonb,text) from service_role;

create function public.commit_nation_founding(
  p_owner_id uuid, p_name text, p_name_key text, p_slug text,
  p_short_name text, p_capital text, p_region_id integer, p_regime text,
  p_currency_code text, p_currency_name text, p_motto text, p_anthem text,
  p_description text, p_history text, p_symbols jsonb, p_politics jsonb,
  p_economy jsonb, p_society jsonb, p_color text,
  p_world_tick integer, p_founded_year integer
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_world_tick integer;
begin
  if p_owner_id is null
    or (p_region_id between 1 and 50) is not true
    or (length(trim(p_name)) between 2 and 100) is not true
    or (length(trim(p_short_name)) between 2 and 40) is not true
    or (length(trim(p_capital)) between 2 and 60) is not true
    or (p_currency_code ~ '^[A-Z]{2,4}$') is not true
    or (length(trim(p_currency_name)) between 2 and 60) is not true
    or (p_color ~ '^#[0-9A-Fa-f]{6}$') is not true
    or jsonb_typeof(p_symbols) is distinct from 'object'
    or jsonb_typeof(p_politics) is distinct from 'object'
    or jsonb_typeof(p_economy) is distinct from 'object'
    or jsonb_typeof(p_society) is distinct from 'object'
    or p_founded_year is null
  then raise exception 'invalid founding data' using errcode = '22023'; end if;

  perform 1 from public.users
    where id = p_owner_id and banned = false and discord_id is not null
    for share;
  if not found then raise exception 'player is not eligible' using errcode = '42501'; end if;

  select tick_index into strict v_world_tick from public.world_state where id = 1 for share;
  if v_world_tick is distinct from p_world_tick
  then raise exception 'founding preview is stale' using errcode = '40001'; end if;

  -- Serializa a checagem de nomes curtos normalizados sem mudar registros antigos.
  perform pg_catalog.pg_advisory_xact_lock(1920, 2622);
  if public.nation_founding_name_taken(p_short_name, p_name_key)
  then raise exception 'nation name is already taken' using errcode = '23505', constraint = 'founding_name_taken'; end if;

  insert into public.nations (
    owner_id, name, name_key, slug, short_name, capital, region_id,
    regime, currency_code, currency_name, motto, anthem, description, history, symbols, founded_year
  ) values (
    p_owner_id, p_name, p_name_key, p_slug, p_short_name, p_capital, p_region_id,
    p_regime, p_currency_code, p_currency_name, p_motto, nullif(p_anthem, ''),
    p_description, p_history, jsonb_strip_nulls(jsonb_build_object(
      'flag', nullif(p_symbols ->> 'flag', ''),
      'coatOfArms', nullif(p_symbols ->> 'coatOfArms', ''),
      'emblem', nullif(p_symbols ->> 'emblem', '')
    )), p_founded_year
  ) returning id into v_id;

  insert into public.nation_modules (nation_id, politics, economy, society)
  values (v_id, p_politics, p_economy, p_society);

  insert into public.territory_claims (territory_id, nation_id, name, color)
  values (p_region_id, v_id, p_short_name, p_color);

  return v_id;
end;
$$;

revoke all on function public.commit_nation_founding(uuid,text,text,text,text,text,integer,text,text,text,text,text,text,text,jsonb,jsonb,jsonb,jsonb,text,integer,integer) from public, anon, authenticated;
grant execute on function public.commit_nation_founding(uuid,text,text,text,text,text,integer,text,text,text,text,text,text,text,jsonb,jsonb,jsonb,jsonb,text,integer,integer) to service_role;
