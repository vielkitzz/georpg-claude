import { useState } from 'react'
import { geography } from '@/data/gauzoland'
import { useTerritoryClaims } from '@/data/hooks'
import { PageTitle } from '@/ui/Panel'
import { TerritoryList } from '@/ui/map/TerritoryList'
import { WorldMap } from '@/ui/map/WorldMap'

export function WorldMapPage() {
  const claims = useTerritoryClaims()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const data = claims.status === 'ready' ? claims.data : []

  return (
    <div className="mx-auto max-w-[110rem]">
      <PageTitle note="Clique em um território para ver suas províncias. Arraste para mover e use a roda do mouse para ampliar.">
        Mapa mundial
      </PageTitle>
      {claims.status === 'error' && (
        <p role="alert" className="mb-4 text-warning">
          Não foi possível carregar os donos dos territórios. O mapa mostra só a geografia.
        </p>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="lg:sticky lg:top-20">
          <WorldMap claims={data} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <aside className="flex min-h-0 flex-col gap-3 rounded-lg border border-line bg-panel p-4 lg:max-h-[calc(100dvh-12rem)]">
          <h2 className="title-semi text-xl">Territórios</h2>
          <TerritoryList
            territories={geography.states}
            claims={data}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>
      </div>
    </div>
  )
}
