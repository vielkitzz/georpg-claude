const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

export const formatInteger = (value: number) => integer.format(value)
export const formatCompact = (value: number) => compact.format(value)
export const formatPercent = (value: number) => `${integer.format(value)}%`

/** "+3,2" / "−1,0" (usa o sinal de menos tipográfico). */
export function formatDelta(value: number): string {
  const text = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
  if (value > 0) return `+${text}`
  if (value < 0) return `\u2212${text}`
  return text
}
