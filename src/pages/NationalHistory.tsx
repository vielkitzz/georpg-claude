import { EmptySection, NationPage } from '@/ui/NationPage'
import { Panel } from '@/ui/Panel'

export function NationalHistoryPage() {
  return (
    <NationPage
      title="Histórico Nacional"
      note="Fundação, memória nacional e mudanças institucionais."
    >
      {(nation) => (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Fundação da nação">
            <p className="subtitle">{nation.officialName}</p>
            {nation.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{nation.description}</p>
            )}
            {nation.history && <p className="mt-4 whitespace-pre-wrap text-sm">{nation.history}</p>}
            {!nation.description && !nation.history && (
              <div className="mt-3">
                <EmptySection>A nação ainda não tem um relato de fundação registrado.</EmptySection>
              </div>
            )}
          </Panel>
          <Panel title="Linha do tempo">
            <ol className="border-l-2 border-secondary pl-4">
              <li>
                <span className="subtitle text-secondary">{nation.foundedYear}</span>
                <p className="mt-1 text-sm">Fundação de {nation.officialName}</p>
              </li>
            </ol>
          </Panel>
          <Panel title="Eventos nacionais">
            <EmptySection>Não há outros eventos registrados na linha do tempo.</EmptySection>
          </Panel>
          <Panel title="Decisões governamentais">
            <EmptySection>
              O histórico ainda não tem decisões governamentais registradas.
            </EmptySection>
          </Panel>
          <Panel title="Alterações institucionais" className="lg:col-span-2">
            <EmptySection>
              O histórico ainda não registra mudanças nas instituições políticas.
            </EmptySection>
          </Panel>
        </div>
      )}
    </NationPage>
  )
}
