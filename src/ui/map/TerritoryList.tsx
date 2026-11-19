import type { Territory } from '@/data/gauzoland'
import type { TerritoryClaim } from '@/domain/types'
import { MAP_UNOWNED } from './WorldMap'

interface Props {
  territories: Territory[]
  claims: TerritoryClaim[]
  selectedId: number | null
  onSelect: (id: number | null) => void
}

export function TerritoryDetails({
  territory,
  claim,
}: {
  territory: Territory
  claim?: TerritoryClaim
}) {
  return (
    <div className="rounded-md border border-line bg-raised p-3 text-sm">
      <p className="subtitle text-base">Território nº {territory.id}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-muted">Nome</dt>
        <dd>{claim?.name ?? 'Sem nome'}</dd>
        <dt className="text-muted">Dono</dt>
        <dd>{claim ? claim.name : 'Sem dono'}</dd>
        <dt className="text-muted">Províncias</dt>
        <dd>{territory.provinceIds.length}</dd>
        <dt className="text-muted">Burgos</dt>
        <dd>sem dados no export</dd>
        <dt className="text-muted">Vizinhos</dt>
        <dd>{territory.neighbors.length}</dd>
      </dl>
    </div>
  )
}

/** Lista de territórios: também é o caminho acessível para quem não usa o mouse. */
export function TerritoryList({ territories, claims, selectedId, onSelect }: Props) {
  const claimByTerritory = new Map(claims.map((claim) => [claim.territoryId, claim]))
  const selected = territories.find((territory) => territory.id === selectedId)

  return (
    <div className="flex min-h-0 flex-col gap-3">
      {selected && (
        <TerritoryDetails territory={selected} claim={claimByTerritory.get(selected.id)} />
      )}
      <ul aria-label="Territórios" className="flex min-h-0 flex-col overflow-y-auto">
        {territories.map((territory) => {
          const claim = claimByTerritory.get(territory.id)
          const isSelected = territory.id === selectedId
          return (
            <li key={territory.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(isSelected ? null : territory.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  isSelected ? 'bg-primary font-semibold text-on-primary' : 'hover:bg-raised'
                }`}
              >
                <span
                  aria-hidden
                  className="size-4 shrink-0 rounded-sm border border-line"
                  style={{ background: claim?.color ?? MAP_UNOWNED }}
                />
                <span className="flex-1">
                  Território {territory.id}
                  <span className={isSelected ? '' : 'text-muted'}>
                    {' '}
                    ({claim?.name ?? 'Sem nome'})
                  </span>
                </span>
                <span className={isSelected ? '' : 'text-muted'}>
                  {territory.provinceIds.length} prov.
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
