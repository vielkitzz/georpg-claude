import { EmptySection, Facts, IndicatorCards, NationPage } from '@/ui/NationPage'
import { Panel } from '@/ui/Panel'

const economicSections = [
  {
    title: 'PIB e PIB per capita',
    labels: ['PIB', 'PIB per capita'],
    empty: 'A produção nacional ainda não tem medições.',
  },
  {
    title: 'Inflação e desemprego',
    labels: ['Inflação', 'Desemprego'],
    empty: 'Preços e emprego ainda não têm medições.',
  },
  {
    title: 'Tesouro nacional',
    labels: ['Tesouro nacional'],
    empty: 'O saldo do tesouro ainda não foi registrado.',
  },
]

export function EconomyPage() {
  return (
    <NationPage title="Economia" note="Contas nacionais, moeda e finanças públicas.">
      {(nation) => (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Panorama econômico" className="lg:col-span-2">
            <div className="grid gap-4 lg:grid-cols-3">
              {economicSections.map(({ title, labels, empty }) => (
                <section key={title}>
                  <h3 className="subtitle mb-2 text-sm">{title}</h3>
                  <IndicatorCards
                    className="grid-cols-1"
                    indicators={nation.indicators.filter((indicator) =>
                      labels.includes(indicator.label),
                    )}
                    empty={empty}
                  />
                </section>
              ))}
            </div>
          </Panel>
          <Panel title="Moeda">
            <Facts
              items={[
                ['Código monetário', nation.currency.code],
                ['Nome da moeda', nation.currency.name],
              ]}
            />
          </Panel>
          <Panel title="Orçamento e políticas econômicas">
            <EmptySection>
              O tesouro mostra o saldo disponível. O orçamento e as políticas econômicas ainda não
              têm registros.
            </EmptySection>
          </Panel>
        </div>
      )}
    </NationPage>
  )
}
