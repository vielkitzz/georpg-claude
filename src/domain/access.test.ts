import { parseGuildStatus, playerFromIdentities, resolveAccess } from './access'

describe('resolveAccess', () => {
  it('sem configuração do Supabase, bloqueia (falha fechada)', () => {
    expect(resolveAccess('unconfigured', { status: 'ok' })).toBe('not_configured')
  })

  it('enquanto carrega a sessão, está verificando', () => {
    expect(resolveAccess('loading', { status: 'idle' })).toBe('checking')
  })

  it('sem sessão, manda para o login', () => {
    expect(resolveAccess('anon', { status: 'idle' })).toBe('login')
  })

  it('logado, mas ainda checando o servidor, está verificando', () => {
    expect(resolveAccess('signed', { status: 'idle' })).toBe('checking')
    expect(resolveAccess('signed', { status: 'checking' })).toBe('checking')
  })

  it('só libera com login E servidor confirmado', () => {
    expect(resolveAccess('signed', { status: 'ok' })).toBe('allowed')
    expect(resolveAccess('anon', { status: 'ok' })).toBe('login')
  })

  it('repassa cada motivo de bloqueio', () => {
    for (const status of ['not_in_guild', 'not_configured', 'banned', 'error'] as const) {
      expect(resolveAccess('signed', { status })).toBe(status)
    }
  })
})

describe('parseGuildStatus', () => {
  it('aceita só os status conhecidos', () => {
    expect(parseGuildStatus({ status: 'ok' })).toBe('ok')
    expect(parseGuildStatus({ status: 'not_in_guild' })).toBe('not_in_guild')
  })

  it('qualquer coisa estranha vira erro, nunca "ok"', () => {
    expect(parseGuildStatus(null)).toBe('error')
    expect(parseGuildStatus({})).toBe('error')
    expect(parseGuildStatus({ status: 'OK' })).toBe('error')
    expect(parseGuildStatus({ status: true })).toBe('error')
    expect(parseGuildStatus('ok')).toBe('error')
  })
})

describe('playerFromIdentities', () => {
  it('usa o nome global do Discord e o avatar', () => {
    const player = playerFromIdentities([
      {
        provider: 'discord',
        identity_data: {
          full_name: 'fulano#0',
          custom_claims: { global_name: 'Fulano' },
          avatar_url: 'https://x/a.png',
        },
      },
    ])
    expect(player).toEqual({ name: 'Fulano', avatarUrl: 'https://x/a.png' })
  })

  it('devolve null sem identidade do Discord', () => {
    expect(playerFromIdentities([{ provider: 'google' }])).toBeNull()
    expect(playerFromIdentities(undefined)).toBeNull()
  })
})
