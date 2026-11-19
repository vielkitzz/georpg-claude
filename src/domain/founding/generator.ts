import type { ArchetypeId } from '../ideology/archetypes'
import { between, createRng, pick, type Rng } from './rng'
import type { GovernmentForm, GovernmentSystem, Regime, StateForm } from './options'

/** Condições iniciais fixas da fundação. O ano vem do estado do mundo no servidor. */
export const INITIAL_POPULATION = 1_000_000

export interface GeneratedMinistry {
  office: string
  name: string
  approval: number
}

export interface GeneratedParty {
  name: string
  seats: number
  color: string
  inGovernment: boolean
}

export interface GeneratedChamber {
  name: string
  seats: number
  elected: boolean
  parties: GeneratedParty[]
}

export interface InitialConditions {
  population: number
  gdp: number
  gdpPerCapita: number
  /** Aprovação do governo, 0 a 100. */
  approval: number
  /** Inflação anual, em %. */
  inflation: number
  /** Desemprego, em %. */
  unemployment: number
  treasury: number
  ministries: GeneratedMinistry[]
  chambers: GeneratedChamber[]
}

export interface GeneratorInput {
  /** Mesma semente → mesmo resultado (ex.: chave do nome oficial + território). */
  seed: string
  governmentForm: GovernmentForm
  regime: Regime
  system: GovernmentSystem
  stateForm: StateForm
  /** Ideologia governante escolhida. */
  ideology: ArchetypeId
  /** Legitimidade inicial já calculada (0 a 100). */
  legitimacy: number
}

const OFFICES = [
  'Fazenda',
  'Guerra',
  'Marinha',
  'Justiça',
  'Relações Exteriores',
  'Interior',
  'Agricultura',
  'Comércio e Indústria',
  'Educação',
  'Obras Públicas',
] as const

const MINISTRY_COUNT: Record<GovernmentSystem, number> = {
  concentracao: 6,
  diretorial: 7,
  presidencialismo: 8,
  semipresidencialismo: 9,
  parlamentarismo: 10,
}

const FIRST_NAMES = [
  'Álvaro',
  'Heitor',
  'Otávio',
  'Celso',
  'Marta',
  'Dante',
  'Lúcia',
  'Inês',
  'Rui',
  'Helena',
  'Joaquim',
  'Beatriz',
  'Tomás',
  'Clara',
  'Ernesto',
  'Sílvia',
  'Mateus',
  'Aurora',
]
const LAST_NAMES = [
  'Mendonça',
  'Brandão',
  'Lacerda',
  'Vilar',
  'Esteves',
  'Villaça',
  'Ferraz',
  'Montenegro',
  'Sampaio',
  'Albuquerque',
  'Teixeira',
  'Valente',
  'Cardoso',
  'Pestana',
  'Queiroz',
  'Barros',
]

const PARTY_BY_IDEOLOGY: Record<ArchetypeId, { name: string; color: string }> = {
  liberal_classico: { name: 'Partido Liberal', color: '#F98B87' },
  conservador: { name: 'União Conservadora', color: '#7FB1E0' },
  social_democrata: { name: 'Aliança Trabalhista', color: '#E8C59A' },
  socialista_revolucionario: { name: 'Partido Socialista', color: '#EA444B' },
  nacionalista_autoritario: { name: 'Frente Nacional', color: '#8FA3B3' },
  absolutista: { name: 'Partido Monárquico', color: '#C9B8E8' },
  teocrata: { name: 'União Religiosa', color: '#D9D2B6' },
  republicano_progressista: { name: 'Partido Republicano', color: '#9FD3C7' },
  federalista: { name: 'Liga Federalista', color: '#F2B880' },
  modernizador: { name: 'Partido do Progresso', color: '#A8C5F0' },
  internacionalista: { name: 'Aliança Cosmopolita', color: '#B5D99C' },
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function uniqueName(rng: Rng, used: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`
    if (!used.has(name)) {
      used.add(name)
      return name
    }
  }
  const fallback = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)} ${used.size + 1}`
  used.add(fallback)
  return fallback
}

function generateMinistries(
  rng: Rng,
  system: GovernmentSystem,
  approval: number,
): GeneratedMinistry[] {
  const used = new Set<string>()
  return OFFICES.slice(0, MINISTRY_COUNT[system]).map((office) => ({
    office,
    name: uniqueName(rng, used),
    approval: clamp(approval + between(rng, -10, 10), 30, 85),
  }))
}

/** Reparte `total` cadeiras por pesos, sem sobras (maiores restos). */
function distributeSeats(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  const exact = weights.map((w) => (w / sum) * total)
  const seats = exact.map(Math.floor)
  let left = total - seats.reduce((a, b) => a + b, 0)
  const order = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index)
  for (const { index } of order) {
    if (left-- <= 0) break
    seats[index]++
  }
  return seats
}

