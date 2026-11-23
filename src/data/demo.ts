import { buildIndicators } from '@/domain/nationIndicators'
import { currencyPrefix, deriveHdi } from '@/domain/nationView'
import type { Nation, TerritoryClaim, WorldState } from '@/domain/types'

/** Dados de demonstração da Fase 0 (nação "Teste"). Nada daqui vem do servidor. */
export const DEMO_WORLD: WorldState = { tickIndex: 0 }

/** Bandeira simples (duas faixas) para a demonstração, já como data URI. */
const DEMO_FLAG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 164 116"><rect width="164" height="58" fill="#FEFBEE"/><rect y="58" width="164" height="58" fill="#F98B87"/></svg>',
)}`

const DEMO_CURRENCY = { code: 'TST', name: 'Teste' }
const DEMO_APPROVAL_HISTORY = [54, 55, 57, 56, 59, 61, 60, 62, 59, 58, 59, 58]

export const DEMO_NATION: Nation = {
  id: 'demo-teste',
  shortName: 'Teste',
  officialName: 'República do Teste',
  capital: 'Vila Nova',
  currency: DEMO_CURRENCY,
  nationalColor: '#F98B87',
  motto: 'Ordem e trabalho',
  territoryId: 3,
  foundedYear: 1920,
  foundedMonth: 1,
  foundedDay: 1,
  population: 1_000_000,
  languages: ['Português'],
  religion: 'Estado laico',
  symbols: { flag: DEMO_FLAG },
  ideology: 'liberal_classico',
  government: {
    form: 'República',
    regime: 'Democrático',
    system: 'Presidencialismo',
    stateForm: 'Unitário',
    firstLevelDivision: 'Províncias',
    secondLevelDivision: 'Municípios',
    localLeaders: 'Eleitos',
  },
  leadership: {
    stateHead: { title: 'Presidente', name: 'Álvaro Mendonça', basis: 'Eleito diretamente' },
  },
  indicators: buildIndicators({
    currencyPrefix: currencyPrefix(DEMO_CURRENCY),
    legitimacy: 62,
    approval: 58,
    gdp: 310_000_000,
    inflation: 3.1,
    unemployment: 7.4,
    hdi: deriveHdi(310),
    deltas: {
      legitimacy: 0.5,
      approval: -0.8,
      stability: 0.3,
      gdp: 3_700_000,
      inflation: 0.3,
      unemployment: -0.2,
      hdi: 0.002,
    },
    history: {
      legitimacy: [58, 59, 59, 61, 61, 62],
      approval: [61, 60, 62, 60, 59, 58],
      stability: [64, 65, 64, 66, 66, 67],
      gdp: [296, 299, 302, 304, 306, 310].map((value) => value * 1_000_000),
      inflation: [2.6, 2.7, 2.9, 2.8, 2.8, 3.1],
      unemployment: [8, 7.9, 7.8, 7.7, 7.6, 7.4],
      hdi: [0.606, 0.607, 0.609, 0.61, 0.61, 0.612],
    },
  }),
  legitimacy: 62,
  approvalHistory: DEMO_APPROVAL_HISTORY,
  ministries: [
    { office: 'Fazenda', name: 'Heitor Brandão', approval: 61 },
    { office: 'Guerra', name: 'Gen. Otávio Lacerda', approval: 55 },
    { office: 'Marinha', name: 'Alm. Celso Vilar', approval: 52 },
    { office: 'Justiça e Interior', name: 'Marta Esteves', approval: 64 },
    { office: 'Relações Exteriores', name: 'Dante Villaça', approval: 58 },
    { office: 'Agricultura e Comércio', name: 'Lúcia Ferraz', approval: 66 },
  ],
  chamber: {
    name: 'Câmara dos Deputados',
    parties: [
      { name: 'Partido Liberal', seats: 41, color: '#F98B87', inGovernment: true },
      { name: 'União Conservadora', seats: 33, color: '#7FB1E0', inGovernment: false },
      { name: 'Aliança Trabalhista', seats: 19, color: '#E8C59A', inGovernment: true },
      { name: 'Independentes', seats: 7, color: '#8FA3B3', inGovernment: false },
    ],
  },
  news: [
    {
      id: 'n1',
      date: 'Janeiro de 1920',
      headline: 'República do Teste é proclamada',
      summary: 'O novo governo assume com maioria na Câmara e promete responsabilidade fiscal.',
    },
    {
      id: 'n2',
      date: 'Janeiro de 1920',
      headline: 'Fazenda apresenta primeiro orçamento',
      summary: 'A previsão é de superávit modesto, apoiado na exportação agrícola.',
    },
    {
      id: 'n3',
      date: 'Janeiro de 1920',
      headline: 'Oposição questiona o gasto militar',
      summary: 'A União Conservadora pede debate antes da votação do orçamento da Guerra.',
    },
  ],
  alerts: [],
}

export const DEMO_CLAIMS: TerritoryClaim[] = [
  {
    territoryId: DEMO_NATION.territoryId,
    nationId: DEMO_NATION.id,
    name: DEMO_NATION.shortName,
    color: DEMO_NATION.nationalColor,
  },
]

export interface DemoNotice {
  id: string
  level: 'info' | 'warning'
  text: string
}

export const DEMO_NOTICES: DemoNotice[] = [
  {
    id: 'demo',
    level: 'info',
    text: 'Você está vendo dados de demonstração da nação Teste.',
  },
  {
    id: 'budget',
    level: 'warning',
    text: 'O orçamento da Guerra ainda aguarda votação na Câmara.',
  },
]
