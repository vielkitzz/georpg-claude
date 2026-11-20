import type { Indicator } from '@/domain/types'

export type Mood = 'good' | 'bad' | 'flat'

/** Se a variação melhorou (verde), piorou (amarelo) ou ficou estável. */
export function deltaMood({
  delta,
  lowerIsBetter,
}: Pick<Indicator, 'delta' | 'lowerIsBetter'>): Mood {
  if (delta === undefined || delta === 0) return 'flat'
  return delta > 0 !== Boolean(lowerIsBetter) ? 'good' : 'bad'
}
