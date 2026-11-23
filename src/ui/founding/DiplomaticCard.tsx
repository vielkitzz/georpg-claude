import { Landmark } from 'lucide-react'
import { geography } from '@/data/gauzoland'
import { LABELS, requiresHeadOfGovernment, type Leader } from '@/domain/founding/options'
import { ARCHETYPES } from '@/domain/ideology'
import type { FoundingDraft } from '@/domain/founding/draft'

export function DiplomaticCard({
  draft,
  officialName,
  reached,
}: {
  draft: FoundingDraft
  officialName: string
  reached: number
}) {
  const institution = draft.institutions
  const territory = geography.states.find((state) => state.id === draft.territoryId)
  const ideology = ARCHETYPES.find((entry) => entry.id === draft.ideology)
  const leader = (head?: Leader) =>
    head && [head.title.trim(), head.name.trim()].filter(Boolean).join(' · ')
  const rows = [
    ['Território', territory && `Nº ${territory.id} · ${territory.provinceIds.length} províncias`],
    ['Capital', draft.capital.trim()],
    ['Moeda', [draft.currencyName.trim(), draft.currencyCode].filter(Boolean).join(' · ')],
    ['Forma de governo', reached >= 3 && LABELS.governmentForm[institution.governmentForm]],
    ['Regime político', reached >= 4 && LABELS.regime[institution.regime]],
    ['Sistema de governo', reached >= 5 && LABELS.system[institution.system]],
    ['Forma de Estado', reached >= 6 && LABELS.stateForm[institution.stateForm]],
    [
      'Divisões administrativas',
      reached >= 7 && `${institution.firstLevel} · ${institution.secondLevel}`,
    ],
    ['Governantes locais', reached >= 7 && LABELS.localSelection[institution.localSelection]],
    ['Chefia de Estado', leader(institution.headOfState)],
    ...(reached >= 5 && requiresHeadOfGovernment(institution.system)
      ? [['Chefia de Governo', leader(institution.headOfGovernment)]]
      : []),
    ['Ideologia governante', ideology?.name],
  ]
  const content = (
    <>
      <p className="title-semi mt-3 break-words text-3xl">{officialName || 'Nação sem nome'}</p>
      <dl className="mt-5 divide-y divide-line border-y border-line text-sm">
        {rows.map(([label, value]) => (
          <div key={String(label)} className="grid grid-cols-[1fr_1fr] gap-3 py-2.5">
            <dt className="text-muted">{label}</dt>
            <dd className={value ? 'break-words text-right' : 'text-right text-muted'}>
              {value || '—'}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 py-2.5">
          <dt className="text-muted">Cor nacional</dt>
          <dd className="flex items-center gap-2">
            {draft.symbols.color && (
              <span
                aria-hidden
                className="size-4 rounded-full border border-line"
                style={{ backgroundColor: draft.symbols.color }}
              />
            )}
            {draft.symbols.color.toUpperCase() || '—'}
          </dd>
        </div>
      </dl>
    </>
  )
  return (
    <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
      <details className="founding-panel px-4 py-3 lg:hidden">
        <summary className="subtitle cursor-pointer text-secondary">Ficha diplomática</summary>
        {content}
      </details>
      <div className="founding-panel hidden p-5 lg:block">
        <h2 className="subtitle flex items-center gap-2 text-sm text-secondary">
          <Landmark size={18} aria-hidden /> Ficha diplomática
        </h2>
        {content}
      </div>
    </aside>
  )
}
