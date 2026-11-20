import { nationalIndicators } from '@/domain/nationalIndicators'
import type { Nation } from '@/domain/types'
import { EmptySection, IndicatorCards, NationPage, NewsList } from '@/ui/NationPage'
import { NextTick } from '@/ui/NextTick'
import { Panel } from '@/ui/Panel'
import { ApprovalHistory } from './Indicators'

function Dashboard({ nation }: { nation: Nation }) {
  const facts = [
    ['Capital', nation.capital],
    ['Moeda', [nation.currency.name, nation.currency.code].filter(Boolean).join(' · ')],
    [
      'Governo',
      [nation.government.form, nation.government.regime, nation.government.system]
        .filter(Boolean)
        .join(' · '),
    ],
    ['Lema', nation.motto],
  ]

  return (
    <div className="grid gap-5">
      <Panel title={nation.officialName}>
        <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <dl className="grid gap-3 sm:grid-cols-2">
            {facts
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="subtitle text-sm wrap-break-word">{value}</dd>
                </div>
              ))}
          </dl>
          <NextTick />
        </div>
      </Panel>

      <Panel title="Indicadores nacionais">
        <IndicatorCards
          indicators={nationalIndicators(nation)}
          empty="A população, a aprovação e a legitimidade ainda não têm registros."
        />
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Situação econômica">
          <IndicatorCards
            indicators={nation.indicators}
            empty="As contas nacionais ainda não têm indicadores econômicos registrados."
          />
        </Panel>
        <Panel title="Histórico de aprovação">
          <ApprovalHistory values={nation.approvalHistory} />
        </Panel>
        <Panel title="Boletim nacional">
          <NewsList items={nation.news} />
        </Panel>
        <Panel title="Ordens e ações pendentes">
          <EmptySection>
            As pendências aparecerão aqui quando o módulo de ordens estiver disponível.
          </EmptySection>
        </Panel>
      </div>
    </div>
  )
}

export function DashboardPage() {
  return (
    <NationPage title="Nação" note="Identidade, indicadores e atividade nacional.">
      {(nation) => <Dashboard nation={nation} />}
    </NationPage>
  )
}
