import { useQuery } from '@tanstack/react-query'
import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { getWorldMap, type Territory } from '@/data/gauzoland'
import { myNationProfileQuery } from '@/data/get-my-nation-profile'
import { useTerritoryClaims } from '@/data/hooks'
import { LABELS } from '@/domain/founding/options'
import { nationOverview } from '@/lib/nation-overview'
import type { NationProfile } from '@/types/nation-profile'
import { EmptySection } from '@/ui/NationPage'
import './nation-profile.css'

type Overview = ReturnType<typeof nationOverview>
const unavailable = 'Disponível quando o tick diário estiver ativo'
const panel = 'profile-panel min-w-0 rounded-lg border border-line bg-panel p-4 sm:p-5'
const link =
  'inline-flex min-h-11 items-center text-sm font-semibold text-secondary underline underline-offset-4'

function Section({
  title,
  children,
  className = '',
  label,
}: {
  title: string
  children: ReactNode
  className?: string
  label?: string
}) {
  const id = useId()
  return (
    <section className={`${panel} ${className}`} aria-labelledby={id}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="title-semi text-2xl">
          {title}
        </h2>
        {label && <span className="text-xs font-semibold uppercase text-secondary">{label}</span>}
      </div>
      {children}
    </section>
  )
}

function secureUrl(raw: string) {
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}

function SymbolImage({ value, name, width }: { value: string; name: string; width: number }) {
  const src = secureUrl(value)
  const [failed, setFailed] = useState<string | null>(null)
  return (
    <div
      className="grid h-28 max-w-full shrink-0 place-items-center overflow-hidden rounded-md border border-dashed border-line text-xs text-muted"
      style={{ width }}
    >
      {src && src !== failed ? (
        <img
          src={src}
          alt={name}
          width={width}
          height={112}
          className="size-full object-contain"
          referrerPolicy="no-referrer"
          onError={() => setFailed(src)}
        />
      ) : (
        name
      )}
    </div>
  )
}

const readable = <T extends string>(labels: Record<T, string>, value: T | null) =>
  value ? labels[value] : ''
const soon = (name: string) => (
  <span
    role="link"
    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted"
    aria-disabled="true"
  >
    {name} <span className="text-xs">(em breve)</span>
  </span>
)

