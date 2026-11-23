import { Crown, Flag, Flame, Landmark, Shield, Users, type LucideIcon } from 'lucide-react'
import { formatFounded, splitOfficialName } from '@/domain/nationView'
import type { Nation } from '@/domain/types'

function Chip({
  icon: Icon,
  color,
  children,
}: {
  icon: LucideIcon
  color: string
  children: string
}) {
  return (
    <span
      className="inline-flex h-7 items-center gap-2 rounded-[4px] px-2.5 text-xs"
      style={{ color, background: `color-mix(in srgb, ${color} 25%, var(--n-chip))` }}
    >
      <Icon size={14} aria-hidden />
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
  className,
}: {
  src?: string
  label: string
  fallback: LucideIcon
  className: string
}) {
  return (
    <figure className="m-0 flex flex-col items-center gap-3">
      <div className={`grid h-[116px] place-items-center ${className}`}>
        {src ? (
          <img src={src} alt={label} className="size-full object-contain" />
        ) : (
          <span className="grid size-full place-items-center rounded-[2px] border border-dashed border-nation-line text-nation-subtle">
            <Fallback size={28} aria-hidden />
            <span className="sr-only">{label} ainda não definida</span>
          </span>
        )}
      </div>
      <figcaption className="text-[10px] tracking-[0.18em] text-nation-muted uppercase">
        {label}
      </figcaption>
    </figure>
  )
}

/** Cabeçalho da nação: bandeira, brasão, nome oficial, lema e as três marcas do governo. */
export function NationHero({ nation, ideologyName }: { nation: Nation; ideologyName?: string }) {
  const { prefix, core } = splitOfficialName(nation.officialName, nation.shortName)
  const color = nation.nationalColor
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

      <div className="relative flex flex-col gap-8 px-7 pt-8 pb-9 @min-[860px]:flex-row">
        <div className="shrink-0">
          <p className="text-[10px] tracking-[0.18em] text-nation-subtle uppercase">
            Símbolos nacionais
          </p>
          <div className="mt-6 flex items-start gap-5">
            <Symbol
              src={nation.symbols.flag}
              label="Bandeira"
              fallback={Flag}
              className="w-[164px]"
            />
            <Symbol
              src={nation.symbols.coatOfArms}
              label="Brasão de armas"
              fallback={Shield}
              className="w-[121px]"
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
            className="mt-3 font-title text-[clamp(2.5rem,6cqw,4.25rem)] leading-none text-nation-text uppercase"
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
            <Chip icon={formIcon(nation.government.form)} color="#BF4AFF">
              {nation.government.form}
            </Chip>
            {ideologyName && (
              <Chip icon={Flame} color="#F5A524">
                {ideologyName}
              </Chip>
            )}
            <Chip icon={Users} color="#A78BFA">
              {nation.government.system}
            </Chip>
          </div>
        </div>
      </div>
    </section>
  )
}
