import { createClient } from 'npm:@supabase/supabase-js@2'
import { pickDiscordProfile } from '../discord-guild/logic.ts'
import { validateNationName } from '../../../src/domain/founding/name.ts'
import {
  validateInstitutions, localSelectionLegitimacy,
} from '../../../src/domain/founding/options.ts'
import { generateInitialConditions } from '../../../src/domain/founding/generator.ts'
import { scoreQuiz, topThree } from '../../../src/domain/ideology/scoring.ts'
import type { Answers } from '../../../src/domain/ideology/scoring.ts'
import type { ArchetypeId } from '../../../src/domain/ideology/archetypes.ts'
import type { InstitutionsInput } from '../../../src/domain/founding/options.ts'
import type { Article } from '../../../src/domain/founding/name.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const respond = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

interface Payload {
  shortName: string
  article: Article
  territoryId: number
  capital: string
  motto?: string
  institutions: InstitutionsInput
  answers: Answers
  ideology: ArchetypeId
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (request.method !== 'POST') return respond(405, { error: 'Método inválido.' })
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const botToken = Deno.env.get('DISCORD_BOT_TOKEN')
  const guildId = Deno.env.get('DISCORD_GUILD_ID')
  if (!url || !key || !botToken || !guildId) return respond(503, { error: 'Fundação indisponível.' })

  const jwt = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) return respond(401, { error: 'Faça login para continuar.' })
  const admin = createClient(url, key, { auth: { persistSession: false } })
  const { data: auth, error: authError } = await admin.auth.getUser(jwt)
  if (authError || !auth.user) return respond(401, { error: 'Sessão inválida.' })
  const profile = pickDiscordProfile(auth.user.identities)
  if (!profile) return respond(403, { error: 'É necessário entrar com Discord.' })

  const { data: player, error: playerError } = await admin.from('users')
    .select('banned,discord_id').eq('id', auth.user.id).maybeSingle()
  if (playerError || !player || player.banned || player.discord_id !== profile.discordId)
    return respond(403, { error: 'Jogador não autorizado.' })

  // Recheck guild membership at the time of the sensitive operation.
  let member: Response
  try {
    member = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${profile.discordId}`, {
      headers: { Authorization: `Bot ${botToken}` },
      signal: AbortSignal.timeout(8000),
    })
  } catch { return respond(503, { error: 'Não foi possível verificar o servidor Discord.' }) }
  if (member.status !== 200) return respond(403, { error: 'Entre no servidor oficial do Discord.' })

  let payload: Payload
  try { payload = await request.json() } catch { return respond(400, { error: 'Dados inválidos.' }) }
  try {
    if (!payload || typeof payload !== 'object' || typeof payload.shortName !== 'string' ||
      !Number.isInteger(payload.territoryId) || payload.territoryId < 1 || payload.territoryId > 50 ||
      typeof payload.capital !== 'string' || payload.capital.trim().length < 2 ||
      payload.capital.trim().length > 60 || typeof payload.motto !== 'string' ||
      payload.motto.length > 200 || !payload.institutions || !payload.answers ||
      typeof payload.ideology !== 'string') return respond(400, { error: 'Preencha todos os campos corretamente.' })

    const name = validateNationName({
      shortName: payload.shortName, article: payload.article,
      governmentForm: payload.institutions.governmentForm,
      stateForm: payload.institutions.stateForm,
    }, new Set())
    if (name.error) return respond(400, { error: name.error })
    const errors = validateInstitutions(payload.institutions)
    if (errors.length) return respond(400, { error: errors[0] })
    const scores = scoreQuiz(payload.answers)
    if (!topThree(scores).some(match => match.archetype.id === payload.ideology))
      return respond(400, { error: 'A ideologia deve estar entre as três mais próximas.' })

    const legitimacy = Math.max(0, Math.min(100, 55 + localSelectionLegitimacy(payload.institutions.localSelection)))
    const initial = generateInitialConditions({
      seed: `${name.key}:${payload.territoryId}`,
      governmentForm: payload.institutions.governmentForm,
      regime: payload.institutions.regime,
      system: payload.institutions.system,
      stateForm: payload.institutions.stateForm,
      ideology: payload.ideology,
      legitimacy,
    })
    const { data: nationId, error } = await admin.rpc('commit_nation_founding', {
      p_owner_id: auth.user.id,
      p_name: name.officialName,
      p_name_key: name.key,
      p_slug: name.slug,
      p_short_name: payload.shortName.trim(),
      p_capital: payload.capital.trim(),
      p_region_id: payload.territoryId,
      p_regime: payload.institutions.regime,
      p_motto: payload.motto.trim(),
      p_politics: { ...payload.institutions, ideology: payload.ideology, legitimacy, ministries: initial.ministries, chambers: initial.chambers, ideologyScores: scores },
      p_economy: { population: initial.population, gdp: initial.gdp, gdpPerCapita: initial.gdpPerCapita, treasury: initial.treasury, inflation: initial.inflation, unemployment: initial.unemployment },
      p_society: { approval: initial.approval },
      p_color: '#EA444B',
    })
    if (error) {
      if (error.code === '23505') return respond(409, { error: 'Esse nome, território ou jogador já possui uma nação ativa.' })
      return respond(500, { error: 'Não foi possível fundar a nação. Tente novamente.' })
    }
    return respond(201, { nationId })
  } catch {
    return respond(400, { error: 'Dados da fundação inválidos.' })
  }
})
