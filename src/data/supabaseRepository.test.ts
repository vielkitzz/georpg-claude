import { supabaseRepository } from './supabaseRepository'

const { getUser, from } = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }))
vi.mock('@/auth/supabase', () => ({ getSupabase: () => ({ auth: { getUser }, from }) }))

const nationRow = {
  id: 'nacao-atual',
  name: 'Confederação do Vale',
  short_name: 'Vale',
  capital: 'Porto',
  currency_code: 'VAL',
  currency_name: 'Valdor',
  region_id: 12,
  founded_year: 1923,
  regime: 'democratico',
  history: 'Acordo entre províncias.',
  description: 'Nação costeira.',
}
const modules = {
  economy: { population: 1_000_000, gdp: 284_000_000, inflation: 0 },
  society: { approval: 54 },
  politics: {
    governmentForm: 'republica',
    system: 'parlamentarismo',
    legitimacy: 52,
    headOfState: { title: 'Cônsul', name: 'Lia de Prado' },
    headOfGovernment: { title: 'Chanceler', name: 'Ivo Leal' },
    chambers: [
      {
        name: 'Assembleia',
        seats: 50,
        elected: true,
        parties: [{ name: 'União', seats: 32, inGovernment: true }],
      },
      { name: 'Conselho', seats: 15, elected: false },
    ],
  },
}

function mockData(nation: unknown, data: unknown) {
  const rows: Record<string, unknown> = {
    nations: nation,
    nation_modules: data,
    territory_claims: null,
  }
  from.mockImplementation((table: string) => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: async () => ({ data: rows[table], error: null }),
    }
    return query
  })
}

beforeEach(() => {
  getUser.mockReset().mockResolvedValue({ data: { user: { id: 'dono' } }, error: null })
  from.mockReset()
})

it('carrega dados registrados, valores realmente zerados e todas as câmaras', async () => {
  mockData(nationRow, modules)
  const nation = await supabaseRepository.getNation()
  expect(nation).toMatchObject({
    officialName: 'Confederação do Vale',
    foundedYear: 1923,
    history: 'Acordo entre províncias.',
    population: 1_000_000,
    approvalHistory: [54],
    legitimacy: 52,
    nationalColor: null,
    government: { form: 'República', system: 'Parlamentarismo', regime: 'Democrático' },
    leadership: { governmentHead: { title: 'Chanceler', name: 'Ivo Leal' } },
    news: [],
  })
  expect(nation?.chambers).toHaveLength(2)
  expect(nation?.chambers[1]).toMatchObject({ name: 'Conselho', elected: false, seats: 15 })
  expect(nation?.indicators).toEqual([
    { label: 'PIB', value: '284.000.000 VAL' },
    { label: 'Inflação', value: '0%' },
  ])
})

it('preserva a ausência de módulos sem criar indicadores, notícias ou históricos', async () => {
  mockData(nationRow, null)
  const nation = await supabaseRepository.getNation()
  expect(nation).toMatchObject({
    population: null,
    legitimacy: null,
    approvalHistory: [],
    indicators: [],
    nationalColor: null,
    ministries: [],
    chambers: [],
    news: [],
  })
})

it('devolve ausência quando o jogador não possui uma nação ativa', async () => {
  mockData(null, null)
  await expect(supabaseRepository.getNation()).resolves.toBeNull()
  expect(from).toHaveBeenCalledTimes(1)
})
