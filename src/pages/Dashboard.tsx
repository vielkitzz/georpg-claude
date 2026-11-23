import { ChevronRight } from 'lucide-react'
import { geography } from '@/data/gauzoland'
import { useWorldState } from '@/data/hooks'
import { areaFromCells, areaRank, ideologyView } from '@/domain/nationView'
import type { Nation } from '@/domain/types'
import { NationGate } from '@/ui/NationGate'
import { AttentionPanel } from '@/ui/nation/AttentionPanel'
import { BasicInfoPanel } from '@/ui/nation/BasicInfoPanel'
import { IdeologyPanel } from '@/ui/nation/IdeologyPanel'
import { IndicatorCard } from '@/ui/nation/IndicatorCard'
import { NationCard } from '@/ui/nation/NationCard'
import { NationHero } from '@/ui/nation/NationHero'
import { TerritoryPanel } from '@/ui/nation/TerritoryPanel'

/** Atalho para a página de indicadores, que ainda não existe: segue o padrão "em breve" do menu. */
function SeeMore() {
  return (
    <span
      aria-disabled="true"
      title="Em breve"
      className="mt-1 inline-flex cursor-not-allowed items-center gap-1 text-base text-nation-accent opacity-90"
    >
      Ver mais
      <ChevronRight size={18} aria-hidden />
    </span>
  )
}

function Overview({ nation }: { nation: Nation }) {
  const world = useWorldState()
  const tickIndex = world.status === 'ready' ? world.data.tickIndex : null

  const territory = geography.states.find((state) => state.id === nation.territoryId)
  const area = territory
    ? {
        km2: areaFromCells(territory.cells),
        rank: areaRank(territory.id, geography.states),
      }
    : null
  const divisions =
    territory && territory.provinceIds.length > 0 ? territory.provinceIds.length : null
  const ideology = ideologyView(nation.ideology, nation.ideologyScores)

  const large = nation.indicators.slice(0, 3)
  const small = nation.indicators.slice(3)

  return (
    <div className="nation-page @container -m-4 min-h-[calc(100dvh-4rem)] bg-nation-bg p-4 text-nation-text md:-m-6 md:p-6">
      <div className="mx-auto flex max-w-[1304px] flex-col gap-8">
        <div className="pb-4">
          <h1 className="font-title text-[44px] leading-none font-bold uppercase">Nação</h1>
          <p className="mt-2 text-[13px] text-nation-muted">Seu país, em perspectiva.</p>
        </div>

        <NationHero nation={nation} ideologyName={ideology?.name} />

        <NationCard title="Indicadores" divider action={<SeeMore />}>
          <div className="flex flex-col gap-8">
            <div className="grid gap-6 @min-[800px]:grid-cols-3">
              {large.map((indicator) => (
                <IndicatorCard key={indicator.key} indicator={indicator} size="large" />
              ))}
            </div>
            <div className="grid gap-6 @min-[560px]:grid-cols-2 @min-[960px]:grid-cols-4">
              {small.map((indicator) => (
                <IndicatorCard key={indicator.key} indicator={indicator} size="small" />
              ))}
            </div>
          </div>
        </NationCard>

        <div className="grid gap-8 @min-[900px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <BasicInfoPanel nation={nation} area={area} divisions={divisions} />
          <AttentionPanel alerts={nation.alerts} tickIndex={tickIndex} />
        </div>

        <div className="grid gap-8 @min-[900px]:grid-cols-2">
          <TerritoryPanel nation={nation} />
          <IdeologyPanel ideology={ideology} />
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  return <NationGate>{(nation) => <Overview nation={nation} />}</NationGate>
}
