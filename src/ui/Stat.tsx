import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { formatDelta } from '@/domain/format'
import { deltaMood, type Mood } from '@/domain/indicators'
import type { Indicator } from '@/domain/types'

const MOOD_STYLE: Record<Mood, string> = {
  good: 'text-positive',
  bad: 'text-warning',
  flat: 'text-muted',
}
const MOOD_TEXT: Record<Mood, string> = { good: 'melhorou', bad: 'piorou', flat: 'estável' }

export function Stat({ indicator }: { indicator: Indicator }) {
  const mood = deltaMood(indicator)
  const Arrow = indicator.delta > 0 ? ArrowUp : indicator.delta < 0 ? ArrowDown : Minus
  return (
    <div className="flex min-w-0 flex-col gap-1 py-3 pr-3 lg:px-4 lg:first:pl-0 lg:last:pr-0">
      <dt className="text-sm text-muted">{indicator.label}</dt>
      <dd className="subtitle text-xl whitespace-nowrap sm:text-2xl">{indicator.value}</dd>
      <dd className={`flex items-center gap-1 text-sm ${MOOD_STYLE[mood]}`}>
        <Arrow size={14} aria-hidden />
        <span>{formatDelta(indicator.delta)}</span>
        <span className="sr-only">{MOOD_TEXT[mood]} desde o último tick</span>
      </dd>
    </div>
  )
}
