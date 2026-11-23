const navigation = [
  { id: 'nation', label: 'Nação', path: '/nacao' },
  { id: 'map', label: 'Mapa Mundial', path: '/mapa-mundial' },
  { id: 'indicators', label: 'Indicadores', path: '/indicadores' },
  {
    id: 'government',
    label: 'Governo',
    path: '/governo',
    children: [
      { id: 'executivo', label: 'Executivo' },
      { id: 'congresso', label: 'Congresso' },
      { id: 'partidos', label: 'Partidos' },
      { id: 'leis', label: 'Leis' },
      { id: 'orcamento', label: 'Orçamento' },
      { id: 'eleicoes', label: 'Eleições' },
      { id: 'administracao', label: 'Administração' },
    ],
  },
  {
    id: 'economy',
    label: 'Economia',
    path: '/economia',
    children: [
      { id: 'politica-economica', label: 'Política Econômica' },
      { id: 'tributacao', label: 'Tributação' },
      { id: 'banco-central', label: 'Banco Central' },
      { id: 'divida-publica', label: 'Dívida Pública' },
      { id: 'setores-produtivos', label: 'Setores Produtivos' },
      { id: 'comercio-exterior', label: 'Comércio Exterior' },
    ],
  },
  {
    id: 'society',
    label: 'Sociedade',
    path: '/sociedade',
    children: [
      { id: 'saude', label: 'Saúde' },
      { id: 'educacao', label: 'Educação' },
      { id: 'trabalho', label: 'Trabalho' },
      { id: 'previdencia', label: 'Previdência' },
      { id: 'habitacao', label: 'Habitação' },
      { id: 'seguranca-publica', label: 'Segurança Pública' },
      { id: 'meio-ambiente', label: 'Meio Ambiente' },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Infraestrutura',
    path: '/infraestrutura',
    children: [
      { id: 'transportes', label: 'Transportes' },
      { id: 'energia', label: 'Energia' },
      { id: 'saneamento', label: 'Saneamento' },
      { id: 'telecomunicacoes', label: 'Telecomunicações' },
      { id: 'obras', label: 'Obras' },
    ],
  },
  {
    id: 'diplomacy',
    label: 'Diplomacia',
    path: '/diplomacia',
    children: [
      { id: 'relacoes', label: 'Relações' },
      { id: 'tratados', label: 'Tratados' },
      { id: 'organizacoes', label: 'Organizações' },
      { id: 'embaixadas', label: 'Embaixadas' },
      { id: 'sancoes', label: 'Sanções' },
    ],
  },
  {
    id: 'defense',
    label: 'Defesa',
    path: '/defesa',
    children: [
      { id: 'forcas-armadas', label: 'Forças Armadas' },
      { id: 'organizacao', label: 'Organização' },
      { id: 'equipamentos', label: 'Equipamentos' },
      { id: 'operacoes', label: 'Operações' },
      { id: 'inteligencia', label: 'Inteligência' },
    ],
  },
  {
    id: 'history',
    label: 'Histórico',
    path: '/historico',
    children: [
      { id: 'acontecimentos', label: 'Acontecimentos' },
      { id: 'decisoes', label: 'Decisões' },
      { id: 'turnos', label: 'Turnos' },
      { id: 'relatorios', label: 'Relatórios' },
    ],
  },
] as const

type Navigation = (typeof navigation)[number]
export type NavId = Navigation['id']
export type NavChild = Extract<Navigation, { children: readonly unknown[] }>['children'][number]
export interface NavItem {
  id: NavId
  label: string
  path: string
  children?: readonly NavChild[]
}

export const NAV_ITEMS: readonly NavItem[] = navigation

export const LEGACY_ROUTES = {
  '/mapa': '/mapa-mundial',
  '/militar': '/defesa',
  '/tecnologia': '/infraestrutura',
  '/imprensa': '/historico/relatorios',
} as const
