import type { ArchetypeId, AxisScores } from '@/domain/ideology'

export interface WorldState {
  /** Quantos ticks já rodaram desde janeiro de 1920. */
  tickIndex: number
}

export type IndicatorKey =
  'legitimacy' | 'approval' | 'stability' | 'gdp' | 'inflation' | 'unemployment' | 'hdi'

export interface Indicator {
  key: IndicatorKey
  label: string
  /** Área e natureza do indicador, ex.: "Política · índice". */
  caption: string
  /** Texto já formatado para exibição. */
  value: string
  /** Unidade mostrada ao lado do valor, ex.: "/ 100" ou "%". */
  unit?: string
  /** Variação desde o último tick; sinal define a cor. */
  delta: number
  /** Variação já formatada, sem sinal (a seta mostra o sentido). */
  deltaText: string
  /** Quando true, valor menor é melhor (ex.: inflação). */
  lowerIsBetter?: boolean
  /** Últimos valores, do mais antigo ao mais recente (alimenta o gráfico). */
  history: number[]
  /** Explicação curta do indicador. */
  info: string
}

export interface Minister {
  office: string
  name: string
  approval: number
}

export interface Party {
  name: string
  seats: number
  color: string
  inGovernment: boolean
}

export interface NationAlert {
  id: string
  level: 'info' | 'warning'
  text: string
}

export interface NewsItem {
  id: string
  date: string
  headline: string
  summary: string
}

export interface Nation {
  id: string
  shortName: string
  officialName: string
  capital: string
  currency: { code: string; name: string; symbol?: string }
  nationalColor: string
  motto: string
  territoryId: number
  foundedYear: number
  /** Mês (1 a 12) e dia da fundação, quando conhecidos. */
  foundedMonth?: number
  foundedDay?: number
  population: number
  /** Posição da população entre as nações do mundo, quando conhecida. */
  populationRank?: number
  languages: string[]
  religion: string
  /** Bandeira e brasão: endereço da imagem ou data URI. */
  symbols: { flag?: string; coatOfArms?: string }
  /** Ideologia governante e as pontuações dos 12 eixos do questionário. */
  ideology?: ArchetypeId
  ideologyScores?: AxisScores
  government: {
    form: string
    regime: string
    system: string
    stateForm: string
    firstLevelDivision: string
    secondLevelDivision: string
    localLeaders: string
  }
  leadership: {
    stateHead: { title: string; name: string; basis: string }
    governmentHead?: { title: string; name: string }
  }
  indicators: Indicator[]
  legitimacy: number
  approvalHistory: number[]
  ministries: Minister[]
  chamber: { name: string; parties: Party[] }
  news: NewsItem[]
  /** Alertas que exigem atenção do jogador. */
  alerts: NationAlert[]
}

export interface TerritoryClaim {
  territoryId: number
  nationId: string
  name: string
  color: string
}
