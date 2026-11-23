import { formatDecimal, formatMagnitude } from '@/domain/nationView'
import type { Indicator, IndicatorKey } from '@/domain/types'

export interface IndicatorInputs {
  /** Prefixo da moeda no PIB (símbolo ou código). */
  currencyPrefix: string
  legitimacy: number
  approval: number
  stability: number
  gdp: number
  inflation: number
  unemployment: number
  hdi: number
  /** Valores anteriores por indicador, do mais antigo ao mais recente. */
  history?: Partial<Record<IndicatorKey, number[]>>
  /** Variação desde o último tick. Sem dado, fica em zero. */
  deltas?: Partial<Record<IndicatorKey, number>>
}

/** Os sete indicadores da visão geral, na ordem em que aparecem: três grandes e quatro menores. */
export function buildIndicators(input: IndicatorInputs): Indicator[] {
  const delta = (key: IndicatorKey) => input.deltas?.[key] ?? 0
  const history = (key: IndicatorKey, current: number) => {
    const past = input.history?.[key]
    return past && past.length >= 2 ? past : [current]
  }
  const points = (key: IndicatorKey) => formatDecimal(Math.abs(delta(key)), 1)

  return [
    {
      key: 'legitimacy',
      label: 'Legitimidade',
      caption: 'Política · índice',
      value: String(Math.round(input.legitimacy)),
      unit: '/ 100',
      delta: delta('legitimacy'),
      deltaText: points('legitimacy'),
      history: history('legitimacy', input.legitimacy),
      info: 'Aceitação do regime e das instituições entre a população, de 0 a 100.',
    },
    {
      key: 'approval',
      label: 'Aprovação',
      caption: 'Política · opinião',
      value: String(Math.round(input.approval)),
      unit: '%',
      delta: delta('approval'),
      deltaText: points('approval'),
      history: history('approval', input.approval),
      info: 'Parcela da população que aprova o governo.',
    },
    {
      key: 'stability',
      label: 'Estabilidade',
      caption: 'Política · risco de crise',
      value: String(Math.round(input.stability)),
      unit: '/ 100',
      delta: delta('stability'),
      deltaText: points('stability'),
      history: history('stability', input.stability),
      info: 'Quanto maior, menor o risco de uma crise política.',
    },
    {
      key: 'gdp',
      label: 'PIB',
      caption: 'Economia · valor + crescimento',
      value: `${input.currencyPrefix} ${formatMagnitude(input.gdp)}`,
      delta: delta('gdp'),
      deltaText: `${input.currencyPrefix} ${formatMagnitude(Math.abs(delta('gdp')))}`,
      history: history('gdp', input.gdp),
      info: 'Valor de tudo o que a economia produz e quanto mudou desde o último tick.',
    },
    {
      key: 'inflation',
      label: 'Inflação',
      caption: 'Economia · índice',
      value: formatDecimal(input.inflation, 1),
      unit: '%',
      delta: delta('inflation'),
      deltaText: points('inflation'),
      lowerIsBetter: true,
      history: history('inflation', input.inflation),
      info: 'Alta anual dos preços. Quanto menor, melhor.',
    },
    {
      key: 'unemployment',
      label: 'Desemprego',
      caption: 'Economia · índice',
      value: formatDecimal(input.unemployment, 1),
      unit: '%',
      delta: delta('unemployment'),
      deltaText: points('unemployment'),
      lowerIsBetter: true,
      history: history('unemployment', input.unemployment),
      info: 'Parcela da força de trabalho sem emprego. Quanto menor, melhor.',
    },
    {
      key: 'hdi',
      label: 'Índice de Desenvolvimento Humano (IDH)',
      caption: 'Social · índice',
      value: formatDecimal(input.hdi, 3),
      delta: delta('hdi'),
      deltaText: formatDecimal(Math.abs(delta('hdi')), 3),
      history: history('hdi', input.hdi),
      info: 'Saúde, educação e renda da população, de 0 a 1.',
    },
  ]
}
