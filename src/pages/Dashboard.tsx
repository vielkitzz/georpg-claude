import { formatInteger, formatPercent } from '@/domain/format'
import type { Indicator, Nation } from '@/domain/types'
import { ApprovalChart } from '@/ui/ApprovalChart'
import { EmptySection, IndicatorCards, NationPage, NewsList } from '@/ui/NationPage'
import { NextTick } from '@/ui/NextTick'
import { Panel } from '@/ui/Panel'

function Dashboard({ nation }: { nation: Nation }) {
  const approval = nation.approvalHistory.at(-1)
  const nationalIndicators: Indicator[] = []
  if (nation.population !== null)
    nationalIndicators.push({ label: 'População', value: formatInteger(nation.population) })
  if (approval !== undefined)
    nationalIndicators.push({ label: 'Aprovação do governo', value: formatPercent(approval) })
  if (nation.legitimacy !== null)
    nationalIndicators.push({ label: 'Legitimidade', value: `${nation.legitimacy}/100` })
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
          indicators={nationalIndicators}
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
          {nation.approvalHistory.length > 1 ? (
            <ApprovalChart values={nation.approvalHistory} />
          ) : (
            <EmptySection>
              {approval !== undefined
                ? `Aprovação atual de ${formatPercent(approval)}. São necessárias duas medições para exibir o gráfico.`
                : 'A aprovação do governo ainda não foi registrada.'}
            </EmptySection>
          )}
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
  return <NationPage title="Painel Geral">{(nation) => <Dashboard nation={nation} />}</NationPage>
}
