/**
 * Edge Function `discord-guild`: confere se o jogador está no servidor oficial
 * do Discord e, se não estiver, o adiciona com o token OAuth dele.
 *
 * Falha fechada: sem DISCORD_BOT_TOKEN ou DISCORD_GUILD_ID, o acesso é bloqueado.
 * O id do Discord vem da identidade verificada pelo Auth, nunca do cliente.
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { classifyJoin, classifyMember, pickDiscordProfile, type GuildStatus } from './logic.ts'

const DISCORD_API = 'https://discord.com/api/v10'
const TIMEOUT_MS = 8000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const reply = (status: GuildStatus, httpStatus = 200) =>
  new Response(JSON.stringify({ status }), {
    status: httpStatus,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const discord = (path: string, botToken: string, init: RequestInit = {}) =>
  fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (request.method !== 'POST') return reply('error', 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const botToken = Deno.env.get('DISCORD_BOT_TOKEN')
  const guildId = Deno.env.get('DISCORD_GUILD_ID')
  if (!supabaseUrl || !serviceKey) return reply('error', 500)

  const jwt = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!jwt) return reply('error', 401)

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const { data, error: authError } = await admin.auth.getUser(jwt)
  if (authError || !data.user) return reply('error', 401)

  const profile = pickDiscordProfile(data.user.identities)
  if (!profile) return reply('error', 403)

  // Falha fechada: sem configuração, ninguém passa.
  if (!botToken || !guildId) return reply('not_configured')

  try {
    const { data: row } = await admin
      .from('users')
      .select('banned')
      .eq('id', data.user.id)
      .maybeSingle()
    if (row?.banned) return reply('banned')

    const { error: upsertError } = await admin.from('users').upsert(
      {
        id: data.user.id,
        discord_id: profile.discordId,
        username: profile.username,
        global_name: profile.globalName,
        avatar_url: profile.avatarUrl,
      },
      { onConflict: 'id' },
    )
    if (upsertError) return reply('error', 500)

    const member = classifyMember(
      (await discord(`/guilds/${guildId}/members/${profile.discordId}`, botToken)).status,
    )
    if (member === 'member') return reply('ok')
    if (member === 'error') return reply('error', 502)

    let providerToken: unknown
    try {
      providerToken = (await request.json())?.provider_token
    } catch {
      providerToken = undefined
    }
    if (typeof providerToken !== 'string' || providerToken === '' || providerToken.length > 512) {
      return reply('not_in_guild')
    }

    const join = classifyJoin(
      (
        await discord(`/guilds/${guildId}/members/${profile.discordId}`, botToken, {
          method: 'PUT',
          body: JSON.stringify({ access_token: providerToken }),
        })
      ).status,
    )
    if (join === 'joined' || join === 'already_member') return reply('ok')
    return join === 'refused' ? reply('not_in_guild') : reply('error', 502)
  } catch {
    return reply('error', 502)
  }
})
