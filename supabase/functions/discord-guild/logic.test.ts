import { classifyJoin, classifyMember, isSnowflake, pickDiscordProfile } from './logic'

const ID = '123456789012345678'

describe('isSnowflake', () => {
  it('aceita ids numéricos longos e recusa o resto', () => {
    expect(isSnowflake(ID)).toBe(true)
    expect(isSnowflake('abc')).toBe(false)
    expect(isSnowflake('123')).toBe(false)
    expect(isSnowflake(1234)).toBe(false)
    expect(isSnowflake(undefined)).toBe(false)
  })
})

describe('pickDiscordProfile', () => {
  it('lê o id da identidade do Discord', () => {
    const profile = pickDiscordProfile([
      {
        provider: 'discord',
        id: 'uuid-qualquer',
        identity_data: { provider_id: ID, full_name: 'Fulano', avatar_url: 'https://cdn/a.png' },
      },
    ])
    expect(profile).toEqual({
      discordId: ID,
      username: 'Fulano',
      globalName: null,
      avatarUrl: 'https://cdn/a.png',
    })
  })

  it('ignora identidades de outros provedores', () => {
    expect(
      pickDiscordProfile([{ provider: 'google', identity_data: { provider_id: ID } }]),
    ).toBeNull()
  })

  it('não aceita id que não seja um snowflake', () => {
    expect(
      pickDiscordProfile([{ provider: 'discord', identity_data: { provider_id: '../../x' } }]),
    ).toBeNull()
  })

  it('devolve null sem identidades', () => {
    expect(pickDiscordProfile(undefined)).toBeNull()
    expect(pickDiscordProfile([])).toBeNull()
  })

  it('usa nome reserva quando o Discord não manda nenhum', () => {
    const profile = pickDiscordProfile([{ provider: 'discord', identity_data: { sub: ID } }])
    expect(profile?.username).toBe('jogador')
  })
})

describe('classifyMember', () => {
  it('200 é membro, 404 não é, o resto é erro', () => {
    expect(classifyMember(200)).toBe('member')
    expect(classifyMember(404)).toBe('absent')
    expect(classifyMember(401)).toBe('error')
    expect(classifyMember(500)).toBe('error')
  })
})

describe('classifyJoin', () => {
  it('distingue entrada, já membro, recusa e falha', () => {
    expect(classifyJoin(201)).toBe('joined')
    expect(classifyJoin(204)).toBe('already_member')
    expect(classifyJoin(403)).toBe('refused')
    expect(classifyJoin(400)).toBe('refused')
    expect(classifyJoin(429)).toBe('error')
    expect(classifyJoin(503)).toBe('error')
  })
})
