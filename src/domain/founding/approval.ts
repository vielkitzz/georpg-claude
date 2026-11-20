import { localSelectionLegitimacy, type LocalSelection } from './options.ts'

/** A penalidade é um ajuste negativo; eleições locais contribuem com +5 ou −5. */
export function calculateApproval(
  legitimacy: number,
  legitimacyPenalty: number,
  localSelection: LocalSelection,
): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(legitimacy + legitimacyPenalty + localSelectionLegitimacy(localSelection)),
    ),
  )
}
