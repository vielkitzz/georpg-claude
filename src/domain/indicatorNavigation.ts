import type { IndicatorKey } from './types'

export type MetricKey = IndicatorKey | 'population'

export const INDICATORS_PATH = '/indicadores'

export const METRIC_SLUGS: Record<MetricKey, string> = {
  gdp: 'pib',
  inflation: 'inflacao',
  unemployment: 'desemprego',
  legitimacy: 'legitimidade',
  approval: 'aprovacao',
  stability: 'estabilidade',
  population: 'populacao',
  hdi: 'idh',
}

export const INDICATOR_CATEGORIES: readonly {
  id: string
  label: string
  keys: readonly MetricKey[]
}[] = [
  { id: 'economia', label: 'Economia', keys: ['gdp'] },
  { id: 'precos', label: 'Preços', keys: ['inflation'] },
  { id: 'emprego', label: 'Emprego', keys: ['unemployment'] },
  { id: 'sociedade', label: 'Sociedade', keys: ['population', 'hdi'] },
  { id: 'instituicoes', label: 'Instituições', keys: ['approval', 'legitimacy', 'stability'] },
]

export const INDICATOR_LINKS = [
  { path: INDICATORS_PATH, label: 'Ficha' },
  { path: `${INDICATORS_PATH}/teia`, label: 'Teia' },
  ...INDICATOR_CATEGORIES.map(({ id, label }) => ({ path: `${INDICATORS_PATH}/${id}`, label })),
]
