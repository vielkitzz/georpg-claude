
import type { IdeologyView } from '@/domain/nationView'
import { NationCard } from './NationCard'
import { PoliticalCompass } from './PoliticalCompass'

/** Retrato ideológico: bússola, ideologia governante e perfil político. */
export function IdeologyPanel({
  ideology,
}: {
  ideology: IdeologyView | null
}) {
  return (
    <NationCard
      title="Retrato ideológico"
      subtitle="A orientação que guia o seu governo."
    >
      {ideology ? (
        <div className="flex flex-col gap-5 @min-[420px]:flex-row @min-[420px]:items-start @min-[420px]:gap-5">

          {/* Bússola política */}
          <div className="flex shrink-0 justify-center @min-[420px]:w-[178px]">
            <PoliticalCompass
              x={ideology.position.x}
              y={ideology.position.y}
            />
          </div>

          {/* Informações ideológicas */}
          <div className="min-w-0 flex-1">

            <p className="text-[10px] font-semibold tracking-[0.12em] text-nation-accent uppercase">
              Ideologia governante
            </p>

            <p className="mt-2 text-[18px] leading-6 font-medium text-nation-text">
              {ideology.name}
            </p>

            <p className="mt-1 max-w-[300px] text-[12px] leading-[18px] text-nation-muted">
              {ideology.summary}
            </p>

            {/* Indicadores ideológicos */}
            <ul className="mt-4 flex flex-col gap-3">
              {ideology.bars.map((bar, index) => (
                <li key={bar.label}>
                  <div className="flex justify-between gap-2 text-xs leading-4">
                    <span className="text-nation-muted">
                      {bar.label}
                    </span>

                    <span className="shrink-0 text-nation-text">
                      {bar.value}%
                    </span>
                  </div>

                  <div
                    role="img"
                    aria-label={`${bar.label}: ${bar.value}%`}
                    className="mt-1.5 h-1 rounded-full bg-nation-track"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${bar.value}%`,
                        background:
                          index === 0
                            ? 'var(--n-negative)'
                            : 'var(--n-bar-soft)',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="py-6 text-sm text-nation-muted">
          A ideologia governante ainda não foi definida para esta nação.
        </p>
      )}
    </NationCard>
  )
}
