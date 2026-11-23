import { useEffect, useRef, useState } from 'react'

const HEIGHT = 170
const PAD = { top: 12, right: 12, bottom: 22, left: 44 }
const DEFAULT_WIDTH = 600

/** Linha simples da aprovação ao longo dos últimos ticks, desenhada na largura real. */
export function ApprovalChart({ values }: { values: number[] }) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(DEFAULT_WIDTH)

  useEffect(() => {
    const element = box.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (element.clientWidth > 0) setWidth(element.clientWidth)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const min = Math.floor(Math.min(...values) / 10) * 10
  const max = Math.max(min + 10, Math.ceil(Math.max(...values) / 10) * 10)
  const innerW = width - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (i / Math.max(values.length - 1, 1)) * innerW
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * innerH
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const ticks = [min, (min + max) / 2, max]
  const last = values.length - 1

  return (
    <div ref={box} className="w-full">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Aprovação nos últimos ${values.length} ticks: de ${values[0]}% a ${values[last]}%`}
        className="block"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--line)"
            />
            <text
              x={PAD.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              fontSize="12"
              fill="var(--muted)"
            >
              {tick}%
            </text>
          </g>
        ))}
        <polyline
          points={points}
          fill="none"
          stroke="var(--positive)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={x(last)} cy={y(values[last])} r="4.5" fill="var(--positive)" />
        <text x={PAD.left} y={HEIGHT - 4} fontSize="12" fill="var(--muted)">
          há {values.length - 1} ticks
        </text>
        <text
          x={width - PAD.right}
          y={HEIGHT - 4}
          textAnchor="end"
          fontSize="12"
          fill="var(--muted)"
        >
          agora
        </text>
      </svg>
    </div>
  )
}
