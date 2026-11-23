import {
  GOVERNMENT_FORMS,
  GOVERNMENT_SYSTEMS,
  LABELS,
  LOCAL_SELECTIONS,
  REGIMES,
  STATE_FORMS,
} from '../domain/founding/options.ts'
import { ARCHETYPES } from '../domain/ideology/archetypes.ts'
import { AXIS_IDS, type AxisScores } from '../domain/ideology/axes.ts'
import { QUESTIONS } from '../domain/ideology/questions.ts'
import { isAnswer } from '../domain/ideology/scoring.ts'
import type { NationEvent, NationProfile } from '../types/nation-profile.ts'

interface MatchQuery {
  eq(column: string, value: string): MatchQuery
  maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>
}

export interface ProfileReader {
  from(table: 'nations' | 'nation_modules'): { select(columns: string): MatchQuery }
}

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const integer = (value: unknown, min: number) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min ? value : null
const percentage = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null
const choice = <T extends string>(choices: readonly T[], value: unknown) =>
  choices.find((item) => item === value) ?? null

function leader(value: unknown) {
  const data = record(value)
  const title = text(data.title)
  const name = text(data.name)
  return title && name ? { title, name } : null
}

function parseScores(value: unknown): AxisScores | null {
  const scores = record(value)
  if (!AXIS_IDS.every((key) => percentage(scores[key]) !== null)) return null
  return Object.fromEntries(AXIS_IDS.map((key) => [key, scores[key]])) as AxisScores
}

function parseEvents(value: unknown): NationEvent[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((event) => {
    const data = record(event)
    const title = text(data.title)
    const type = text(data.type)
    const tickIndex = integer(data.tickIndex, 0)
    const year = integer(data.year, 1)
    return title && type && (tickIndex !== null || year !== null)
      ? [{ title, type, tickIndex, year }]
      : []
  })
}

export function parseNationProfile(value: unknown, moduleValue: unknown): NationProfile {
  const row = record(value)
  const symbols = record(row.symbols)
  const politics = record(moduleValue)
  const divisions = record(symbols.subdivisionNames)
  const answers = record(symbols.ideologyAnswers ?? politics.ideologyAnswers)
  const color = text(symbols.nationalColor)
  return {
    id: text(row.id),
    officialName: text(row.name),
    shortName: text(row.short_name),
    capital: text(row.capital),
    currency: { name: text(row.currency_name), code: text(row.currency_code) },
    territoryId: integer(row.region_id, 1),
    foundedYear: integer(row.founded_year, 1),
    motto: text(row.motto),
    anthem: text(row.anthem),
    description: text(row.description),
    history: text(row.history),
    symbols: {
      flag: text(symbols.flag),
      coatOfArms: text(symbols.coatOfArms),
      nationalColor: /^#[0-9a-f]{6}$/i.test(color) ? color : null,
      nationalSymbol: text(symbols.nationalSymbol) || text(symbols.emblem),
      subdivisionNames: {
        firstLevel: text(divisions.firstLevel) || text(politics.firstLevel),
        secondLevel: text(divisions.secondLevel) || text(politics.secondLevel),
      },
      localGovernorSelection:
        choice(LOCAL_SELECTIONS, symbols.localGovernorSelection) ??
        choice(LOCAL_SELECTIONS, politics.localSelection),
      ideologyAnswers: Object.fromEntries(
        QUESTIONS.flatMap(({ id }) => (isAnswer(answers[id]) ? [[id, answers[id]]] : [])),
      ),
      ideologyProfile: parseScores(symbols.ideologyProfile) ?? parseScores(politics.ideologyScores),
    },
    politics: {
      governmentForm: choice(GOVERNMENT_FORMS, politics.governmentForm),
      regime: choice(REGIMES, politics.regime) ?? choice(REGIMES, row.regime),
      system: choice(GOVERNMENT_SYSTEMS, politics.system),
      stateForm: choice(STATE_FORMS, politics.stateForm),
      leadershipBasis: choice(
        Object.keys(LABELS.leadershipBasis) as (keyof typeof LABELS.leadershipBasis)[],
        politics.leadershipBasis,
      ),
      headOfState: leader(politics.headOfState),
      headOfGovernment: leader(politics.headOfGovernment),
      ideology: ARCHETYPES.find((item) => item.id === politics.ideology)?.id ?? null,
      legitimacy: percentage(politics.legitimacy),
      coherencePenalty: percentage(politics.coherencePenalty),
      events: parseEvents(politics.events),
    },
  }
}

export async function getMyNationProfile(
  context: { userId: string },
  service: ProfileReader,
  signSymbol?: (path: string) => Promise<string | null>,
): Promise<NationProfile | null> {
  if (!context.userId) throw new Error('Sessão ausente')
  const { data: row, error } = await service
    .from('nations')
    .select(
      'id,name,short_name,capital,region_id,regime,currency_name,currency_code,motto,anthem,description,history,symbols,founded_year',
    )
    .eq('owner_id', context.userId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) throw error
  if (!row) return null
  const id = text(record(row).id)
  const { data: modules, error: moduleError } = await service
    .from('nation_modules')
    .select('politics')
    .eq('nation_id', id)
    .maybeSingle()
  if (moduleError) throw moduleError
  const profile = parseNationProfile(row, record(modules).politics)
  if (signSymbol) {
    const sign = (value: string) => {
      const [owner, file, extra] = value.split('/')
      if (
        extra !== undefined ||
        owner !== context.userId ||
        !/^[a-f0-9]{64}\.png$/.test(file ?? '')
      )
        return value
      return signSymbol(value).catch(() => null)
    }
    const [flag, coat] = await Promise.all([
      sign(profile.symbols.flag),
      sign(profile.symbols.coatOfArms),
    ])
    profile.symbols.flag = flag ?? ''
    profile.symbols.coatOfArms = coat ?? ''
  }
  return profile
}
