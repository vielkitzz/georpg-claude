import { EmptySection, NationPage, NewsList } from '@/ui/NationPage'
import { Panel } from '@/ui/Panel'

export function PressPage() {
  return (
    <NationPage title="Imprensa" note="Boletim nacional e publicações do Estado.">
      {(nation) => (
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel title="Notícias nacionais" className="lg:col-span-3">
            <NewsList items={nation.news} />
          </Panel>
          <Panel title="Comunicados oficiais">
            <EmptySection>Ainda não há comunicados oficiais publicados.</EmptySection>
          </Panel>
          <Panel title="Publicações governamentais">
            <EmptySection>Ainda não há diários, relatórios ou documentos publicados.</EmptySection>
          </Panel>
          <Panel title="Arquivo de notícias">
            <EmptySection>O boletim ainda não tem edições arquivadas.</EmptySection>
          </Panel>
        </div>
      )}
    </NationPage>
  )
}
