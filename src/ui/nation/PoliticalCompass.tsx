const SIZE = 180
const HALF = SIZE / 2
const CELL = 30

/** Bússola política: x = mercado (0 Estado, 100 mercado), y = autoridade (0 liberdade, 100 autoridade). */
export function PoliticalCompass({ x, y }: { x: number; y: number }) {
  const cx = (x / 100) * SIZE
  const cy = (1 - y / 100) * SIZE
  // O quadrante onde a nação está ganha o tom de destaque.
  const activeCol = x >= 50 ? 1 : 0
  const activeRow = y >= 50 ? 0 : 1
  const quadrants = [
    { col: 0, row: 0, fill: 'var(--n-quad-a)' },
    { col: 1, row: 0, fill: 'var(--n-quad-a)' },
    { col: 0, row: 1, fill: 'var(--n-quad-b)' },
    { col: 1, row: 1, fill: 'var(--n-quad-c)' },
  ]
  const lines = [1, 2, 4, 5].map((n) => n * CELL)

  return (
    <div className="flex w-[180px] flex-col gap-2 text-[10px] tracking-[0.12em] text-nation-subtle uppercase">
      <span className="text-center">Autoridade</span>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Bússola política: mercado ${Math.round(x)} de 100 e autoridade ${Math.round(y)} de 100`}
        className="block size-[180px] overflow-visible"
      >
        <rect width={SIZE} height={SIZE} fill="var(--n-compass)" rx={2} />
        {quadrants.map(({ col, row, fill }) => {
          const active = col === activeCol && row === activeRow
          return (
            <g key={`${col}${row}`}>
              <rect
                x={col * HALF}
                y={row * HALF}
                width={HALF}
                height={HALF}
                fill={active ? 'var(--n-quad-active)' : fill}
              />
              {active && (
                <rect
                  x={col * HALF}
                  y={row * HALF}
                  width={HALF}
                  height={HALF}
                  fill="var(--n-negative)"
                  fillOpacity={0.4}
                />
              )}
            </g>
          )
        })}
        {lines.map((n) => (
          <g key={n} stroke="var(--n-grid)" strokeOpacity={0.3}>
            <line x1={n} x2={n} y1={0} y2={SIZE} />
            <line y1={n} y2={n} x1={0} x2={SIZE} />
          </g>
        ))}
        <g stroke="var(--n-grid)">
          <line x1={HALF} x2={HALF} y1={0} y2={SIZE} />
          <line y1={HALF} y2={HALF} x1={0} x2={SIZE} />
        </g>
        <rect
          x={0.5}
          y={0.5}
          width={SIZE - 1}
          height={SIZE - 1}
          rx={1.5}
          fill="none"
          stroke="var(--n-divider)"
        />
        <circle cx={cx} cy={cy} r={8} fill="var(--n-negative)" stroke="#fff" strokeWidth={2} />
      </svg>
      <div className="flex justify-between">
        <span>Estado</span>
        <span>Mercado</span>
      </div>
      <span className="text-center">Liberdade</span>
    </div>
  )
}
