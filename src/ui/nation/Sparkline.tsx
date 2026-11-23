import { useId } from 'react'

const WIDTH = 100
const HEIGHT = 50
const PAD = 3
const FLAT_POINTS = 6

/** Linha dos últimos valores com área suave embaixo. Sem histórico, desenha uma linha reta. */
export function Sparkline({
  values,
  color,
  strokeWidth = 2,
  className = '',
}: {
  values: number[]
  color: string
  strokeWidth?: number
  className?: string
}) {
  const gradient = useId()
  const series = values.length >= 2 ? values : Array<number>(FLAT_POINTS).fill(values[0] ?? 0)
  const min = Math.min(...series)
  const max = Math.max(...series)
  const x = (i: number) => (i / (series.length - 1)) * WIDTH
  const y = (v: number) =>
    max === min ? HEIGHT / 2 : PAD + (1 - (v - min) / (max - min)) * (HEIGHT - PAD * 2)
  const line = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)} ${y(v).toFixed(2)}`)

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden
      className={className}
      overflow="visible"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.2" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line.join('')}L${WIDTH} ${HEIGHT}L0 ${HEIGHT}Z`} fill={`url(#${gradient})`} />
      <path
        d={line.join('')}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
