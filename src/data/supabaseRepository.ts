import { getSupabase } from '@/auth/supabase'
import type { GameRepository } from './repository'
import type { Nation, TerritoryClaim } from '@/domain/types'

type RecordData = Record<string, unknown>
const obj = (v: unknown): RecordData => v && typeof v === 'object' && !Array.isArray(v) ? v as RecordData : {}
const str = (v: unknown, fallback = ''): string => typeof v === 'string' ? v : fallback
const num = (v: unknown): number => typeof v === 'number' && Number.isFinite(v) ? v : 0
const list = (v: unknown): RecordData[] => Array.isArray(v) ? v.map(obj) : []

function mapNation(row: RecordData, modules: RecordData, color: string): Nation {
  const politics = obj(modules.politics)
  const economy = obj(modules.economy)
  const society = obj(modules.society)
  const chamber = list(politics.chambers)[0] ?? {}
  const indicators = [
    { label: 'PIB', value: num(economy.gdp).toLocaleString('pt-BR'), delta: 0 },
    { label: 'PIB per capita', value: num(economy.gdpPerCapita).toLocaleString('pt-BR'), delta: 0 },
    { label: 'Inflação', value: num(economy.inflation).toLocaleString('pt-BR') + '%', delta: 0, lowerIsBetter: true },
    { label: 'Desemprego', value: num(economy.unemployment).toLocaleString('pt-BR') + '%', delta: 0, lowerIsBetter: true },
    { label: 'Tesouro', value: num(economy.treasury).toLocaleString('pt-BR'), delta: 0 },
  ]
  return {
    id: str(row.id), shortName: str(row.short_name), officialName: str(row.name),
    capital: str(row.capital), currency: { code: str(row.currency_code), name: str(row.currency_name) },
    nationalColor: color, motto: str(row.motto), territoryId: num(row.region_id),
    foundedYear: num(row.founded_year), population: num(economy.population),
    government: {
      form: str(politics.governmentForm), regime: str(politics.regime),
      system: str(politics.system), stateForm: str(politics.stateForm),
      firstLevelDivision: str(politics.firstLevel), secondLevelDivision: str(politics.secondLevel),
      localLeaders: str(politics.localSelection),
    },
    leadership: {
      stateHead: {
        title: str(obj(politics.headOfState).title),
        name: str(obj(politics.headOfState).name),
        basis: str(politics.leadershipBasis),
      },
      ...(politics.headOfGovernment ? { governmentHead: {
        title: str(obj(politics.headOfGovernment).title),
        name: str(obj(politics.headOfGovernment).name),
      } } : {}),
    },
    indicators, legitimacy: num(politics.legitimacy),
    approvalHistory: [num(society.approval)],
    ministries: list(politics.ministries).map(m => ({
      office: str(m.office), name: str(m.name), approval: num(m.approval),
    })),
    chamber: {
      name: str(chamber.name, 'Parlamento'),
      parties: list(chamber.parties).map(p => ({
        name: str(p.name), seats: num(p.seats), color: str(p.color),
        inGovernment: p.inGovernment === true,
      })),
    },
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
    const { data, error } = await client().from('world_state').select('tick_index').eq('id', 1).single()
    if (error) throw error
    return { tickIndex: data.tick_index as number }
  },
  async getNation() {
    const supabase = client()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth.user) throw authError ?? new Error('Sessão ausente')
    const { data: nation, error } = await supabase.from('nations').select('*')
      .eq('owner_id', auth.user.id).eq('status', 'active').maybeSingle()
    if (error) throw error
    if (!nation) return null
    const [{ data: modules, error: modulesError }, { data: claim, error: claimError }] = await Promise.all([
      supabase.from('nation_modules').select('politics,economy,society').eq('nation_id', nation.id).single(),
      supabase.from('territory_claims').select('color').eq('nation_id', nation.id).maybeSingle(),
    ])
    if (modulesError || claimError) throw modulesError ?? claimError
    return mapNation(nation, modules ?? {}, claim?.color ?? '#EA444B')
  },
  async getTerritoryClaims(): Promise<TerritoryClaim[]> {
    const { data, error } = await client().from('territory_claims').select('territory_id,nation_id,name,color')
    if (error) throw error
    return (data ?? []).map(row => ({
      territoryId: row.territory_id, nationId: row.nation_id, name: row.name, color: row.color,
    }))
  },
}
