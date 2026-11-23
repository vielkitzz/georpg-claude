import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import type { Nation } from '@/domain/types'
import { NationCard } from './NationCard'
import { TerritoryMap } from './TerritoryMap'

/** Território nacional: o recorte do mapa com o país em destaque e o atalho para o mapa mundial. */
export function TerritoryPanel({ nation }: { nation: Nation }) {
  return (
    <NationCard title="Território nacional" subtitle="Sua presença no mundo de Erda.">
      <TerritoryMap
        territoryId={nation.territoryId}
        color={nation.nationalColor}
        name={nation.shortName}
      />
      <Link
        to="/mapa"
        className="mt-5 inline-flex items-center gap-2 self-start text-sm text-nation-accent hover:underline"
      >
        Mapa mundial
        <ExternalLink size={16} aria-hidden />
      </Link>
    </NationCard>
  )
}
