import { EmptySection, Facts, NationPage } from '@/ui/NationPage'
import { Panel } from '@/ui/Panel'

export function InfrastructurePage() {
  return (
    <NationPage title="Infraestrutura" note="Redes de serviços e obras nacionais.">
      {() => (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel title="Panorama da infraestrutura">
            <Facts
              items={[
                ['Transportes', 'Sem inventário de estradas, ferrovias ou portos'],
                ['Energia', 'Sem registros de geração e distribuição'],
                ['Saneamento', 'Sem medições de cobertura de água e esgoto'],
                ['Comunicações', 'Sem inventário de redes postais ou telegráficas'],
              ]}
            />
          </Panel>
          <Panel title="Projetos e investimentos">
            <EmptySection>
              Obras e despesas de infraestrutura aparecerão quando houver um registro de projetos
              nacionais.
            </EmptySection>
          </Panel>
        </div>
      )}
    </NationPage>
  )
}

export function DefensePage() {
  return (
    <NationPage title="Defesa" note="Organização da defesa, pessoal e recursos militares.">
      {() => (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Estrutura militar" className="lg:col-span-2">
            <Facts
              items={[
                ['Exército', 'Sem registro de unidades terrestres'],
                ['Marinha', 'Sem registro de frotas ou bases navais'],
                ['Força Aérea', 'Sem registro de esquadrões ou bases aéreas'],
              ]}
            />
          </Panel>
          <Panel title="Efetivos e equipamentos">
            <EmptySection>
              O módulo de defesa ainda não disponibiliza contingentes ou inventários de
              equipamentos.
            </EmptySection>
          </Panel>
          <Panel title="Orçamento de defesa">
            <EmptySection>
              A parcela do orçamento nacional destinada à defesa ainda não tem registro.
            </EmptySection>
          </Panel>
        </div>
      )}
    </NationPage>
  )
}
