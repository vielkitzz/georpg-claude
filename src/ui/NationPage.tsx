import type { ReactNode } from 'react'
import type { Indicator, Nation, NewsItem } from '@/domain/types'
import { NationGate } from './NationGate'
import { PageTitle } from './Panel'
import { Stat } from './Stat'

export function NationPage({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: (nation: Nation) => ReactNode
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle note={note}>{title}</PageTitle>
      <NationGate>{children}</NationGate>
    </div>
  )
}

export function EmptySection({ children }: { children: ReactNode }) {
  return <p className="rounded-md bg-bg/40 px-4 py-3 text-sm text-muted">{children}</p>
}

export function Facts({ items }: { items: readonly (readonly [string, string | null])[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map(([term, value]) => (
        <div key={term} className="min-w-0">
          <dt className="text-sm text-muted">{term}</dt>
          <dd className="subtitle mt-1 wrap-break-word">{value || 'Sem registro'}</dd>
        </div>
      ))}
    </dl>
  )
}

export function IndicatorCards({
  indicators,
  empty,
  className = 'sm:grid-cols-2 xl:grid-cols-3',
}: {
  indicators: Indicator[]
  empty: string
  className?: string
}) {
  if (!indicators.length) return <EmptySection>{empty}</EmptySection>
  return (
    <dl className={`grid gap-2 ${className}`}>
      {indicators.map((indicator) => (
        <div key={indicator.label} className="rounded-md bg-bg/55 px-3">
          <Stat indicator={indicator} />
        </div>
      ))}
    </dl>
  )
}

export function NewsList({ items }: { items: NewsItem[] }) {
  if (!items.length)
    return <EmptySection>O boletim nacional ainda não tem notícias publicadas.</EmptySection>
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id} className="py-3 first:pt-0 last:pb-0">
          <p className="text-xs text-muted">{item.date}</p>
          <h3 className="subtitle mt-1">{item.headline}</h3>
          <p className="mt-1 text-sm text-muted">{item.summary}</p>
        </li>
      ))}
    </ul>
  )
}
