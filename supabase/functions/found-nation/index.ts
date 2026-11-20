import { createClient } from 'npm:@supabase/supabase-js@2'
import { pickDiscordProfile } from '../discord-guild/logic.ts'
import { validateNationName } from '../../../src/domain/founding/name.ts'
import type { FoundingDraft } from '../../../src/domain/founding/draft.ts'
import { decodeSymbolImage, symbolPath } from './images.ts'
import {
  makePreviewToken,
  matchesPreview,
  prepareFounding,
  randomQuizForRole,
  setupError,
} from './logic.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const respond = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const MAX_BODY_BYTES = 800_000

async function readPayload(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) return null
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let payload = ''
  let size = 0
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return JSON.parse(payload + decoder.decode())
    size += value.byteLength
    if (size > MAX_BODY_BYTES) {
      await reader.cancel()
      return null
    }
    payload += decoder.decode(value, { stream: true })
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (request.method !== 'POST') return respond(405, { error: 'Método inválido.' })
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const botToken = Deno.env.get('DISCORD_BOT_TOKEN')
  const guildId = Deno.env.get('DISCORD_GUILD_ID')
  if (!url || !key || !botToken || !guildId)
    return respond(503, { error: 'Fundação indisponível.' })

  const jwt = request.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!jwt) return respond(401, { error: 'Faça login para continuar.' })
  const admin = createClient(url, key, { auth: { persistSession: false } })
  try {
    const { data: auth, error: authError } = await admin.auth.getUser(jwt)
    if (authError || !auth.user) return respond(401, { error: 'Sessão inválida.' })
    const profile = pickDiscordProfile(auth.user.identities)
    if (!profile) return respond(403, { error: 'É necessário entrar com Discord.' })
    const owner = auth.user.id
    const { data: player, error: playerError } = await admin
      .from('users')
      .select('banned,discord_id,role')
      .eq('id', owner)
      .maybeSingle()
    if (playerError) return respond(503, { error: 'Não foi possível verificar o jogador.' })
    if (!player || player.banned || player.discord_id !== profile.discordId)
      return respond(403, { error: 'Jogador não autorizado.' })

    const member = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${profile.discordId}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        signal: AbortSignal.timeout(8000),
      },
    ).catch(() => null)
    if (member?.status === 404)
      return respond(403, { error: 'Entre no servidor oficial do Discord.' })
    if (member?.status !== 200)
      return respond(503, { error: 'Não foi possível verificar o servidor Discord.' })
    if ((await member.json()).pending === true) {
      return respond(403, {
        error: 'Conclua a verificação de membro no servidor oficial do Discord.',
      })
    }

    const payload = await readPayload(request).catch(() => null)
    const action = payload?.action
    if (action === 'randomQuiz') {
      const answers = randomQuizForRole(player.role)
      return answers
        ? respond(200, { answers })
        : respond(403, { error: 'Apenas administradores podem sortear respostas.' })
    }
    if (action !== 'check' && action !== 'preview' && action !== 'confirm')
      return respond(400, { error: 'Operação de fundação inválida.' })

    const draft = payload.draft as FoundingDraft
    const validationError = setupError(draft)
    if (validationError) return respond(400, { error: validationError })
    const {
      shortName,
      article,
      territoryId,
      institutions: { governmentForm, stateForm },
    } = draft
    const name = validateNationName({ shortName, article, governmentForm, stateForm }, new Set())
    const [owned, claimed, named, region] = await Promise.all([
      admin.from('nations').select('id').eq('owner_id', owner).eq('status', 'active').maybeSingle(),
      admin
        .from('territory_claims')
        .select('territory_id')
        .eq('territory_id', territoryId)
        .maybeSingle(),
      admin.rpc('nation_founding_name_taken', {
        p_short_name: shortName.trim(),
        p_name_key: name.key,
      }),
      admin
        .from('nations')
        .select('id')
        .eq('region_id', territoryId)
        .eq('status', 'active')
        .maybeSingle(),
    ])
    if (owned.error || claimed.error || named.error || region.error)
      return respond(503, { error: 'Não foi possível verificar a disponibilidade da fundação.' })
    if (owned.data)
      return respond(409, { error: 'Sua conta já possui uma nação ativa.', code: 'owned' })
    if (claimed.data || region.data)
      return respond(409, { error: 'Esse território já foi ocupado.', code: 'territory' })
    if (named.data)
      return respond(409, { error: 'Já existe uma nação com esse nome.', code: 'name' })
    if (action === 'check') return respond(200, { available: true })

    const { data: world, error: worldError } = await admin
      .from('world_state')
      .select('tick_index')
      .eq('id', 1)
      .single()
    if (worldError) return respond(503, { error: 'Não foi possível consultar o estado do mundo.' })
    const prepared = prepareFounding(draft, world.tick_index)
    if ('error' in prepared) return respond(400, { error: prepared.error })
    const { fields, preview } = prepared
    const files = []
    for (const field of ['flag', 'coatOfArms'] as const) {
      const encoded = fields.p_symbols[field]
      if (!encoded) continue
      const bytes = await decodeSymbolImage(encoded)
      if (!bytes)
        return respond(400, {
          error:
            field === 'flag'
              ? 'O arquivo da bandeira não é um PNG válido.'
              : 'O arquivo do brasão não é um PNG válido.',
        })
      const path = await symbolPath(owner, bytes)
      files.push({ path, bytes })
      fields.p_symbols[field] = path
    }

    if (action === 'preview') {
      return respond(200, {
        preview: { ...preview, token: await makePreviewToken(key, owner, fields) },
      })
    }
    if (!(await matchesPreview(key, owner, fields, payload.token))) {
      return respond(409, {
        error: 'A prévia mudou. Atualize e confira os dados antes de confirmar.',
        code: 'preview',
      })
    }

    const uploads = await Promise.all(
      files.map(({ path, bytes }) =>
        admin.storage
          .from('nation-symbols')
          .upload(path, bytes, { contentType: 'image/png', upsert: true }),
      ),
    )
    if (uploads.some((upload) => upload.error))
      return respond(503, { error: 'Não foi possível guardar os símbolos. Tente novamente.' })

    const { data: nationId, error } = await admin.rpc('commit_nation_founding', {
      p_owner_id: owner,
      ...fields,
    })
    if (error?.code === '40001')
      return respond(409, {
        error: 'O mundo avançou. Atualize a prévia antes de confirmar.',
        code: 'preview',
      })
    if (error?.code === '42501') return respond(403, { error: 'Jogador não autorizado.' })
    if (error?.code === '23505') {
      if (error.message.includes('nations_one_active_per_owner')) {
        return respond(409, { error: 'Sua conta já possui uma nação ativa.', code: 'owned' })
      }
      if (/nations_one_active_per_region|territory_claims_pkey/.test(error.message)) {
        return respond(409, { error: 'Esse território já foi ocupado.', code: 'territory' })
      }
      return respond(409, { error: 'Já existe uma nação com esse nome.', code: 'name' })
    }
    if (error) return respond(500, { error: 'Não foi possível fundar a nação. Tente novamente.' })
    return respond(201, { nationId })
  } catch {
    return respond(503, { error: 'Não foi possível completar a fundação. Tente novamente.' })
  }
})
