import type { Nation, TerritoryClaim, WorldState } from '@/domain/types'

/** Dados de demonstração da Fase 0 (nação "Teste"). Nada daqui vem do servidor. */
export const DEMO_WORLD: WorldState = { tickIndex: 0 }

export const DEMO_NATION: Nation = {
  id: 'demo-teste',
  shortName: 'Teste',
  officialName: 'República do Teste',
  capital: 'Vila Nova',
  currency: { code: 'TST', name: 'Teste' },
  nationalColor: '#F98B87',
  motto: 'Ordem e trabalho',
  territoryId: 3,
  foundedYear: 1920,
  population: 1_000_000,
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
  indicators: [
    { label: 'População', value: '1.000.000', delta: 0.4 },
    { label: 'PIB', value: 'TST 310 mi', delta: 1.2 },
    { label: 'Aprovação', value: '58%', delta: -0.8 },
    { label: 'Inflação', value: '3,1%', delta: 0.3, lowerIsBetter: true },
    { label: 'Desemprego', value: '7,4%', delta: -0.2, lowerIsBetter: true },
  ],
  legitimacy: 62,
  approvalHistory: [54, 55, 57, 56, 59, 61, 60, 62, 59, 58, 59, 58],
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
