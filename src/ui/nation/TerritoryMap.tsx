import { useState } from 'react'
import { geography } from '@/data/gauzoland'
import { useTerritoryClaims } from '@/data/hooks'
import type { Nation } from '@/domain/types'
import { WorldMap } from '@/ui/map/WorldMap'

export function TerritoryMap({ nation }: { nation: Nation }) {
  const { territoryId, id, shortName, nationalColor } = nation
  const [selectedId, setSelectedId] = useState<number | null>(territoryId)
  const claims = useTerritoryClaims()

  if (!geography.states.some((state) => state.id === territoryId)) {
    return <p className="text-sm text-nation-muted">Território indisponível no mapa.</p>
  }

  const neighbors =
    claims.status === 'ready'
      ? claims.data.filter((claim) => claim.territoryId !== territoryId)
      : []
  return (
    <WorldMap
      claims={[...neighbors, { territoryId, nationId: id, name: shortName, color: nationalColor }]}
      selectedId={selectedId}
      onSelect={setSelectedId}
      focusTerritoryId={territoryId}
      ariaLabel={`Mapa do território de ${shortName}`}
    />
  )
}
