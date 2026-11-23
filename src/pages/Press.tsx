import type { NewsItem } from '@/domain/types'
import { EmptySection, NewsList } from '@/ui/NationPage'
import { Panel } from '@/ui/Panel'

export function NationalPublications({ news }: { news: NewsItem[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Panel title="Notícias nacionais" className="lg:col-span-3">
        <NewsList items={news} />
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
  )
}
