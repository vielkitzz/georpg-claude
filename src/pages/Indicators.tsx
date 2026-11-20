import { formatPercent } from '@/domain/format'
import { nationalIndicators } from '@/domain/nationalIndicators'
import { ApprovalChart } from '@/ui/ApprovalChart'
import { EmptySection, IndicatorCards, NationPage } from '@/ui/NationPage'
import { Panel } from '@/ui/Panel'

export function ApprovalHistory({ values }: { values: number[] }) {
  if (values.length > 1) return <ApprovalChart values={values} />
  const approval = values.at(-1)
  return (
    <EmptySection>
      {approval === undefined
        ? 'A aprovação do governo ainda não foi registrada.'
        : `Aprovação atual de ${formatPercent(approval)}. São necessárias duas medições para exibir o gráfico.`}
    </EmptySection>
  )
}

export function IndicatorsPage() {
  return (
    <NationPage title="Indicadores" note="Medições sociais, políticas e econômicas da nação.">
      {(nation) => (
        <div className="grid gap-5">
          <Panel title="Indicadores nacionais">
            <IndicatorCards
              indicators={nationalIndicators(nation)}
              empty="A população, a aprovação e a legitimidade ainda não têm registros."
            />
          </Panel>
          <Panel title="Indicadores econômicos">
            <IndicatorCards
              indicators={nation.indicators}
              empty="As contas nacionais ainda não têm indicadores econômicos registrados."
            />
          </Panel>
          <Panel title="Histórico de aprovação">
            <ApprovalHistory values={nation.approvalHistory} />
          </Panel>
        </div>
      )}
    </NationPage>
  )
}
