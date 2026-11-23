import { Info } from 'lucide-react'
import { formatCurrency, formatRank, formatSpaced } from '@/domain/nationView'
import type { Nation } from '@/domain/types'
import { NationCard } from './NationCard'

type Fact = [label: string, value: string]

const EMPTY = '—'

function Column({ facts }: { facts: Fact[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-[11px]">
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs leading-4 text-nation-muted">{label}</dt>
          <dd className="mt-0.5 text-[15px] leading-5 font-medium break-words text-nation-text">
            {value || EMPTY}
          </dd>
        </div>
      ))}
    </div>
  )
}

/** Informações Básicas: identidade, instituições e números da nação. */
export function BasicInfoPanel({
  nation,
  area,
  divisions,
}: {
  nation: Nation
  /** Área em km² e posição entre os territórios, quando o território é conhecido. */
  area: { km2: number; rank: number | null } | null
  /** Número de divisões de primeiro nível. */
  divisions: number | null
}) {
  const { government, leadership } = nation
  const ranked = (text: string, rank?: number | null) =>
    rank ? `${text} (${formatRank(rank)})` : text

  const first: Fact[] = [
    ['Nome Oficial', nation.officialName],
    ['Capital', nation.capital],
    ['Idioma(s)', nation.languages.join(', ')],
    ['Religião', nation.religion],
    ['Área', area ? ranked(`${formatSpaced(area.km2)} km²`, area.rank) : ''],
    ['População', ranked(`${formatSpaced(nation.population)} hab.`, nation.populationRank)],
  ]
  const second: Fact[] = [
    ['Forma de Governo', government.form],
    ['Regime', government.regime],
    ['Sistema', government.system],
    ['Divisões', divisions ? `${divisions} ${government.firstLevelDivision.toLowerCase()}` : ''],
    [leadership.stateHead.title, leadership.stateHead.name],
  ]
  if (leadership.governmentHead) {
    second.push([leadership.governmentHead.title, leadership.governmentHead.name])
  }
  const third: Fact[] = [['Moeda', formatCurrency(nation.currency)]]

  return (
    <NationCard title="Informações Básicas" divider>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 @min-[520px]:grid-cols-2 @min-[760px]:grid-cols-3">
        <Column facts={first} />
        <Column facts={second} />
        <Column facts={third} />
      </dl>
      <div className="mt-auto">
        <p className="flex items-center gap-3 rounded-[4px] bg-nation-raised px-4 py-2 text-xs text-nation-muted">
          <Info size={16} aria-hidden className="shrink-0" />
          Mudar o regime, forma de governo e sistema exige um evento político.
        </p>
      </div>
    </NationCard>
  )
}
