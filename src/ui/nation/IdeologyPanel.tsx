import type { IdeologyView } from '@/domain/nationView'
import { NationCard } from './NationCard'
import { PoliticalCompass } from './PoliticalCompass'

/** Retrato ideológico: bússola, ideologia governante e as quatro marcas do perfil. */
export function IdeologyPanel({ ideology }: { ideology: IdeologyView | null }) {
  return (
    <NationCard title="Retrato ideológico" subtitle="A orientação que guia o seu governo.">
      {ideology ? (
        <div className="flex flex-col gap-8 @min-[560px]:flex-row">
          <div className="shrink-0 @min-[560px]:w-[226px] @min-[560px]:pl-[22px]">
            <PoliticalCompass x={ideology.position.x} y={ideology.position.y} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-nation-accent uppercase">
              Ideologia governante
            </p>
            <p className="mt-3 text-[22px] leading-7 font-medium text-nation-text">
              {ideology.name}
            </p>
            <p className="mt-2 max-w-[300px] text-[13px] leading-5 text-nation-muted">
              {ideology.summary}
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {ideology.bars.map((bar, index) => (
                <li key={bar.label}>
                  <div className="flex justify-between text-xs leading-4">
                    <span className="text-nation-muted">{bar.label}</span>
                    <span className="text-nation-text">{bar.value}%</span>
                  </div>
                  <div
                    role="img"
                    aria-label={`${bar.label}: ${bar.value}%`}
                    className="mt-2 h-1 rounded-full bg-nation-track"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${bar.value}%`,
                        background: index === 0 ? 'var(--n-negative)' : 'var(--n-bar-soft)',
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