export function ProfileHeader({
  profile,
  color,
  ideology,
}: {
  profile: NationProfile
  color: string | null
  ideology: string | null
}) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className={`${panel} profile-identity panel-mark flex flex-wrap items-center gap-6`}
    >
      <div className="flex max-w-full flex-wrap gap-2">
        <SymbolImage value={profile.symbols.flag} name="Bandeira" width={168} />
        <SymbolImage value={profile.symbols.coatOfArms} name="Brasão" width={96} />
      </div>
      <div className="min-w-0 flex-[1_1_16rem]">
        <p className="text-[10px] font-semibold tracking-wider text-secondary uppercase">
          {[
            profile.foundedYear !== null && `Fundada em ${profile.foundedYear}`,
            profile.territoryId !== null && `Território nº ${profile.territoryId}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <h1 className="title mt-1 text-[40px] wrap-anywhere">
          {profile.officialName || 'Nação sem nome registrado'}
        </h1>
        <h2 id={id} className="sr-only">
          Quem sou
        </h2>
        {profile.motto && <p className="mt-1 text-sm text-muted">“{profile.motto}”</p>}
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {[
            readable(LABELS.regime, profile.politics.regime),
            readable(LABELS.stateForm, profile.politics.stateForm),
            ideology,
          ]
            .filter(Boolean)
            .map((tag) => (
              <span key={tag} className="rounded-sm border border-line bg-bg/40 px-2 py-1">
                {tag}
              </span>
            ))}
          {color && (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-bg/40 px-2 py-1">
              <span
                className="size-3 rounded-xs border border-line"
                style={{ background: color }}
                aria-hidden
              />
              Cor nacional
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:flex-col">
        <button
          type="button"
          disabled
          className="min-h-11 rounded-md border border-line px-3 text-sm text-muted"
        >
          Editar símbolos <span className="text-xs">(em breve)</span>
        </button>
        {soon('Renomear divisões')}
      </div>
    </section>
  )
}

function tone(value: number) {
  if (value >= 60) return { className: 'text-positive', description: 'boa' }
  if (value >= 40) return { className: 'text-warning', description: 'atenção' }
  return { className: 'text-primary-text', description: 'crítica' }
}

export function ProfileStats({
  legitimacy,
  approval,
}: {
  legitimacy: number | null
  approval: number | null
}) {
  const id = useId()
  const cards = [
    { title: 'Legitimidade', value: legitimacy, suffix: '', href: '/governo' },
    { title: 'Aprovação do governo', value: approval, suffix: '%', href: '/governo' },
    { title: 'Estabilidade', value: null },
    { title: 'Capital político hoje', value: null },
  ]
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="title-semi mb-3 text-2xl">
        Como estou
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, suffix, href }) => {
          const status = value === null ? null : tone(value)
          return (
            <div
              key={title}
              className={`${panel} profile-stat flex flex-col ${href ? '' : 'text-muted'}`}
            >
              <p className="text-xs font-semibold tracking-wide uppercase">
                {title}
                {!href && <span className="ml-2 normal-case">· em breve</span>}
              </p>
              <p
                className={`subtitle mt-2 text-[32px] leading-tight ${status?.className ?? 'text-muted'}`}
              >
                {value === null ? '—' : `${value.toLocaleString('pt-BR')}${suffix}`}
              </p>
              {href ? (
                <Link
                  to={href}
                  className={`${link} mt-auto gap-1`}
                  aria-label={`${status?.description ?? 'Sem registro'}. Ver ${title.toLocaleLowerCase('pt-BR')} em Governo`}
                >
                  {status?.description ?? 'Sem registro'} <span aria-hidden>· Governo →</span>
                </Link>
              ) : (
                <p className="mt-2 text-xs">{unavailable}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function DiplomaticSheet({
  profile,
  territory,
}: {
  profile: NationProfile
  territory?: Territory
}) {
  const { politics, symbols } = profile
  const person = (head: typeof politics.headOfState) => (head ? `${head.title}: ${head.name}` : '')
  const facts = [
    [
      'Território',
      profile.territoryId === null
        ? ''
        : `Nº ${profile.territoryId}${territory ? ` · ${territory.provinceIds.length} províncias` : ''}`,
    ],
    ['Capital', profile.capital],
    [
      'Moeda',
      profile.currency.name && profile.currency.code
        ? `${profile.currency.name} (${profile.currency.code})`
        : profile.currency.name || profile.currency.code,
    ],
    ['Forma de governo', readable(LABELS.governmentForm, politics.governmentForm)],
    ['Regime', readable(LABELS.regime, politics.regime)],
    ['Sistema de governo', readable(LABELS.system, politics.system)],
    ['Forma de Estado', readable(LABELS.stateForm, politics.stateForm)],
    [
      'Divisões',
      [symbols.subdivisionNames.firstLevel, symbols.subdivisionNames.secondLevel]
        .filter(Boolean)
        .join(' / '),
    ],
    ['Governantes locais', readable(LABELS.localSelection, symbols.localGovernorSelection)],
    ['Chefe de Estado', person(politics.headOfState)],
    ...(politics.headOfGovernment ? [['Chefe de Governo', person(politics.headOfGovernment)]] : []),
    ['Acesso ao cargo', readable(LABELS.leadershipBasis, politics.leadershipBasis)],
  ]
  return (
    <Section title="Ficha diplomática" label="Oficial" className="profile-facts flex-[2_1_520px]">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map(([term, value]) => (
          <div className="min-w-0 border-b border-line pb-2" key={term}>
            <dt className="text-xs text-muted">{term}</dt>
            <dd className="mt-1 text-sm wrap-anywhere">{value || '—'}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted">
        Mudar regime, forma de governo ou sistema exige um evento político, não uma edição.
      </p>
      <Link className={link} to="/governo">
        Consultar Governo →
      </Link>
    </Section>
  )
}

export function AlertCard({
  severidade,
  area,
  titulo,
  motivo,
  href,
}: {
  severidade: 'urgente' | 'atencao'
  area: string
  titulo: string
  motivo: string
  href: string
}) {
  const urgent = severidade === 'urgente'
  return (
    <article className="rounded-md border border-line bg-bg/40 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span
          className={`inline-flex items-center gap-2 font-semibold ${urgent ? 'text-primary-text' : 'text-warning'}`}
        >
          <span aria-hidden className="size-2 rounded-full bg-current" />
          {urgent ? 'Urgente' : 'Atenção'}
        </span>
        {area}
      </div>
      <h3>
        <Link to={href} className={link}>
          {titulo}
        </Link>
      </h3>
      <p className="text-sm text-muted">{motivo}</p>
    </article>
  )
}

function territoryViewBox(path: string) {
  // Os caminhos do gerador de mapa são pares absolutos M/L, fechados com Z.
  const points = Array.from(
    path.matchAll(/(?:M|L)(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g),
    (match) => [Number(match[1]), Number(match[2])],
  )
  if (!points.length) return null
  const limits = points.reduce(
    ([minX, minY, maxX, maxY], [x, y]) => [
      Math.min(minX, x),
      Math.min(minY, y),
      Math.max(maxX, x),
      Math.max(maxY, y),
    ],
    [Infinity, Infinity, -Infinity, -Infinity],
  )
  const [minX, minY, maxX, maxY] = limits
  const margin = Math.max(5, Math.max(maxX - minX, maxY - minY) * 0.12)
  return [minX - margin, minY - margin, maxX - minX + margin * 2, maxY - minY + margin * 2].join(
    ' ',
  )
}

function TerritoryPanel({
  profile,
  territory,
  color,
}: {
  profile: NationProfile
  territory?: Territory
  color: string | null
}) {
  const map = getWorldMap()
  const box = territory && territoryViewBox(territory.d)
  return (
    <Section title="Território" className="profile-visual flex-[1_1_400px]">
      {territory && box ? (
        <>
          <svg
            role="img"
            aria-label={`Mapa do território nº ${territory.id}`}
            viewBox={box}
            className="h-44 w-full rounded-md border border-line bg-[#071C2A]"
          >
            {map.states
              .filter((state) => state.id !== territory.id)
              .map((state) => (
                <path key={state.id} d={state.d} fill="#132134" fillRule="evenodd" />
              ))}
            <path
              d={territory.d}
              fill={color ?? '#132134'}
              stroke="#FEFBEE"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              fillRule="evenodd"
            />
          </svg>
          <p className="mt-3 text-sm text-muted">
            Território nº {territory.id} · {territory.provinceIds.length} províncias · burgos sem
            dados.
            {profile.capital && ` Capital: ${profile.capital}`}
          </p>
        </>
      ) : (
        <EmptySection>A geografia deste território não está registrada no mapa.</EmptySection>
      )}
      <Link className={link} to="/mapa">
        Abrir no Mapa mundial →
      </Link>
    </Section>
  )
}

function IdeologyPanel({ overview }: { overview: Overview }) {
  return (
    <Section title="Perfil ideológico" className="profile-visual flex-[1_1_400px]">
      <div className="flex flex-wrap items-center gap-4">
        {overview.compass && (
          <svg
            width="160"
            height="160"
            viewBox="0 0 160 160"
            role="img"
            aria-label={`Bússola ideológica: economia ${overview.compass.x}, autoridade ${overview.compass.y}`}
            className="max-w-full rounded-md border border-line bg-bg/60"
          >
            <path d="M12 80H148M80 12V148" stroke="var(--muted)" strokeOpacity=".5" />
            <circle
              r="5"
              cx={12 + 1.36 * overview.compass.x}
              cy={148 - 1.36 * overview.compass.y}
              fill="var(--primary-text)"
            />
          </svg>
        )}
        <div className="min-w-0 flex-[1_1_9rem]">
          <p className="text-xs text-muted">Ideologia governante</p>
          <p className="subtitle mt-1">{overview.ideology ?? '—'}</p>
          {overview.portrait && <p className="mt-2 text-sm text-muted">{overview.portrait}</p>}
        </div>
      </div>
      {overview.axes.length ? (
        <>
          <ul className="mt-4 grid gap-2">
            {overview.axes.map((axis) => (
              <li key={axis.id}>
                <div className="flex justify-between gap-2 text-xs">
                  <span>{axis.label}</span>
                  <span>{axis.value.toLocaleString('pt-BR')}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised" aria-hidden>
                  <div className="h-full bg-primary" style={{ width: `${axis.value}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Os 4 eixos mais marcantes de 12.</p>
        </>
      ) : (
        <div className="mt-4">
          <EmptySection>O perfil ideológico ainda não tem eixos registrados.</EmptySection>
        </div>
      )}
    </Section>
  )
}

