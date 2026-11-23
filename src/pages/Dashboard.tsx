import { useQuery } from '@tanstack/react-query'
import { Clock, ExternalLink, Info } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { getWorldMap, type Territory } from '@/data/gauzoland'
import { myNationProfileQuery } from '@/data/get-my-nation-profile'
import { useNation, useTerritoryClaims } from '@/data/hooks'
import { LABELS } from '@/domain/founding/options'
import { nationOverview } from '@/lib/nation-overview'
import type { NationProfile } from '@/types/nation-profile'
import { EmptySection } from '@/ui/NationPage'
import {
  ProfileHeader,
  ProfileNavigation,
  ProfileSection,
  ProfileStats,
  profileLink,
  profilePanel,
  type ProfileTab,
} from './nation-profile-components'
import './nation-profile.css'

type Overview = ReturnType<typeof nationOverview>
const readable = <T extends string>(labels: Record<T, string>, value: T | null) =>
  value ? labels[value] : ''

export function DiplomaticSheet({
  profile,
  territory,
  population,
}: {
  profile: NationProfile
  territory?: Territory
  population?: number | null
}) {
  const { politics, symbols } = profile
  const person = (head: typeof politics.headOfState) => (head ? `${head.title}: ${head.name}` : '')
  const columns = [
    [
      ['Nome oficial', profile.officialName],
      ['Capital', profile.capital],
      ['População', population == null ? '' : `${population.toLocaleString('pt-BR')} hab.`],
      ['Território', profile.territoryId === null ? '' : `Nº ${profile.territoryId}`],
      ['Cor nacional', symbols.nationalColor ?? ''],
    ],
    [
      ['Forma de governo', readable(LABELS.governmentForm, politics.governmentForm)],
      ['Regime', readable(LABELS.regime, politics.regime)],
      ['Sistema de governo', readable(LABELS.system, politics.system)],
      ['Forma de Estado', readable(LABELS.stateForm, politics.stateForm)],
      ['Chefe de Estado', person(politics.headOfState)],
      ...(politics.headOfGovernment
        ? [['Chefe de Governo', person(politics.headOfGovernment)]]
        : []),
    ],
    [
      [
        'Moeda',
        profile.currency.name && profile.currency.code
          ? `${profile.currency.name} (${profile.currency.code})`
          : profile.currency.name || profile.currency.code,
      ],
      [
        'Divisões',
        [symbols.subdivisionNames.firstLevel, symbols.subdivisionNames.secondLevel]
          .filter(Boolean)
          .join(' / '),
      ],
      ['Províncias no mapa', territory?.provinceIds.length.toLocaleString('pt-BR') ?? ''],
      ['Governantes locais', readable(LABELS.localSelection, symbols.localGovernorSelection)],
      ['Acesso ao cargo', readable(LABELS.leadershipBasis, politics.leadershipBasis)],
    ],
  ]
  return (
    <ProfileSection title="Informações básicas" className="profile-facts">
      <div className="profile-facts-grid">
        {columns.map((facts) => (
          <dl key={facts[0][0]}>
            {facts.map(([term, value]) => (
              <div className="min-w-0" key={term}>
                <dt className="text-xs text-muted">{term}</dt>
                <dd className="mt-1 text-sm wrap-anywhere">{value || 'Sem registro'}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
      <p className="profile-facts-note">
        <Info size={16} aria-hidden="true" />
        Mudar regime, forma de governo ou sistema exige um evento político.
      </p>
      <Link className={profileLink} to="/governo">
        Consultar Governo →
      </Link>
    </ProfileSection>
  )
}

function AttentionPanel() {
  return (
    <ProfileSection title="Exige atenção" className="profile-attention">
      <div className="profile-attention-empty">
        <span>
          <Clock size={25} aria-hidden="true" />
        </span>
        <p className="subtitle">Alertas nacionais</p>
        <p className="text-xs text-muted">
          Os alertas passam a aparecer quando as ordens e o tick diário estiverem ativos.
        </p>
      </div>
    </ProfileSection>
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
    <article className="rounded-md bg-bg/40 p-3">
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
        <Link to={href} className={profileLink}>
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
  const width = maxX - minX + 2 * margin
  const height = Math.max(maxY - minY + 2 * margin, width / 2.28)
  const framedWidth = height * 2.28
  return [(minX + maxX - framedWidth) / 2, (minY + maxY - height) / 2, framedWidth, height].join(
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
    <ProfileSection title="Território nacional" description="Sua presença no mundo de Erda.">
      {territory && box ? (
        <>
          <figure className="profile-map">
            <svg
              role="img"
              aria-label={`Mapa do território nº ${territory.id}`}
              viewBox={box}
              preserveAspectRatio="xMidYMid slice"
            >
              {map.states.map((state) => (
                <path
                  key={state.id}
                  d={state.d}
                  fill="var(--profile-map)"
                  stroke="var(--profile-map-line)"
                  vectorEffect="non-scaling-stroke"
                  fillRule="evenodd"
                />
              ))}
              <path
                d={territory.d}
                fill={color ?? 'var(--profile-accent)'}
                stroke="var(--profile-map-line)"
                vectorEffect="non-scaling-stroke"
                fillRule="evenodd"
              />
            </svg>
            <figcaption>
              <span
                aria-hidden="true"
                style={{ backgroundColor: color ?? 'var(--profile-accent)' }}
              />
              {profile.shortName || profile.officialName || `Território nº ${territory.id}`}
            </figcaption>
          </figure>
          <p className="mt-3 text-xs text-muted">
            Território nº {territory.id} · {territory.provinceIds.length.toLocaleString('pt-BR')}{' '}
            províncias
            {profile.capital && ` · Capital: ${profile.capital}`}
          </p>
        </>
      ) : (
        <EmptySection>A geografia deste território não está registrada no mapa.</EmptySection>
      )}
      <Link className={profileLink} to="/mapa-mundial">
        Mapa mundial <ExternalLink size={14} aria-hidden="true" />
      </Link>
    </ProfileSection>
  )
}

function IdeologyCompass({ x, y }: { x: number; y: number }) {
  return (
    <svg
      viewBox="0 0 224 250"
      role="img"
      aria-label={`Bússola ideológica. Economia ${x.toLocaleString('pt-BR')} de 100, do Estado ao mercado. Autoridade ${y.toLocaleString('pt-BR')} de 100, da liberdade à autoridade.`}
      className="profile-compass"
    >
      <rect x="22" y="27" width="180" height="180" fill="var(--profile-raised)" />
      <rect x="112" y="27" width="90" height="90" fill="var(--profile-compass-warm)" />
      <rect x="22" y="117" width="90" height="90" fill="var(--profile-compass-cool)" />
      <path
        d="M22 27H202V207H22ZM52 27V207M82 27V207M142 27V207M172 27V207M22 57H202M22 87H202M22 147H202M22 177H202"
        fill="none"
        stroke="var(--line)"
      />
      <path d="M112 27V207M22 117H202" stroke="var(--muted)" opacity=".5" />
      <circle
        cx={22 + 1.8 * x}
        cy={207 - 1.8 * y}
        r="8"
        fill="var(--primary)"
        stroke="var(--fg)"
        strokeWidth="2"
      />
      <g aria-hidden="true" fill="var(--muted)" fontSize="8">
        <text x="112" y="13" textAnchor="middle">
          AUTORIDADE
        </text>
        <text x="22" y="225">
          ESTADO
        </text>
        <text x="202" y="225" textAnchor="end">
          MERCADO
        </text>
        <text x="112" y="246" textAnchor="middle">
          LIBERDADE
        </text>
      </g>
    </svg>
  )
}

function IdeologyPanel({ overview }: { overview: Overview }) {
  return (
    <ProfileSection title="Retrato ideológico" description="A orientação que guia o seu governo.">
      <div className="profile-ideology">
        {overview.compass && <IdeologyCompass {...overview.compass} />}
        <div className="min-w-0">
          <p className="profile-ideology-label">Ideologia governante</p>
          <p className="subtitle mt-2 text-xl wrap-anywhere">
            {overview.ideology ?? 'Sem registro'}
          </p>
          {overview.portrait && <p className="mt-2 text-xs text-muted">{overview.portrait}</p>}
          {overview.axes.length ? (
            <ul className="profile-axes mt-5 grid gap-3">
              {overview.axes.map((axis) => (
                <li key={axis.id}>
                  <div className="flex justify-between gap-2 text-xs">
                    <span className="text-muted">{axis.label}</span>
                    <span>{axis.value.toLocaleString('pt-BR')}%</span>
                  </div>
                  <div className="profile-axis" aria-hidden="true">
                    <div style={{ width: `${axis.value}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptySection>O perfil ideológico ainda não tem eixos registrados.</EmptySection>
            </div>
          )}
        </div>
      </div>
    </ProfileSection>
  )
}

function recentEventType(type: string) {
  return type === 'fundacao' ? 'Fundação' : type.replaceAll('_', ' ').replaceAll('-', ' ')
}

function RecentEvents({ events }: { events: Overview['events'] }) {
  return (
    <ProfileSection title="Últimos acontecimentos">
      {events.length ? (
        <ul className="divide-y divide-line">
          {events.map((event, index) => (
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
      <Link to="/historico" className={profileLink}>
        Ver histórico →
      </Link>
    </ProfileSection>
  )
}

function NationDashboard({ profile }: { profile: NationProfile }) {
  const [asOf] = useState(() => new Date())
  const [params] = useSearchParams()
  const overview = nationOverview(profile, asOf)
  const territory = getWorldMap().states.find((item) => item.id === profile.territoryId)
  const nation = useNation()
  const data = nation.status === 'ready' && nation.data?.id === profile.id ? nation.data : null
  const claims = useTerritoryClaims()
  const claim =
    claims.status === 'ready'
      ? claims.data.find(
          (item) => item.nationId === profile.id && item.territoryId === profile.territoryId,
        )
      : null
  const claimColor = claim && /^#[a-f\d]{6}$/i.test(claim.color) ? claim.color : null
  const color = profile.symbols.nationalColor ?? claimColor
  const stats = {
    legitimacy: overview.legitimacy,
    approval: overview.approval,
    approvalHistory: data?.approvalHistory,
    indicators: data?.indicators,
  }
  const facts = (
    <DiplomaticSheet profile={profile} territory={territory} population={data?.population} />
  )
  const geography = <TerritoryPanel profile={profile} territory={territory} color={color} />
  const ideology = <IdeologyPanel overview={overview} />
  const events = <RecentEvents events={overview.events} />
  const views = {
    indicadores: <ProfileStats {...stats} />,
    informacoes: facts,
    territorio: geography,
    ideologia: ideology,
    acontecimentos: events,
    '': (
      <>
        <ProfileStats {...stats} />
        <div className="profile-facts-row">
          {facts}
          <AttentionPanel />
        </div>
        <div className="profile-visuals-row">
          {geography}
          {ideology}
        </div>
        {events}
      </>
    ),
  } satisfies Record<ProfileTab, React.ReactNode>
  const selected = params.get('aba') ?? ''
  const active = Object.hasOwn(views, selected) ? (selected as ProfileTab) : ''

  return (
    <div className="nation-profile">
      <div className="profile-page-heading">
        <p className="title">Nação</p>
        <p className="mt-1 text-xs text-muted">Seu país, em perspectiva.</p>
      </div>
      <div>
        <ProfileHeader profile={profile} color={color} ideology={overview.ideology} />
        <ProfileNavigation active={active} />
      </div>
      {views[active]}
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`${profilePanel} ${className} motion-safe:animate-pulse`}>
      <div className="mb-5 h-4 w-24 rounded bg-raised" />
      <div className="h-3 w-3/4 rounded bg-raised" />
    </div>
  )
}

export function ProfileLoading() {
  return (
    <div className="nation-profile" role="status" aria-label="Carregando sua nação">
      <div aria-hidden className="grid gap-6">
        <Skeleton />
        <Skeleton className="profile-identity" />
        <div className="profile-indicators profile-indicators-main">
          {['L', 'A', 'E'].map((key) => (
            <Skeleton key={key} className="profile-stat" />
          ))}
        </div>
        <div className="profile-facts-row">
          <Skeleton className="profile-facts" />
          <Skeleton className="profile-attention" />
        </div>
      </div>
    </div>
  )
}

export function ProfileError({ retry }: { retry: () => void }) {
  return (
    <section className={profilePanel} role="alert" aria-labelledby="profile-error">
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
