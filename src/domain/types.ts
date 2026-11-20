export interface WorldState {
  /** Quantos ticks já rodaram desde janeiro de 1920. */
  tickIndex: number
}

export interface Indicator {
  label: string
  /** Texto já formatado para exibição. */
  value: string
  /** Variação desde o último tick; sinal define a cor. */
  delta?: number
  /** Quando true, valor menor é melhor (ex.: inflação). */
  lowerIsBetter?: boolean
}

export interface Minister {
  office: string
  name: string
  approval: number | null
}

export interface Party {
  name: string
  seats: number
  color: string
  inGovernment: boolean
}

export interface NewsItem {
  id: string
  date: string
  headline: string
  summary: string
}

export interface Chamber {
  name: string
  seats: number | null
  elected: boolean | null
  parties: Party[]
}

export interface Nation {
  id: string
  shortName: string
  officialName: string
  capital: string
  currency: { code: string; name: string }
  nationalColor: string | null
  motto: string
  territoryId: number
  foundedYear: number
  description: string
  history: string
  population: number | null
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
  legitimacy: number | null
  approvalHistory: number[]
  ministries: Minister[]
  chambers: Chamber[]
  news: NewsItem[]
}

export interface TerritoryClaim {
  territoryId: number
  nationId: string
  name: string
  color: string
}