function recentEventType(type: string) {
  return type === 'fundacao' ? 'Fundação' : type.replaceAll('_', ' ').replaceAll('-', ' ')
}

function NationDashboard({ profile }: { profile: NationProfile }) {
  const [asOf] = useState(() => new Date())
  const overview = nationOverview(profile, asOf)
  const territory = getWorldMap().states.find((item) => item.id === profile.territoryId)
  const claims = useTerritoryClaims()
  const claim =
    claims.status === 'ready'
      ? claims.data.find(
          (item) => item.nationId === profile.id && item.territoryId === profile.territoryId,
        )
      : null
  const claimColor = claim && /^#[a-f\d]{6}$/i.test(claim.color) ? claim.color : null
  const color = profile.symbols.nationalColor ?? claimColor
  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <ProfileHeader profile={profile} color={color} ideology={overview.ideology} />
      <ProfileStats legitimacy={overview.legitimacy} approval={overview.approval} />
      <div className="flex flex-wrap gap-6">
        <DiplomaticSheet profile={profile} territory={territory} />
        <Section title="Exige atenção" className="profile-sheet flex-[1_1_300px]">
          <EmptySection>
            Os alertas passam a aparecer quando as ordens e o tick diário estiverem ativos.
          </EmptySection>
        </Section>
      </div>
      <div className="flex flex-wrap gap-6">
        <TerritoryPanel profile={profile} territory={territory} color={color} />
        <IdeologyPanel overview={overview} />
      </div>
      <Section title="Últimos acontecimentos" className="profile-events">
        {overview.events.length ? (
          <ul className="divide-y divide-line">
            {overview.events.map((event, index) => (
              <li
                key={`${event.tickIndex}-${event.title}-${index}`}
                className="grid items-start gap-2 py-3 sm:grid-cols-[9rem_1fr_auto]"
              >
                <span className="text-xs text-muted">{event.date}</span>
                <span className="subtitle text-sm wrap-anywhere">{event.title}</span>
                <span className="w-fit rounded-sm border border-line px-2 py-1 text-xs text-secondary">
                  {recentEventType(event.type)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptySection>Não há acontecimentos registrados.</EmptySection>
        )}
        <div className="mt-2">{soon('Ver todo o histórico →')}</div>
      </Section>
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`${panel} ${className} motion-safe:animate-pulse`}>
      <div className="mb-5 h-4 w-24 rounded bg-raised" />
      <div className="h-3 w-3/4 rounded bg-raised" />
    </div>
  )
}

export function ProfileLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6" role="status" aria-label="Carregando sua nação">
      <div aria-hidden className="grid gap-6">
        <Skeleton className="profile-identity" />
        <div>
          <div className="mb-3 h-7 w-36 rounded bg-raised" />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {['L', 'A', 'E', 'C'].map((key) => (
              <Skeleton key={key} className="profile-stat" />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <Skeleton className="profile-facts flex-[2_1_520px]" />
          <Skeleton className="profile-sheet flex-[1_1_300px]" />
        </div>
        <div className="flex flex-wrap gap-6">
          <Skeleton className="profile-visual flex-[1_1_400px]" />
          <Skeleton className="profile-visual flex-[1_1_400px]" />
        </div>
        <Skeleton className="profile-events" />
      </div>
    </div>
  )
}

export function ProfileError({ retry }: { retry: () => void }) {
  return (
    <section className={panel} role="alert" aria-labelledby="profile-error">
      <h2 id="profile-error" className="title-semi text-2xl">
        Não foi possível carregar sua nação
      </h2>
      <button
        type="button"
        onClick={retry}
        className="mt-3 min-h-11 rounded-md border border-line px-3 text-sm font-semibold hover:bg-raised"
      >
        Tentar de novo
      </button>
    </section>
  )
}

export function DashboardPage() {
  const query = useQuery(myNationProfileQuery)
  if (query.isPending) return <ProfileLoading />
  if (query.isError) return <ProfileError retry={() => void query.refetch()} />
  return query.data ? <NationDashboard profile={query.data} /> : null
}
