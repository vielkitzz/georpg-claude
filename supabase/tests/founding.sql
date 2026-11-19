-- Teste de integração para uma instância local. As alterações são revertidas.
begin;

do $$
declare
  v_owner uuid := '44e460ab-0ef5-40e2-a2c1-eadd4e496890';
  v_other uuid := '44e460ab-0ef5-40e2-a2c1-eadd4e496891';
  v_nation uuid;
  v_tick integer;
  v_symbol text := '44e460ab-0ef5-40e2-a2c1-eadd4e496890/flag.png';
begin
  select tick_index into strict v_tick from public.world_state where id = 1;

  insert into auth.users (id) values (v_owner), (v_other);
  update public.users set discord_id = id::text where id in (v_owner, v_other);

  if has_function_privilege('authenticated',
    'public.commit_nation_founding(uuid,text,text,text,text,text,integer,text,text,text,text,text,text,text,jsonb,jsonb,jsonb,jsonb,text,integer,integer)', 'EXECUTE')
    or has_function_privilege('anon', 'public.nation_founding_name_taken(text,text)', 'EXECUTE')
    or has_function_privilege('service_role',
      'public.commit_nation_founding(uuid,text,text,text,text,text,integer,text,text,jsonb,jsonb,jsonb,text)', 'EXECUTE')
  then raise exception 'Uma função de fundação tem permissão indevida'; end if;

  if not exists (
    select 1 from storage.buckets where id = 'nation-symbols' and not public and file_size_limit = 262144
      and allowed_mime_types = array['image/png']
  ) then raise exception 'O armazenamento de símbolos deve ser privado e limitado'; end if;

  set local role service_role;
  v_nation := public.commit_nation_founding(
    v_owner, 'República da Áurea', 'republica da aurea', 'republica-da-aurea',
    'Áurea', 'Porto Claro', 1, 'democratico', 'AUR', 'Áureo', 'Farol do sul',
    'Canto do mar', 'País insular', 'Fundado em Porto Claro',
    jsonb_build_object('flag', v_symbol, 'emblem', 'Ipê'),
    '{"legitimacy":52,"headOfState":{"title":"Cônsul","name":"Iara"}}', '{"population":1000000,"gdp":265000000}',
    '{"approval":57}', '#225588', v_tick, 1920);
  reset role;

  if not exists (
    select 1 from public.nations n
    join public.nation_modules m on m.nation_id = n.id
    join public.territory_claims c on c.nation_id = n.id
    where n.id = v_nation and n.currency_code = 'AUR' and n.currency_name = 'Áureo' and n.founded_year = 1920
      and n.symbols ->> 'flag' = v_symbol and n.symbols ->> 'emblem' = 'Ipê'
      and n.anthem = 'Canto do mar' and n.motto = 'Farol do sul'
      and n.description = 'País insular' and n.history = 'Fundado em Porto Claro'
      and c.territory_id = 1 and c.color = '#225588'
      and m.economy ->> 'gdp' = '265000000' and m.politics ->> 'legitimacy' = '52'
      and m.politics #>> '{headOfState,title}' = 'Cônsul' and m.society ->> 'approval' = '57'
  ) then raise exception 'A fundação não preservou os valores enviados pelo servidor'; end if;

  if not public.nation_founding_name_taken('aurea', 'reino de aurea')
  then raise exception 'O nome curto de uma nação existente deve ser reservado'; end if;

  insert into storage.objects (bucket_id, name)
  values ('nation-symbols', v_symbol), ('nation-symbols', v_symbol || '.draft');
  set local role authenticated;
  if (
    select count(*) from storage.objects
    where bucket_id = 'nation-symbols' and name in (v_symbol, v_symbol || '.draft')
  ) <> 1 then raise exception 'Leitura de símbolos precisa de vínculo com uma nação'; end if;
  reset role;
  set local role anon;
  if exists (select 1 from storage.objects where bucket_id = 'nation-symbols' and name = v_symbol)
  then raise exception 'Um leitor anônimo teve acesso ao símbolo'; end if;
  reset role;

  begin
    perform public.commit_nation_founding(
      v_other, 'Reino de Valdris', 'reino de valdris', 'reino-de-valdris',
      'Valdris', 'Nova Aurora', 2, 'absolutista', 'VL', 'Valdor', '', '', '', '',
      '{}', '{}', '{}', '{}', '#225588', v_tick + 1, 1920);
    raise exception 'Uma prévia com tick divergente foi aceita';
  exception when serialization_failure then null;
  end;

  -- Simula a concorrência pela posse: apenas o registro no mapa já existe.
  -- A colisão ocorre na última escrita, depois da nação e dos módulos.
  update public.nations set region_id = 2 where id = v_nation;
  begin
    perform public.commit_nation_founding(
      v_other, 'Reino de Valdris', 'reino de valdris', 'reino-de-valdris',
      'Valdris', 'Nova Aurora', 1, 'absolutista', 'VL', 'Valdor', '', '', '', '',
      '{}', '{}', '{}', '{}', '#225588', v_tick, 1920);
    raise exception 'Um território ocupado foi aceito';
  exception when unique_violation then null;
  end;
  if exists (select 1 from public.nations where owner_id = v_other)
  then raise exception 'A falha no mapa deixou uma nação parcialmente gravada'; end if;

  begin
    perform public.commit_nation_founding(
      v_owner, 'Reino de Valdris', 'reino de valdris', 'reino-de-valdris',
      'Valdris', 'Nova Aurora', 3, 'absolutista', 'VL', 'Valdor', '', '', '', '',
      '{}', '{}', '{}', '{}', '#225588', v_tick, 1920);
    raise exception 'O jogador fundou mais de uma nação ativa';
  exception when unique_violation then null;
  end;
end $$;

rollback;
