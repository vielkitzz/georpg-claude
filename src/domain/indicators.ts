import type { Indicator } from '@/domain/types'

export type Mood = 'good' | 'bad' | 'flat'

/** Se a variação melhorou (verde), piorou (amarelo) ou ficou estável. */
export function deltaMood({
  delta,
  lowerIsBetter,
}: Pick<Indicator, 'delta' | 'lowerIsBetter'>): Mood {
  if (delta === 0) return 'flat'
  return delta > 0 !== Boolean(lowerIsBetter) ? 'good' : 'bad'
}

/**
 * Cor do cartão da visão geral. Sem variação conta como bom: nada piorou, e é assim
 * que o desenho mostra um indicador parado (seta para cima, em verde).
 */
export function cardMood(indicator: Pick<Indicator, 'delta' | 'lowerIsBetter'>): 'good' | 'bad' {
  return deltaMood(indicator) === 'bad' ? 'bad' : 'good'
}
