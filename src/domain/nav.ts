export interface NavItem {
  id: string
  label: string
  /** Rota. Sem `path`, a seção ainda não existe e aparece como "em breve". */
  path?: string
  icon:
    | 'overview'
    | 'map'
    | 'government'
    | 'economy'
    | 'society'
    | 'diplomacy'
    | 'military'
    | 'press'
    | 'technology'
    | 'history'
}

/** As dez seções da Sidebar, sem numeração. */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'overview', label: 'Visão geral', path: '/', icon: 'overview' },
  { id: 'map', label: 'Mapa mundial', path: '/mapa', icon: 'map' },
  { id: 'government', label: 'Governo e política', path: '/governo', icon: 'government' },
  { id: 'economy', label: 'Economia', icon: 'economy' },
  { id: 'society', label: 'População e sociedade', icon: 'society' },
  { id: 'diplomacy', label: 'Diplomacia', icon: 'diplomacy' },
  { id: 'military', label: 'Forças armadas', icon: 'military' },
  { id: 'press', label: 'Imprensa', icon: 'press' },
  { id: 'technology', label: 'Tecnologia e pesquisa', icon: 'technology' },
  { id: 'history', label: 'Histórico nacional', icon: 'history' },
]
