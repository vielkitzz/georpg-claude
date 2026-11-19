import { ARCHETYPES } from '@/domain/ideology'
import type { FoundingDraft, FoundingPreview } from '@/domain/founding/draft'
import { SymbolImages } from './Fields'

export function Revelation({ preview, draft }: { preview: FoundingPreview; draft: FoundingDraft }) {
  const number = (value: number) => value.toLocaleString('pt-BR')
  const stats = [
    ['População inicial', number(preview.population)],
    ['Ano de fundação', String(preview.year)],
    ['PIB inicial', `${number(preview.gdp)} ${draft.currencyCode}`],
    ['Aprovação inicial', `${preview.approval}%`],
    ['Legitimidade inicial', `${preview.legitimacy}/100`],
    ['Ministérios', number(preview.ministries)],
    ['Câmaras legislativas', number(preview.chambers)],
    ['Ideologia governante', ARCHETYPES.find((entry) => entry.id === draft.ideology)?.name],
  ]
  return (
    <div className="space-y-6">
      <div
        className="founding-reveal rounded-xl border border-line px-4 py-8 text-center"
        style={{ borderTop: `4px solid ${draft.symbols.color}` }}
      >
        {(draft.symbols.flag || draft.symbols.coatOfArms) && <SymbolImages {...draft.symbols} />}
        <h3 className="title mt-4 break-words text-4xl sm:text-6xl">{preview.officialName}</h3>
        <p className="mt-3 text-muted">
          {draft.capital.trim()} · Território {draft.territoryId}
        </p>
      </div>
      <dl className="grid gap-2 sm:grid-cols-2">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-bg p-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="subtitle mt-1">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
