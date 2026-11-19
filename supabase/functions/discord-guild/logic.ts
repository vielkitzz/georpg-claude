/**
 * Lógica pura da função `discord-guild` (sem Deno, sem rede), para ser testada
 * pelo Vitest. O `index.ts` só cuida de HTTP, Discord e Supabase.
 */
export type GuildStatus = 'ok' | 'not_in_guild' | 'not_configured' | 'banned' | 'error'

export interface DiscordProfile {
  discordId: string
  username: string
  globalName: string | null
  avatarUrl: string | null
}

/** IDs do Discord (snowflakes) são numéricos, de 15 a 25 dígitos. */
export const isSnowflake = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{15,25}$/.test(value)

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null

/**
 * Extrai o perfil do Discord da identidade verificada pelo Auth. Os dados de
 * `identity_data` vêm do provedor, não dos metadados editáveis do usuário.
 */
export function pickDiscordProfile(identities: unknown): DiscordProfile | null {
  if (!Array.isArray(identities)) return null
  const identity = identities.find(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' &&
      item !== null &&
      (item as { provider?: unknown }).provider === 'discord',
  )
  if (!identity) return null
  const data = (identity.identity_data ?? {}) as Record<string, unknown>
  const discordId = [data.provider_id, data.sub, identity.id].find(isSnowflake)
  if (!discordId) return null
  const custom = (data.custom_claims ?? {}) as Record<string, unknown>
  const username =
    text(custom.global_name) ?? text(data.full_name) ?? text(data.name) ?? text(data.user_name)
  return {
    discordId,
    username: username ?? 'jogador',
    globalName: text(custom.global_name),
    avatarUrl: text(data.avatar_url),
  }
}

/** GET /guilds/{id}/members/{user}: 200 é membro, 404 não é, o resto é falha. */
export function classifyMember(status: number): 'member' | 'absent' | 'error' {
  if (status === 200) return 'member'
  if (status === 404) return 'absent'
  return 'error'
}

/** PUT /guilds/{id}/members/{user}: 201 entrou, 204 já estava, 4xx recusado. */
export function classifyJoin(status: number): 'joined' | 'already_member' | 'refused' | 'error' {
  if (status === 201) return 'joined'
  if (status === 204) return 'already_member'
  if (status === 429 || status >= 500) return 'error'
  if (status >= 400) return 'refused'
  return 'error'
}
