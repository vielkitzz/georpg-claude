import { Crown, Flag, Flame, Landmark, Shield, Users, type LucideIcon } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import tagIcons from '@/assets/nation-tag-icons.svg?no-inline'
import { LABELS } from '@/domain/founding/options'
import type { ArchetypeId } from '@/domain/ideology/archetypes'
import { formatFounded, splitOfficialName } from '@/domain/nationView'
import type { Nation } from '@/domain/types'

type TagStyle = { icon: string | LucideIcon; color: string }

const theocracyTag = { icon: 'teocracia', color: '#E6D28A' }
const formTags = new Map<string, TagStyle>([
  [LABELS.governmentForm.republica, { icon: 'republica', color: '#1FB5A8' }],
  [LABELS.governmentForm.monarquia, { icon: 'monarquia', color: '#BF4AFF' }],
  [LABELS.governmentForm.teocracia, theocracyTag],
])
const ideologyTags: Partial<Record<ArchetypeId, TagStyle>> = {
  liberal_classico: { icon: 'liberal-classico', color: '#F5A524' },
  conservador: { icon: 'conservador', color: '#368BFF' },
  social_democrata: { icon: 'social-democrata', color: '#FF4268' },
  socialista_revolucionario: { icon: 'socialista', color: '#E54C35' },
  nacionalista_autoritario: { icon: 'nacionalista-autoritario', color: '#A6A6B8' },
  teocrata: theocracyTag,
}
const defaultIdeologyTag = { icon: Flame, color: '#F5A524' }
const SYMBOL_HEIGHT = 116

type SymbolSize = { source: string; ratio: number }

function Chip({ icon: Icon, color, children }: TagStyle & { children: string }) {
  return (
    <span
      className="nation-tag inline-flex min-h-7 items-center gap-2 rounded-[4px] px-2.5 text-xs"
      style={{ '--tag-color': color } as CSSProperties}
    >
      {typeof Icon === 'string' ? (
        <svg aria-hidden className="size-3.5 shrink-0 fill-current">
          <use href={`${tagIcons}#${Icon}`} width="14" height="14" />
        </svg>
      ) : (
        <Icon size={14} aria-hidden className="shrink-0" />
      )}
      {children}
    </span>
  )
}

function formIcon(form: string): LucideIcon {
  const text = form.toLowerCase()
  return text.includes('monarquia') ? Crown : Landmark
}

function Symbol({
  src,
  label,
  fallback: Fallback,
  ratio,
  onSize,
}: {
  src?: string
  label: string
  fallback: LucideIcon
  ratio: number
  onSize: (size: SymbolSize) => void
}) {
  const [failedSource, setFailedSource] = useState<string>()
  return (
    <figure className="m-0 flex min-w-0 flex-col items-center gap-3">
      <div className="relative w-full" style={{ aspectRatio: ratio }}>
        {src && src !== failedSource ? (
          <img
            src={src}
            alt={label}
            onError={() => setFailedSource(src)}
            onLoad={({ currentTarget: { naturalWidth, naturalHeight } }) => {
              if (naturalWidth && naturalHeight) {
                onSize({ source: src, ratio: naturalWidth / naturalHeight })
              }
            }}
            className="absolute inset-0 size-full object-contain"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center rounded-[2px] border border-dashed border-nation-line text-nation-subtle">
            <Fallback size={28} aria-hidden />
            <span className="sr-only">{label} indisponível</span>
          </span>
        )}
      </div>
      <figcaption className="text-center text-[10px] tracking-[0.18em] text-nation-muted uppercase">
        {label}
      </figcaption>
    </figure>
  )
}

/** Cabeçalho da nação: bandeira, brasão, nome oficial, lema e as três marcas do governo. */
export function NationHero({ nation, ideologyName }: { nation: Nation; ideologyName?: string }) {
  const [flagSize, setFlagSize] = useState<SymbolSize>()
  const [coatSize, setCoatSize] = useState<SymbolSize>()
  const { flag, coatOfArms } = nation.symbols
  const flagRatio = flagSize && flagSize.source === flag ? flagSize.ratio : 164 / SYMBOL_HEIGHT
  const coatRatio =
    coatSize && coatSize.source === coatOfArms ? coatSize.ratio : 121 / SYMBOL_HEIGHT
  const { prefix, core } = splitOfficialName(nation.officialName, nation.shortName)
  const color = nation.nationalColor
  const form = nation.government.form
  const formTag = formTags.get(form) ?? { icon: formIcon(form), color: '#BF4AFF' }
  const ideologyTag = (nation.ideology && ideologyTags[nation.ideology]) || defaultIdeologyTag
  return (
    <section
      aria-label="Identidade da nação"
      className="relative overflow-hidden rounded-lg bg-nation-panel"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background: `linear-gradient(to bottom left, #fff 0%, transparent 50%, ${color} 100%)`,
        }}
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />

      <div className="relative flex flex-col gap-8 p-6 @min-[860px]:flex-row">
        <div className="min-w-0 @min-[860px]:shrink-0">
          <p className="text-[10px] tracking-[0.18em] text-nation-subtle uppercase">
            Símbolos nacionais
          </p>
          <div
            className="mt-5 grid max-w-[min(100%,305px)] items-start gap-5"
            style={{
              width: `calc(${SYMBOL_HEIGHT * (flagRatio + coatRatio)}px + 1.25rem)`,
              gridTemplateColumns: `minmax(0, ${flagRatio}fr) minmax(0, ${coatRatio}fr)`,
            }}
          >
            <Symbol
              src={flag}
              label="Bandeira"
              fallback={Flag}
              ratio={flagRatio}
              onSize={setFlagSize}
            />
            <Symbol
              src={coatOfArms}
              label="Brasão de armas"
              fallback={Shield}
              ratio={coatRatio}
              onSize={setCoatSize}
            />
          </div>
        </div>

        <div
          aria-hidden
          className="hidden h-44 w-px shrink-0 self-center bg-nation-line @min-[860px]:block"
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[13px] text-nation-muted">
            {formatFounded(nation.foundedYear, nation.foundedMonth, nation.foundedDay)}
          </p>
          <h2
            aria-label={nation.officialName}
            className="mt-3 font-title text-[clamp(1.75rem,4cqw,2.75rem)] leading-none wrap-anywhere text-nation-text uppercase"
          >
            {prefix && <span style={{ fontWeight: 400 }}>{prefix}</span>}
            <span style={{ fontWeight: 700 }}>{core}</span>
          </h2>
          {nation.motto && (
            <p className="mt-2 font-script text-[28px] leading-9 text-nation-subtle">
              “{nation.motto}”
            </p>
          )}
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            <Chip {...formTag}>{form}</Chip>
            {ideologyName && <Chip {...ideologyTag}>{ideologyName}</Chip>}
            <Chip icon={Users} color="#A78BFA">
              {nation.government.system}
            </Chip>
          </div>
        </div>
      </div>
    </section>
  )
}