function generateParties(rng: Rng, seats: number, ideology: ArchetypeId): GeneratedParty[] {
  const others = (Object.keys(PARTY_BY_IDEOLOGY) as ArchetypeId[]).filter((id) => id !== ideology)
  const chosen: ArchetypeId[] = [ideology]
  const extra = between(rng, 2, 4)
  while (chosen.length < extra + 1) {
    const candidate = pick(rng, others)
    if (!chosen.includes(candidate)) chosen.push(candidate)
  }
  // O partido da ideologia governante tem a maior bancada.
  const weights = chosen.map((_, i) => (i === 0 ? between(rng, 36, 46) : between(rng, 8, 30)))
  weights[0] = Math.max(weights[0], Math.max(...weights.slice(1)) + 1)
  const distributed = distributeSeats(seats, weights)

  const parties = chosen
    .map((id, i) => ({ ...PARTY_BY_IDEOLOGY[id], seats: distributed[i], inGovernment: i === 0 }))
    .sort((a, b) => b.seats - a.seats)

  // O governo é o maior partido; se não tem maioria, forma coalizão com os seguintes.
  const majority = Math.floor(seats / 2) + 1
  let held = 0
  for (const party of parties) {
    party.inGovernment = held < majority
    held += party.seats
  }
  return parties
}

function councilName(form: GovernmentForm, regime: Regime): string {
  if (regime === 'colonial') return 'Conselho Colonial'
  if (regime === 'totalitario') return 'Comitê Central'
  if (regime === 'absolutista' && form === 'monarquia') return 'Conselho do Reino'
  return 'Conselho de Estado'
}

function generateChambers(rng: Rng, input: GeneratorInput): GeneratedChamber[] {
  const { governmentForm, regime, system, stateForm, ideology } = input
  const elected = (name: string, seats: number): GeneratedChamber => ({
    name,
    seats,
    elected: true,
    parties: generateParties(rng, seats, ideology),
  })
  const appointed = (name: string, seats: number): GeneratedChamber => ({
    name,
    seats,
    elected: false,
    parties: [],
  })

  if (
    regime === 'absolutista' ||
    regime === 'totalitario' ||
    regime === 'colonial' ||
    system === 'concentracao'
  ) {
    return [appointed(councilName(governmentForm, regime), between(rng, 20, 40))]
  }
  if (governmentForm === 'teocracia') {
    const council = appointed('Conselho Religioso', between(rng, 12, 24))
    return regime === 'democratico' ? [elected('Assembleia Nacional', 100), council] : [council]
  }
  if (stateForm === 'federal') return [elected('Câmara dos Deputados', 100), elected('Senado', 36)]
  if (stateForm === 'confederado') return [elected('Dieta Confederal', 60)]
  if (governmentForm === 'monarquia') {
    return [elected('Câmara dos Comuns', 100), appointed('Câmara Alta', between(rng, 30, 50))]
  }
  return [elected('Câmara dos Deputados', 100)]
}

/**
 * Gera economia, indicadores, ministérios e câmaras de forma determinística:
 * a mesma entrada produz exatamente o mesmo resultado, no navegador e no servidor.
 */
export function generateInitialConditions(input: GeneratorInput): InitialConditions {
  const rng = createRng(input.seed)
  const gdpPerCapita = 240 + between(rng, 0, 120)
  const gdp = INITIAL_POPULATION * gdpPerCapita
  const approval = clamp(Math.round(50 + (input.legitimacy - 55) / 5) + between(rng, -3, 6), 30, 80)
  return {
    population: INITIAL_POPULATION,
    gdp,
    gdpPerCapita,
    approval,
    inflation: between(rng, 20, 60) / 10,
    unemployment: between(rng, 40, 100) / 10,
    treasury: Math.round(gdp * (between(rng, 5, 15) / 100)),
    ministries: generateMinistries(rng, input.system, approval),
    chambers: generateChambers(rng, input),
  }
}
