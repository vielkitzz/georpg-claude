import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { pickDiscordProfile } from '../discord-guild/logic.ts'
import { getMyNationProfile, type ProfileReader } from '../../../src/lib/nation-profile.functions.ts'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'private, no-store',
}
const respond = (status: number, data: unknown) => Response.json(data, { status, headers })

async function requireSession(request: Request, service: SupabaseClient) {
  const token = request.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) return null
  const { data, error } = await service.auth.getUser(token)
  return error ? null : data.user
}

async function requireGuild(
  user: NonNullable<Awaited<ReturnType<typeof requireSession>>>,
  service: SupabaseClient,
  guildId: string,
  botToken: string,
) {
  const discord = pickDiscordProfile(user.identities)
  if (!discord) return false
  const { data, error } = await service
    .from('users')
    .select('banned,discord_id')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw error
  if (!data || data.banned !== false || data.discord_id !== discord.discordId) return false
  const member = await fetch(
    `https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(discord.discordId)}`,
    {
      headers: { Authorization: `Bot ${botToken}` },
      signal: AbortSignal.timeout(8000),
    },
  )
  if (member.status === 404) return false
  if (!member.ok) throw new Error('Verificação Discord indisponível')
  return (await member.json()).pending !== true
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (request.method !== 'GET') return respond(405, { error: 'Método inválido.' })
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const guild = Deno.env.get('DISCORD_GUILD_ID')
  const bot = Deno.env.get('DISCORD_BOT_TOKEN')
  if (!url || !key || !guild || !bot) return respond(503, { error: 'Perfil indisponível.' })
  const service = createClient(url, key, { auth: { persistSession: false } })
  try {
    const user = await requireSession(request, service)
    if (!user) return respond(401, { error: 'Sessão inválida.' })
    if (!(await requireGuild(user, service, guild, bot)))
      return respond(403, { error: 'Acesso negado.' })
    // O leitor só usa a interface fluente de leitura do PostgREST.
    const reader = service as unknown as ProfileReader
    const profile = await getMyNationProfile({ userId: user.id }, reader, async (path) => {
      const { data, error } = await service.storage
        .from('nation-symbols')
        .createSignedUrl(path, 300)
      return error ? null : data.signedUrl
    })
    return respond(200, profile)
  } catch {
    return respond(503, { error: 'Não foi possível carregar sua nação.' })
  }
})
