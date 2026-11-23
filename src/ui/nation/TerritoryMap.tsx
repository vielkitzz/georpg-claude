import { memo, useMemo } from 'react'
import { geography, type WorldGeography } from '@/data/gauzoland'
import { fitViewBox, pathBounds } from '@/domain/nationView'

const ASPECT = 592 / 259

/** Recorte do mapa enquadrado no território da nação; os vizinhos aparecem só como contorno. */
export const TerritoryMap = memo(function TerritoryMap({
  territoryId,
  color,
  name,
  world = geography,
}: {
  territoryId: number
  color: string
  name: string
  world?: WorldGeography
}) {
  const own = world.states.find((state) => state.id === territoryId)
  const viewBox = useMemo(() => {
    if (!own) return null
    const box = fitViewBox(pathBounds(own.d), ASPECT)
    return `${box.x} ${box.y} ${box.width} ${box.height}`
  }, [own])

  return (
    <div
      className="relative overflow-hidden rounded-[4px] bg-nation-sea"
      style={{ aspectRatio: `${ASPECT}` }}
    >
      {own && viewBox && (
        <svg
          viewBox={viewBox}
          role="img"
          aria-label={`Mapa do território de ${name}`}
          className="block size-full"
        >
          {world.states
            .filter((state) => state.id !== own.id)
            .map((state) => (
              <path
                key={state.id}
                d={state.d}
                fill="none"
                stroke="var(--n-line)"
                strokeOpacity={0.6}
                strokeWidth={1}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          <path
            d={own.d}
            fill={color}
            fillRule="evenodd"
            stroke={`color-mix(in srgb, ${color} 55%, white)`}
            strokeWidth={1.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {world.lakes.map((lake) => (
            <path
              key={lake.id}
              d={lake.d}
              fill="var(--n-bg)"
              fillRule="evenodd"
              stroke="var(--n-line)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      )}
      <p className="absolute top-4 left-4 flex h-6 items-center gap-2 rounded-[4px] bg-nation-panel px-2.5 text-[10px] tracking-[0.04em] text-nation-text uppercase">
        <span aria-hidden className="size-2 rounded-[2px]" style={{ background: color }} />
        {name}
      </p>
    </div>
  )
})
