import { getSupabase } from '@/auth/supabase'
import { LABELS } from '@/domain/founding/options'
import type { Indicator, Nation, TerritoryClaim } from '@/domain/types'
import type { GameRepository } from './repository'

type RecordData = Record<string, unknown>
const obj = (value: unknown): RecordData =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as RecordData) : {}
const str = (value: unknown): string => (typeof value === 'string' ? value : '')
const num = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null
const list = (value: unknown): RecordData[] => (Array.isArray(value) ? value.map(obj) : [])
const label = (values: Record<string, string>, value: unknown) => {
  const key = str(value)
  return Object.hasOwn(values, key) ? values[key] : key
}

const indicators = [
  { key: 'gdp', label: 'PIB' },
  { key: 'gdpPerCapita', label: 'PIB per capita' },
  { key: 'inflation', label: 'Inflação', percentage: true },
  { key: 'unemployment', label: 'Desemprego', percentage: true },
  { key: 'treasury', label: 'Tesouro nacional' },
]

function mapNation(row: RecordData, modules: RecordData, color: string | null): Nation {
  const politics = obj(modules.politics)
  const economy = obj(modules.economy)
  const society = obj(modules.society)
  const approval = num(society.approval)
  const currency = { code: str(row.currency_code), name: str(row.currency_name) }
  const stateHead = obj(politics.headOfState)
  const governmentHead = obj(politics.headOfGovernment)

  return {
    id: str(row.id),
    shortName: str(row.short_name),
    officialName: str(row.name),
    capital: str(row.capital),
    currency,
    nationalColor: color,
    motto: str(row.motto),
    territoryId: row.region_id as number,
    foundedYear: row.founded_year as number,
    description: str(row.description),
    history: str(row.history),
    population: num(economy.population),
    government: {
      form: label(LABELS.governmentForm, politics.governmentForm),
      regime: label(LABELS.regime, politics.regime ?? row.regime),
      system: label(LABELS.system, politics.system),
      stateForm: label(LABELS.stateForm, politics.stateForm),
      firstLevelDivision: str(politics.firstLevel),
      secondLevelDivision: str(politics.secondLevel),
      localLeaders: label(LABELS.localSelection, politics.localSelection),
    },
    leadership: {
      stateHead: {
        title: str(stateHead.title),
        name: str(stateHead.name),
        basis: label(LABELS.leadershipBasis, politics.leadershipBasis),
      },
      ...(politics.headOfGovernment
        ? {
            governmentHead: {
              title: str(governmentHead.title),
              name: str(governmentHead.name),
            },
          }
        : {}),
    },
    indicators: indicators.flatMap<Indicator>(({ key, label, percentage }) => {
      const value = num(economy[key])
      if (value === null) return []
      const suffix = percentage ? '%' : currency.code ? ` ${currency.code}` : ''
      return [{ label, value: value.toLocaleString('pt-BR') + suffix }]
    }),
    legitimacy: num(politics.legitimacy),
    approvalHistory: approval === null ? [] : [approval],
    ministries: list(politics.ministries).map((m) => ({
      office: str(m.office),
      name: str(m.name),
      approval: num(m.approval),
    })),
    chambers: list(politics.chambers).map((chamber) => ({
      name: str(chamber.name),
      seats: num(chamber.seats),
      elected: typeof chamber.elected === 'boolean' ? chamber.elected : null,
      parties: list(chamber.parties).flatMap((party) => {
        const name = str(party.name)
        const seats = num(party.seats)
        if (!name || seats === null || seats < 0) return []
        return [{ name, seats, color: str(party.color), inGovernment: party.inGovernment === true }]
      }),
    })),
    news: [],
  }
}

function client() {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase não configurado')
  return supabase
}

export const supabaseRepository: GameRepository = {
  async getWorldState() {
    const { data, error } = await client()
      .from('world_state')
      .select('tick_index')
      .eq('id', 1)
      .single()
    if (error) throw error
    return { tickIndex: data.tick_index as number }
  },
  async getNation() {
    const supabase = client()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth.user) throw authError ?? new Error('Sessão ausente')
    const { data: nation, error } = await supabase
      .from('nations')
      .select(
        'id,short_name,name,capital,currency_code,currency_name,motto,region_id,founded_year,description,history,regime',
      )
      .eq('owner_id', auth.user.id)
      .eq('status', 'active')
      .maybeSingle()
    if (error) throw error
    if (!nation) return null
    const [{ data: modules, error: modulesError }, { data: claim, error: claimError }] =
      await Promise.all([
        supabase
          .from('nation_modules')
          .select('politics,economy,society')
          .eq('nation_id', nation.id)
          .maybeSingle(),
        supabase.from('territory_claims').select('color').eq('nation_id', nation.id).maybeSingle(),
      ])
    if (modulesError || claimError) throw modulesError ?? claimError
    return mapNation(nation, modules ?? {}, claim?.color ?? null)
  },
  async getTerritoryClaims(): Promise<TerritoryClaim[]> {
    const { data, error } = await client()
      .from('territory_claims')
      .select('territory_id,nation_id,name,color')
    if (error) throw error
    return (data ?? []).map((row) => ({
      territoryId: row.territory_id,
      nationId: row.nation_id,
      name: row.name,
      color: row.color,
    }))
  },
}
