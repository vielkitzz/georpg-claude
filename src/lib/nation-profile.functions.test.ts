import { getMyNationProfile, parseNationProfile } from './nation-profile.functions'

function service(rows: Record<string, unknown>[]) {
  const selections: { table: string; filters: [string, string][] }[] = []
  const database = {
    from(table: 'nations' | 'nation_modules') {
      return {
        select() {
          const filters: [string, string][] = []
          selections.push({ table, filters })
          const query = {
            eq(column: string, value: string) {
              filters.push([column, value])
              return query
            },
            async maybeSingle() {
              const found = rows.find(
                (row) => row.table === table && filters.every(([key, value]) => row[key] === value),
              )
              return { data: found ?? null, error: null }
            },
          }
          return query
        },
      }
    },
  }
  return { database, selections }
}

it('devolve null sem nação ativa e não consulta módulos de outras nações', async () => {
  const { database, selections } = service([
    { table: 'nations', owner_id: 'eu', status: 'archived', id: 'arquivada' },
    { table: 'nations', owner_id: 'outro', status: 'active', id: 'outra' },
  ])
  await expect(getMyNationProfile({ userId: 'eu' }, database)).resolves.toBeNull()
  expect(selections).toEqual([
    {
      table: 'nations',
      filters: [
        ['owner_id', 'eu'],
        ['status', 'active'],
      ],
    },
  ])
})

it('lê apenas a nação ativa e a política do proprietário autenticado e assina seus símbolos', async () => {
  const flag = `eu/${'a'.repeat(64)}.png`
  const wrongOwner = `outro/${'a'.repeat(64)}.png`
  const { database, selections } = service([
    { table: 'nations', owner_id: 'outro', status: 'active', id: 'outra' },
    {
      table: 'nations',
      owner_id: 'eu',
      status: 'active',
      id: 'minha',
      name: 'Minha nação',
      symbols: { flag, coatOfArms: wrongOwner },
    },
    { table: 'nation_modules', nation_id: 'outra', politics: { legitimacy: 99 } },
    {
      table: 'nation_modules',
      nation_id: 'minha',
      politics: { legitimacy: 55, regime: 'democratico' },
    },
  ])
  const sign = vi.fn(async () => 'https://storage.example/flag.png')
  await expect(getMyNationProfile({ userId: 'eu' }, database, sign)).resolves.toMatchObject({
    id: 'minha',
    politics: { legitimacy: 55 },
    symbols: { flag: 'https://storage.example/flag.png' },
  })
  expect(sign).toHaveBeenCalledExactlyOnceWith(flag)
  expect(selections[1]).toEqual({ table: 'nation_modules', filters: [['nation_id', 'minha']] })
})

it('normaliza campos inválidos sem gerar uma nota ou um perfil ideológico fictícios', () => {
  const profile = parseNationProfile(
    {
      symbols: {
        nationalColor: 'INVALID',
        ideologyAnswers: [1, 2],
        ideologyProfile: { outro: 54 },
      },
    },
    { system: 'inválido', headOfState: 5, legitimacy: 108, events: [{ title: 7 }] },
  )
  expect(profile.symbols).toMatchObject({
    nationalColor: null,
    ideologyAnswers: {},
    ideologyProfile: null,
  })
  expect(profile.politics).toMatchObject({
    system: null,
    headOfState: null,
    legitimacy: null,
    events: [],
  })
})
