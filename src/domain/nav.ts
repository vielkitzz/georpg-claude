export type NavId =
  | 'overview'
  | 'map'
  | 'history'
  | 'government'
  | 'economy'
  | 'society'
  | 'infrastructure'
  | 'military'
  | 'technology'
  | 'diplomacy'
  | 'press'

export interface NavItem {
  id: NavId
  label: string
  path: string
}

export const NAV_GROUPS = [
  {
    title: 'Nação',
    items: [
      { id: 'overview', label: 'Painel Geral', path: '/' },
      { id: 'map', label: 'Mapa Mundial', path: '/mapa' },
      { id: 'history', label: 'Histórico Nacional', path: '/historico' },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { id: 'government', label: 'Governo e Política', path: '/governo' },
      { id: 'economy', label: 'Economia', path: '/economia' },
      { id: 'society', label: 'População e Sociedade', path: '/sociedade' },
      { id: 'infrastructure', label: 'Infraestrutura', path: '/infraestrutura' },
    ],
  },
  {
    title: 'Estratégia',
    items: [
      { id: 'military', label: 'Forças Armadas', path: '/militar' },
      { id: 'technology', label: 'Tecnologia e Pesquisa', path: '/tecnologia' },
    ],
  },
  {
    title: 'Relações',
    items: [
      { id: 'diplomacy', label: 'Diplomacia', path: '/diplomacia' },
      { id: 'press', label: 'Imprensa', path: '/imprensa' },
    ],
  },
] as const satisfies readonly { title: string; items: readonly NavItem[] }[]

export const NAV_ITEMS = NAV_GROUPS.flatMap<NavItem>((group) => [...group.items])
