/**
 * Regras de acesso (guarda 1): login no Discord + presença no servidor oficial.
 * Funções puras: o que a tela mostra depende só destes estados.
 */
export type AuthStatus = 'unconfigured' | 'loading' | 'anon' | 'signed'

export type GuildStatus = 'ok' | 'not_in_guild' | 'not_configured' | 'banned' | 'error'

export type GuildCheck = { status: 'idle' } | { status: 'checking' } | { status: GuildStatus }

export type AccessDecision =
  'checking' | 'login' | 'allowed' | 'not_in_guild' | 'not_configured' | 'banned' | 'error'

const GUILD_STATUSES: readonly GuildStatus[] = [
  'ok',
  'not_in_guild',
  'not_configured',
  'banned',
  'error',
]

/** Falha fechada: qualquer resposta que não seja um status conhecido vira "error". */
export function parseGuildStatus(payload: unknown): GuildStatus {
  const status = (payload as { status?: unknown } | null)?.status
  return GUILD_STATUSES.find((known) => known === status) ?? 'error'
}

export function resolveAccess(auth: AuthStatus, guild: GuildCheck): AccessDecision {
  if (auth === 'unconfigured') return 'not_configured'
  if (auth === 'loading') return 'checking'
  if (auth === 'anon') return 'login'
  if (guild.status === 'idle' || guild.status === 'checking') return 'checking'
  return guild.status === 'ok' ? 'allowed' : guild.status
}

export interface Player {
  name: string
  avatarUrl: string | null
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null

/** Jogador exibido na Topbar, a partir da identidade do Discord (dados do provedor). */
export function playerFromIdentities(identities: unknown): Player | null {
  if (!Array.isArray(identities)) return null
  const identity = identities.find((item) => item?.provider === 'discord')
  if (!identity) return null
  const data = (identity.identity_data ?? {}) as Record<string, unknown>
  const custom = (data.custom_claims ?? {}) as Record<string, unknown>
  return {
    name:
      text(custom.global_name) ??
      text(data.full_name) ??
      text(data.name) ??
      text(data.user_name) ??
      'Jogador',
    avatarUrl: text(data.avatar_url),
  }
}
