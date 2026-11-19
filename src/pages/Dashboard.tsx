import { Inbox } from 'lucide-react'
import type { Nation } from '@/domain/types'
import { formatPercent } from '@/domain/format'
import { ApprovalChart } from '@/ui/ApprovalChart'
import { NationGate } from '@/ui/NationGate'
import { NextTick } from '@/ui/NextTick'
import { Panel } from '@/ui/Panel'
import { Stat } from '@/ui/Stat'

function NationHeader({ nation }: { nation: Nation }) {
  const facts: [string, string][] = [
    ['Capital', nation.capital],
    ['Moeda', `${nation.currency.code}, ${nation.currency.name}`],
    ['Governo', `${nation.government.form}, ${nation.government.system}`],
    ['Lema', nation.motto],
  ]
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div
          aria-hidden
          className="mt-1 h-14 w-20 shrink-0 rounded-sm border border-line"
          style={{ background: nation.nationalColor }}
        />
        <div className="min-w-0">
          <h1 className="title text-3xl break-words sm:text-4xl md:text-5xl">
            {nation.officialName}
          </h1>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {facts.map(([term, value]) => (
              <div key={term} className="flex gap-2">
                <dt className="text-muted">{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <NextTick />
    </div>
  )
}

function Dashboard({ nation }: { nation: Nation }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <NationHeader nation={nation} />

      <Panel title="Indicadores nacionais">
        <dl className="grid grid-cols-2 divide-line sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
          {nation.indicators.map((indicator) => (
            <Stat key={indicator.label} indicator={indicator} />
          ))}
        </dl>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Aprovação do governo" className="lg:col-span-3">
          <ApprovalChart values={nation.approvalHistory} />
          <p className="mt-3 text-sm text-muted">
            Legitimidade do regime:{' '}
            <span className="text-fg">{formatPercent(nation.legitimacy)}</span>
          </p>
        </Panel>

        <Panel title="Boletim" className="lg:col-span-2">
          <ul className="flex flex-col gap-4">
            {nation.news.map((item) => (
              <li key={item.id}>
                <p className="text-xs text-muted">{item.date}</p>
                <p className="subtitle">{item.headline}</p>
                <p className="text-sm text-muted">{item.summary}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Ordens">
        <div className="flex items-center gap-3 text-muted">
          <Inbox size={22} aria-hidden />
          <p>Você ainda não emitiu nenhuma ordem neste tick.</p>
        </div>
      </Panel>
    </div>
  )
}

export function DashboardPage() {
  return <NationGate>{(nation) => <Dashboard nation={nation} />}</NationGate>
}
