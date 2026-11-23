import { formatInteger, formatPercent } from '@/domain/format'
import { EmptySection, IndicatorCards, NationPage } from '@/ui/NationPage'
import { Panel } from '@/ui/Panel'

export function SocietyPage() {
  return (
    <NationPage title="Sociedade" note="Demografia e indicadores sociais da nação.">
      {(nation) => {
        const approval = nation.approvalHistory.at(-1)
        const indicators = [
          ...(nation.population === null
            ? []
            : [{ label: 'População total', value: formatInteger(nation.population) }]),
          ...(approval === undefined
            ? []
            : [{ label: 'Aprovação do governo', value: formatPercent(approval) }]),
        ]
        return (
          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="Indicadores sociais" className="lg:col-span-3">
              <IndicatorCards
                indicators={indicators}
                empty="A população e a aprovação do governo ainda não foram registradas."
              />
            </Panel>
            <Panel title="Educação">
              <EmptySection>
                Capacidade escolar e alfabetização ainda não são medidas pela simulação.
              </EmptySection>
            </Panel>
            <Panel title="Saúde">
              <EmptySection>
                O sistema nacional ainda não registra serviços de saúde e cobertura assistencial.
              </EmptySection>
            </Panel>
            <Panel title="Condições de vida">
              <EmptySection>
                Moradia, renda das famílias e acesso a serviços ainda não têm indicadores próprios.
              </EmptySection>
            </Panel>
          </div>
        )
      }}
    </NationPage>
  )
}
