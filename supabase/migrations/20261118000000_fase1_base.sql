-- GeoRPG, Fase 1: perfis, nações, módulos, estado do mundo e posses de território.
-- Clientes só LEEM (RLS + GRANT mínimo). Toda escrita passa por Edge Functions
-- com a chave de serviço.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.user_role as enum ('ADMIN', 'PLAYER');

-- Perfil do jogador. discord_id só é preenchido pela Edge Function, a partir da
-- identidade verificada do Auth (nunca de metadados editáveis pelo cliente).
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  discord_id text unique,
  username text not null,
  global_name text,
  avatar_url text,
  role public.user_role not null default 'PLAYER',
  banned boolean not null default false,
  banned_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete restrict,
  name text not null unique,
  name_key text not null unique,
  slug text not null unique,
  short_name text not null,
  capital text not null,
  region_id integer not null,
  regime text not null,
  currency_code text not null check (currency_code ~ '^[A-Z]{2,4}$'),
  currency_name text not null,
  motto text,
  anthem text,
  description text,
  history text,
  symbols jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'archived')),
  founded_year integer not null default 1920,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Uma nação por jogador e um território por nação (ativa): a corrida entre dois
-- pedidos simultâneos falha no banco, não só na aplicação.
create unique index nations_one_active_per_owner on public.nations (owner_id) where status = 'active';
create unique index nations_one_active_per_region on public.nations (region_id) where status = 'active';
create index nations_owner_id_idx on public.nations (owner_id);

create table public.nation_modules (
  nation_id uuid primary key references public.nations (id) on delete cascade,
  politics jsonb not null default '{}'::jsonb,
  economy jsonb not null default '{}'::jsonb,
  society jsonb not null default '{}'::jsonb,
  military jsonb not null default '{}'::jsonb,
  technology jsonb not null default '{}'::jsonb,
  press jsonb not null default '{}'::jsonb,
  diplomacy jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.world_state (
  id smallint primary key default 1 check (id = 1),
  tick_index integer not null default 0 check (tick_index >= 0),
  last_tick_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.world_state (id, tick_index) values (1, 0);

-- O mapa é só geografia: dono, nome e cor vêm daqui.
create table public.territory_claims (
  territory_id integer primary key,
  nation_id uuid not null unique references public.nations (id) on delete cascade,
  name text not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now()
);

-- Gatilhos ---------------------------------------------------------------

create function private.touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch before update on public.users
  for each row execute function private.touch_updated_at();
create trigger nations_touch before update on public.nations
  for each row execute function private.touch_updated_at();
create trigger nation_modules_touch before update on public.nation_modules
  for each row execute function private.touch_updated_at();
create trigger world_state_touch before update on public.world_state
  for each row execute function private.touch_updated_at();

-- Cria o perfil quando alguém entra pelo Auth. O nome é só cosmético; o
-- discord_id é gravado depois, pela Edge Function, a partir da identidade.
create function private.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, username)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      'jogador'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.touch_updated_at() from public, anon, authenticated;

-- RLS e permissões --------------------------------------------------------

alter table public.users enable row level security;
alter table public.nations enable row level security;
alter table public.nation_modules enable row level security;
alter table public.world_state enable row level security;
alter table public.territory_claims enable row level security;

-- Tabelas novas no Supabase já nascem com GRANT amplo: zera e concede o mínimo.
revoke all on public.users, public.nations, public.nation_modules,
  public.world_state, public.territory_claims from anon, authenticated;

grant select on public.users to authenticated;
grant select on public.nation_modules to authenticated;
grant select on public.nations, public.world_state, public.territory_claims
  to anon, authenticated;

create policy users_select_own on public.users
  for select to authenticated
  using ((select auth.uid()) = id);

create policy nation_modules_select_own on public.nation_modules
  for select to authenticated
  using (
    exists (
      select 1 from public.nations n
      where n.id = nation_modules.nation_id and n.owner_id = (select auth.uid())
    )
  );

create policy nations_select_public on public.nations
  for select to anon, authenticated using (true);
create policy world_state_select_public on public.world_state
  for select to anon, authenticated using (true);
create policy territory_claims_select_public on public.territory_claims
  for select to anon, authenticated using (true);
