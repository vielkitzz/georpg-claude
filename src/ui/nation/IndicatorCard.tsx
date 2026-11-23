import { Info } from 'lucide-react'
import { cardMood } from '@/domain/indicators'
import type { Indicator } from '@/domain/types'
import { Sparkline } from './Sparkline'

const TONE = { good: 'var(--n-positive)', bad: 'var(--n-negative)' } as const
const MOOD_TEXT = { good: 'sem piora', bad: 'piorou' } as const

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
  const mood = cardMood(indicator)
  const tone = TONE[mood]
  const large = size === 'large'
  const valueSize = large ? 'text-[56px]' : indicator.key === 'gdp' ? 'text-[26px]' : 'text-[40px]'

  return (
    <div
      className="relative h-[162px] overflow-hidden rounded-[6px] px-4 pt-[18px]"
      style={{
        background: `linear-gradient(to bottom left, color-mix(in srgb, ${tone} 20%, transparent), transparent), var(--n-raised)`,
      }}
    >
      <p className="pr-6 text-[11px] leading-4 text-nation-muted uppercase">{indicator.label}</p>
      <p className="mt-0.5 text-[11px] leading-[14px] text-nation-subtle">{indicator.caption}</p>

      <span
        role="img"
        tabIndex={0}
        aria-label={`${indicator.label}: ${indicator.info}`}
        title={indicator.info}
        className="absolute top-4 right-4 text-nation-muted"
      >
        <Info size={18} aria-hidden />
      </span>

      <p className="mt-1.5 flex items-baseline gap-1.5 whitespace-nowrap">
        <span className={`${valueSize} leading-[1.1] font-bold text-nation-text`}>
          {indicator.value}
        </span>
        {indicator.unit && (
          <span className="text-[20px] leading-none font-light text-nation-muted">
            {indicator.unit}
          </span>
        )}
      </p>

      <Sparkline
        values={indicator.history}
        color={tone}
        strokeWidth={large ? 2.3 : 1.6}
        className={`absolute right-5 ${
          large ? 'top-[57px] h-[62px] w-[29.5%]' : 'top-[68px] h-[42px] w-[27%]'
        }`}
      />

      <p
        className="absolute bottom-4 left-4 flex items-center gap-1.5 text-xs"
        style={{ color: tone }}
      >
        <Triangle down={indicator.delta < 0} />
        <span>{indicator.deltaText} no último tick</span>
        <span className="sr-only">({MOOD_TEXT[mood]})</span>
      </p>
    </div>
  )
}
