const SIZE = 150
const HALF = SIZE / 2
const CELL = 25

/** Bússola política: x = mercado, y = autoridade. */
export function PoliticalCompass({
  x,
  y,
}: {
  x: number
  y: number
}) {
  const cx = (x / 100) * SIZE
  const cy = (1 - y / 100) * SIZE

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
    <div className="grid w-[178px] shrink-0 grid-cols-[14px_150px_14px] grid-rows-[18px_150px_18px] items-center text-[9px] leading-none tracking-[0.08em] text-nation-subtle uppercase">

      {/* Autoridade — superior */}
      <span className="col-start-2 row-start-1 text-center">
        Autoridade
      </span>

      {/* Estado — esquerda, 90° */}
      <span className="col-start-1 row-start-2 flex h-full items-center justify-center">
        <span className="rotate-90 whitespace-nowrap">
          Estado
        </span>
      </span>

      {/* Bússola */}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Bússola política: mercado ${Math.round(x)} de 100 e autoridade ${Math.round(y)} de 100`}
        className="col-start-2 row-start-2 block size-[150px]"
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

        <circle
          cx={cx}
          cy={cy}
          r={7}
          fill="var(--n-negative)"
          stroke="#fff"
          strokeWidth={2}
        />
      </svg>

      {/* Mercado — direita, -90° */}
      <span className="col-start-3 row-start-2 flex h-full items-center justify-center">
        <span className="-rotate-90 whitespace-nowrap">
          Mercado
        </span>
      </span>

      {/* Liberdade — inferior */}
      <span className="col-start-2 row-start-3 text-center">
        Liberdade
      </span>
    </div>
  )
}
