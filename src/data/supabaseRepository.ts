import { getSupabase } from '@/auth/supabase'
import type { GameRepository } from './repository'
import { buildIndicators } from '@/domain/nationIndicators'
import { currencyPrefix, deriveHdi, deriveStability } from '@/domain/nationView'
import { ARCHETYPES } from '@/domain/ideology'
import type { ArchetypeId, AxisScores } from '@/domain/ideology'
import type { IndicatorKey, Nation, TerritoryClaim } from '@/domain/types'

type RecordData = Record<string, unknown>
const obj = (v: unknown): RecordData => v && typeof v === 'object' && !Array.isArray(v) ? v as RecordData : {}
const str = (v: unknown, fallback = ''): string => typeof v === 'string' ? v : fallback
const num = (v: unknown): number => typeof v === 'number' && Number.isFinite(v) ? v : 0
const list = (v: unknown): RecordData[] => Array.isArray(v) ? v.map(obj) : []
const strings = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
const numbers = (v: unknown): number[] => Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number' && Number.isFinite(x)) : []
const optionalNum = (v: unknown): number | undefined => typeof v === 'number' && Number.isFinite(v) ? v : undefined
const KEYS: IndicatorKey[] = ['legitimacy', 'approval', 'stability', 'gdp', 'inflation', 'unemployment', 'hdi']
/** Lê `{ chave: valor }` guardado no banco, mantendo só as chaves dos indicadores. */
const byKey = <T>(v: unknown, read: (x: unknown) => T): Partial<Record<IndicatorKey, T>> =>
  Object.fromEntries(KEYS.map(key => [key, read(obj(v)[key])]).filter(([, value]) => value !== undefined))

function mapNation(row: RecordData, modules: RecordData, color: string): Nation {
  const politics = obj(modules.politics)
  const economy = obj(modules.economy)
  const society = obj(modules.society)
  const chamber = list(politics.chambers)[0] ?? {}
  const symbols = obj(row.symbols)
  const currency = { code: str(row.currency_code), name: str(row.currency_name), symbol: str(symbols.currencySymbol) || undefined }
  const legitimacy = num(politics.legitimacy)
  const approval = num(society.approval)
  const inflation = num(economy.inflation)
  const unemployment = num(economy.unemployment)
  const ideology = ARCHETYPES.some(a => a.id === politics.ideology) ? politics.ideology as ArchetypeId : undefined
  // Estabilidade e IDH ainda não vêm do servidor: sem valor guardado, derivam dos demais indicadores.
  const indicators = buildIndicators({
    currencyPrefix: currencyPrefix(currency),
    legitimacy, approval, inflation, unemployment, gdp: num(economy.gdp),
    stability: optionalNum(society.stability) ?? deriveStability({ legitimacy, approval, inflation, unemployment }),
    hdi: optionalNum(society.hdi) ?? deriveHdi(num(economy.gdpPerCapita)),
    history: byKey(society.history, numbers),
    deltas: byKey(society.deltas, optionalNum),
  })
  return {
    id: str(row.id), shortName: str(row.short_name), officialName: str(row.name),
    capital: str(row.capital), currency,
    nationalColor: color, motto: str(row.motto), territoryId: num(row.region_id),
    foundedYear: num(row.founded_year), population: num(economy.population),
    languages: strings(society.languages), religion: str(society.religion),
    symbols: { flag: str(symbols.flag) || undefined, coatOfArms: str(symbols.coatOfArms) || undefined },
    ideology, ideologyScores: politics.ideologyScores ? politics.ideologyScores as AxisScores : undefined,
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
    indicators, legitimacy,
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
    alerts: [],
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
