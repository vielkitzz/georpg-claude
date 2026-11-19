import { Minus, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { geography } from '@/data/gauzoland'
import type { WorldGeography } from '@/data/gauzoland'
import { INITIAL_VIEWPORT, panBy, screenToMap, zoomAt, type Viewport } from '@/domain/map/viewport'
import type { TerritoryClaim } from '@/domain/types'

/** Cores do mapa (seção 6): o mapa mantém o fundo escuro nos dois temas. */
export const MAP_BACKGROUND = '#071C2A'
export const MAP_UNOWNED = '#132134'
const PROVINCE_LINE = 'rgba(254, 251, 238, 0.4)'
const SELECTION = '#EA444B'
const DRAG_THRESHOLD = 4

interface Props {
  claims: TerritoryClaim[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  world?: WorldGeography
}

export function WorldMap({ claims, selectedId, onSelect, world = geography }: Props) {
  const { width, height } = world.meta
  const size = useMemo(() => ({ width, height }), [width, height])
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEWPORT)
  const [renderScale, setRenderScale] = useState(0.6)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef({ moved: false, target: null as number | null, pinch: 0 })

  const claimByTerritory = useMemo(
    () => new Map(claims.map((claim) => [claim.territoryId, claim])),
    [claims],
  )
  const selected = world.states.find((state) => state.id === selectedId) ?? null
  const provinces = selected
    ? world.provinces.filter((province) => province.stateId === selected.id)
    : []

  // A roda do mouse precisa de listener não passivo para impedir a rolagem da página.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const point = screenToMap(svg.getBoundingClientRect(), event.clientX, event.clientY, size)
      const factor = event.deltaY < 0 ? 1.2 : 1 / 1.2
      setViewport((current) => zoomAt(current, factor, point.x, point.y, size))
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [size])

  // Pixels de tela por unidade do mapa, para manter rótulos legíveis em qualquer largura.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const { width: pixels } = svg.getBoundingClientRect()
      if (pixels > 0) setRenderScale(pixels / width)
    })
    observer.observe(svg)
    return () => observer.disconnect()
  }, [width])

  const pinchDistance = () => {
    const [a, b] = [...pointers.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const territory = (event.target as Element).closest('[data-territory]')
    if (pointers.current.size === 1) {
      gesture.current = {
        moved: false,
        target: territory ? Number(territory.getAttribute('data-territory')) : null,
        pinch: 0,
      }
    } else if (pointers.current.size === 2) {
      gesture.current = { moved: true, target: null, pinch: pinchDistance() }
    }
  }

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const previous = pointers.current.get(event.pointerId)
    const svg = svgRef.current
    if (!previous || !svg) return
    const current = { x: event.clientX, y: event.clientY }
    pointers.current.set(event.pointerId, current)
    const rect = svg.getBoundingClientRect()

    if (pointers.current.size === 2) {
      const distance = pinchDistance()
      const [a, b] = [...pointers.current.values()]
      const center = screenToMap(rect, (a.x + b.x) / 2, (a.y + b.y) / 2, size)
      if (gesture.current.pinch > 0) {
        const factor = distance / gesture.current.pinch
        setViewport((view) => zoomAt(view, factor, center.x, center.y, size))
      }
      gesture.current.pinch = distance
      return
    }

    const dx = current.x - previous.x
    const dy = current.y - previous.y
    if (!gesture.current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    if (!gesture.current.moved) {
      gesture.current.moved = true
      svg.setPointerCapture?.(event.pointerId)
    }
    const { scale } = screenToMap(rect, 0, 0, size)
    setViewport((view) => panBy(view, dx / scale, dy / scale, size))
  }

  const endPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const wasSingle = pointers.current.size === 1
    pointers.current.delete(event.pointerId)
    if (wasSingle && !gesture.current.moved && event.type === 'pointerup') {
      onSelect(gesture.current.target)
    }
    if (pointers.current.size === 0) gesture.current.pinch = 0
  }

  const zoomBy = (factor: number) =>
    setViewport((view) => zoomAt(view, factor, width / 2, height / 2, size))

  const labelSize = 12 / (viewport.k * renderScale)

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-line"
      style={{ background: MAP_BACKGROUND }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Mapa mundial de Gauzoland. Para navegar sem o mouse, use a lista de territórios."
        className="block h-auto w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <rect width={width} height={height} fill={MAP_BACKGROUND} />
        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.k})`}>
          {world.neutral && <path d={world.neutral} fill={MAP_UNOWNED} fillRule="evenodd" />}

          {world.states.map((state) => {
            const claim = claimByTerritory.get(state.id)
            return (
              <path
                key={state.id}
                data-territory={state.id}
                d={state.d}
                fill={claim?.color ?? MAP_UNOWNED}
                fillRule="evenodd"
                stroke={MAP_BACKGROUND}
                strokeWidth={1.5}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer transition-[filter] hover:brightness-125"
              />
            )
          })}

          {world.lakes.map((lake) => (
            <path
              key={lake.id}
              d={lake.d}
              fill={MAP_BACKGROUND}
              fillRule="evenodd"
              pointerEvents="none"
            />
          ))}

          {provinces.map((province) => (
            <path
              key={province.id}
              data-province={province.id}
              d={province.d}
              fill="none"
              stroke={PROVINCE_LINE}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          ))}

          {selected && (
            <path
              d={selected.d}
              fill="none"
              stroke={SELECTION}
              strokeWidth={2.5}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}

          {world.states.map((state) => {
            const claim = claimByTerritory.get(state.id)
            if (!claim || state.poleRadius * viewport.k * renderScale < 8) return null
            return (
              <text
                key={state.id}
                x={state.pole[0]}
                y={state.pole[1]}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={labelSize}
                fontWeight={600}
                fill="#FEFBEE"
                stroke={MAP_BACKGROUND}
                strokeWidth={3}
                strokeLinejoin="round"
                paintOrder="stroke"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
                data-label={state.id}
              >
                {claim.name}
              </text>
            )
          })}
        </g>
      </svg>

      <div className="absolute right-3 bottom-3 flex flex-col overflow-hidden rounded-md border border-line bg-panel">
        {[
          { label: 'Aproximar', icon: Plus, action: () => zoomBy(1.5) },
          { label: 'Afastar', icon: Minus, action: () => zoomBy(1 / 1.5) },
          {
            label: 'Restaurar enquadramento',
            icon: RotateCcw,
            action: () => setViewport(INITIAL_VIEWPORT),
          },
        ].map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            aria-label={label}
            title={label}
            className="grid size-10 place-items-center text-fg hover:bg-raised"
          >
            <Icon size={18} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  )
}
