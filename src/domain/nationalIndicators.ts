import { formatInteger, formatPercent } from './format'
import type { Nation } from './types'

export function nationalIndicators(nation: Nation) {
  const approval = nation.approvalHistory.at(-1)
  return [
    ...(nation.population === null
      ? []
      : [{ label: 'População', value: formatInteger(nation.population) }]),
    ...(approval === undefined
      ? []
      : [{ label: 'Aprovação do governo', value: formatPercent(approval) }]),
    ...(nation.legitimacy === null
      ? []
      : [{ label: 'Legitimidade', value: `${nation.legitimacy}/100` }]),
  ]
}
