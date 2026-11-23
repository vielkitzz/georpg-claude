import { Info } from 'lucide-react'
import { deltaMood } from '@/domain/indicators'
import type { Indicator } from '@/domain/types'
import { Sparkline } from './Sparkline'

const TONE = { good: 'var(--n-positive)', bad: 'var(--n-negative)', flat: 'var(--n-muted)' }
const MOOD_TEXT = { good: 'melhorou', bad: 'piorou' }

function Triangle({ down }: { down: boolean }) {
  return (
    <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden className="shrink-0 fill-current">
      <path d={down ? 'M0 0H9L4.5 8Z' : 'M4.5 0L9 8H0Z'} />
    </svg>
  )
}

/** Cartão de um indicador: valor, variação no último tick e gráfico, tingido de verde ou vermelho. */
export function IndicatorCard({
  indicator,
  size,
}: {
  indicator: Indicator
  size: 'large' | 'small'
}) {
  const mood = deltaMood(indicator)
  const tone = TONE[mood]
  const large = size === 'large'
  const valueSize = large ? 'text-[56px]' : indicator.key === 'gdp' ? 'text-[26px]' : 'text-[40px]'

  return (
    <div
      className="relative flex h-[176px] flex-col overflow-hidden rounded-[6px] bg-nation-raised px-5 py-5"
      style={{
        backgroundImage:
          mood === 'flat'
            ? undefined
            : `linear-gradient(to bottom left, color-mix(in srgb, ${tone} 20%, transparent), transparent)`,
      }}
    >
  <div className="min-h-[40px] shrink-0 pr-6">
    <p className="text-[11px] leading-4 text-nation-muted uppercase">
      {indicator.label}
    </p>

    <p className="mt-1 text-[11px] leading-[14px] text-nation-subtle">
      {indicator.caption}
    </p>
  </div>

      <span
        role="img"
        tabIndex={0}
        aria-label={`${indicator.label}: ${indicator.info}`}
        title={indicator.info}
        className="absolute top-5 right-5 text-nation-muted"
      >
        <Info size={18} aria-hidden />
      </span>

      <div className="relative z-10 mt-2 flex h-[56px] shrink-0 items-center">
        <p className="flex min-w-0 items-baseline gap-2 whitespace-nowrap">
          <span className={`${valueSize} leading-none font-bold text-nation-text`}>
            {indicator.value}
          </span>

          {indicator.unit && (
            <span className="text-[18px] leading-none font-light text-nation-muted">
              {indicator.unit}
            </span>
          )}
        </p>
      </div>

      <Sparkline
        values={indicator.history}
        color={tone}
        strokeWidth={large ? 2.3 : 1.6}
        className={`pointer-events-none absolute right-5 ${
          large
            ? 'top-[72px] h-[48px] w-[27%]'
            : 'top-[72px] h-[40px] w-[25%]'
        }`}
      />

      <p
        className="absolute bottom-5 left-5 flex items-center gap-2 text-[11px]"
        style={{ color: tone }}
      >
        {mood === 'flat' ? (
          <span>Sem variação no último tick</span>
        ) : (
          <>
            <Triangle down={indicator.delta < 0} />
            <span>{indicator.deltaText} no último tick</span>
            <span className="sr-only">({MOOD_TEXT[mood]})</span>
          </>
        )}
      </p>
    </div>
  )
}
