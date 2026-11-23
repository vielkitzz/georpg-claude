import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronRight,
  Crown,
  Fingerprint,
  Flag,
  Info,
  Landmark,
  Minus,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { formatDelta } from '@/domain/format'
import { LABELS } from '@/domain/founding/options'
import { deltaMood } from '@/domain/indicators'
import type { Indicator } from '@/domain/types'
import type { NationProfile } from '@/types/nation-profile'

export const profilePanel = 'profile-panel min-w-0 rounded-md bg-panel'
export const profileLink = 'profile-link inline-flex min-h-11 items-center gap-1 text-sm'

export function ProfileSection({
  title,
  children,
  className = '',
  action,
  description,
}: {
  title: string
  children: ReactNode
  className?: string
  action?: ReactNode
  description?: string
}) {
  const id = useId()
  return (
    <section className={`${profilePanel} ${className}`} aria-labelledby={id}>
      <div
        className={`profile-section-heading${description ? ' profile-section-heading-open' : ''}`}
      >
        <div>
          <h2 id={id}>{title}</h2>
          {description && <p className="mt-1 text-xs text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

const tabs = [
  { id: '', label: 'Visão geral' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'informacoes', label: 'Informações básicas' },
  { id: 'territorio', label: 'Território' },
  { id: 'ideologia', label: 'Retrato ideológico' },
  { id: 'acontecimentos', label: 'Acontecimentos' },
] as const

export type ProfileTab = (typeof tabs)[number]['id']

export function ProfileNavigation({ active }: { active: ProfileTab }) {
  const [params] = useSearchParams()
  return (
    <nav aria-label="Visões da nação" className="profile-navigation">
      <ul>
        {tabs.map(({ id, label }) => {
          const next = new URLSearchParams(params)
          if (id) next.set('aba', id)
          else next.delete('aba')
          return (
            <li key={id}>
              <Link
                to={{ search: next.toString() }}
                aria-current={active === id ? 'page' : undefined}
                preventScrollReset
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

type TagStyle = { color: string; icon: LucideIcon }

const formTags: Record<NonNullable<NationProfile['politics']['governmentForm']>, TagStyle> = {
  republica: { color: '#1fb5a8', icon: Landmark },
  monarquia: { color: '#bf4aff', icon: Crown },
  teocracia: { color: '#e6d28a', icon: BookOpen },
}

const ideologyTags: Record<NonNullable<NationProfile['politics']['ideology']>, TagStyle> = {
  liberal_classico: { color: '#f5a524', icon: Fingerprint },
  conservador: { color: '#368bff', icon: Landmark },
  social_democrata: { color: '#ff4268', icon: Users },
  socialista_revolucionario: { color: '#e54c35', icon: Flag },
  nacionalista_autoritario: { color: '#a6a6b8', icon: Flag },
  absolutista: { color: '#bf4aff', icon: Crown },
  teocrata: { color: '#e6d28a', icon: BookOpen },
  republicano_progressista: { color: '#1fb5a8', icon: Landmark },
  federalista: { color: '#38c5ff', icon: Landmark },
  modernizador: { color: '#ff8533', icon: Landmark },
  internacionalista: { color: '#ffbd42', icon: Flag },
}

export function ProfileTag({ children, color, icon: Icon }: TagStyle & { children: ReactNode }) {
  return (
    <span className="profile-tag" style={{ '--tag-color': color } as CSSProperties}>
      <Icon size={14} aria-hidden="true" />
      {children}
    </span>
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
  const Placeholder = name === 'Bandeira' ? Flag : Shield
  return (
    <figure className="profile-symbol" style={{ width }}>
      <div className="profile-symbol-image">
        {src && src !== failed ? (
          <img
            src={src}
            alt={name}
            width={width}
            height={116}
            referrerPolicy="no-referrer"
            onError={() => setFailed(src)}
          />
        ) : (
          <Placeholder size={32} aria-hidden="true" />
        )}
      </div>
      <figcaption>{name}</figcaption>
    </figure>
  )
}

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
  const { governmentForm, system } = profile.politics
  const ideologyId = profile.politics.ideology

  return (
    <section
      aria-labelledby={id}
      className="profile-identity"
      style={color ? ({ '--nation-color': color } as CSSProperties) : undefined}
    >
      <div className="profile-symbols">
        <p>Símbolos nacionais</p>
        <div>
          <SymbolImage value={profile.symbols.flag} name="Bandeira" width={164} />
          <SymbolImage value={profile.symbols.coatOfArms} name="Brasão" width={120} />
        </div>
      </div>
      <div className="profile-identity-copy">
        {profile.foundedYear !== null && (
          <p className="text-xs text-muted">Fundada em {profile.foundedYear}</p>
        )}
        <h1 id={id} className="title profile-name">
          {profile.officialName || 'Nação sem nome registrado'}
        </h1>
        {profile.motto && <p className="profile-motto">“{profile.motto}”</p>}
        {(governmentForm || ideology || system) && (
          <div className="profile-tags">
            {governmentForm && (
              <ProfileTag {...formTags[governmentForm]}>
                {LABELS.governmentForm[governmentForm]}
              </ProfileTag>
            )}
            {ideology && (
              <ProfileTag
                {...(ideologyId ? ideologyTags[ideologyId] : { color: '#a6a6b8', icon: Flag })}
              >
                {ideology}
              </ProfileTag>
            )}
            {system && (
              <ProfileTag color="#a78bfa" icon={Users}>
                {LABELS.system[system]}
              </ProfileTag>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

type IndicatorCard = Pick<Indicator, 'delta' | 'lowerIsBetter'> & {
  label: string
  subtitle: string
  explanation: string
  value?: string | null
  unit?: string
  history?: readonly number[]
}

const politics = [
  {
    label: 'Legitimidade',
    subtitle: 'Política · índice',
    explanation:
      'Mede o reconhecimento do direito do governo de exercer o poder, em uma escala de 0 a 100.',
    unit: '/ 100',
  },
  {
    label: 'Aprovação',
    subtitle: 'Política · opinião',
    explanation: 'Percentual da população que aprova o governo.',
    unit: '%',
  },
  {
    label: 'Estabilidade',
    subtitle: 'Política · risco de crise',
    explanation:
      'Indica quão estável é a situação política da nação. Maior estabilidade significa menor risco de crise.',
  },
] as const

const economy = [
  {
    label: 'PIB',
    subtitle: 'Economia · valor + crescimento',
    explanation:
      'Produto Interno Bruto, o valor dos bens e serviços finais produzidos na economia da nação.',
  },
  {
    label: 'Inflação',
    subtitle: 'Economia · índice',
    explanation:
      'Variação no nível geral de preços. Uma alta da taxa indica que os preços estão subindo mais rapidamente.',
    lowerIsBetter: true,
  },
  {
    label: 'Desemprego',
    subtitle: 'Economia · índice',
    explanation: 'Percentual da força de trabalho sem emprego. Uma queda da taxa é favorável.',
    lowerIsBetter: true,
  },
  {
    label: 'Índice de Desenvolvimento Humano (IDH)',
    subtitle: 'Social · índice',
    explanation: 'Resume o desenvolvimento humano em três dimensões: saúde, educação e renda.',
  },
] satisfies readonly IndicatorCard[]

function IndicatorInfo({ label, explanation }: Pick<IndicatorCard, 'label' | 'explanation'>) {
  const id = useId()
  return (
    <div className="profile-stat-info">
      <button type="button" aria-label={`Sobre ${label}`} popoverTarget={id}>
        <Info size={14} aria-hidden="true" />
      </button>
      <div id={id} popover="auto" className="profile-stat-popover">
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-muted">{explanation}</p>
      </div>
    </div>
  )
}

function IndicatorTrend({ label, history }: { label: string; history: readonly number[] }) {
  const id = useId()
  const descriptionId = `${id}-description`
  const min = Math.min(...history)
  const max = Math.max(...history)
  const points = history
    .map((value, index) => {
      const x = 1 + (118 * index) / (history.length - 1)
      const y = max === min ? 27 : 50 - (47 * (value - min)) / (max - min)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      role="img"
      aria-label={`Histórico de ${label}`}
      aria-describedby={descriptionId}
      viewBox="0 0 120 62"
      className="profile-trend"
    >
      <desc id={descriptionId}>
        {`Série de ${history.length} registros. Primeiro: ${history[0].toLocaleString('pt-BR')}. Último: ${history.at(-1)?.toLocaleString('pt-BR')}.`}
      </desc>
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor="currentColor" stopOpacity=".28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`1,62 ${points} 119,62`} fill={`url(#${id})`} />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function ProfileIndicator({
  label,
  subtitle,
  explanation,
  value,
  unit,
  delta,
  history,
  lowerIsBetter,
}: IndicatorCard) {
  const mood = deltaMood({ delta, lowerIsBetter })
  const Arrow = delta === undefined || delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown
  const change = { good: 'Favorável', bad: 'Desfavorável', flat: 'Sem alteração' }[mood]

  return (
    <div className="profile-stat" data-tone={mood}>
      <dt>
        <span className="profile-stat-label">{label}</span>
        <span className="profile-stat-category">{subtitle}</span>
        <IndicatorInfo label={label} explanation={explanation} />
      </dt>
      <dd className="profile-stat-reading">
        <p className="profile-stat-value" data-compact={label === 'PIB' || undefined}>
          {value ?? (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Valor indisponível</span>
            </>
          )}
          {value != null && unit && <small>{unit}</small>}
        </p>
        {history && history.length > 1 ? (
          <IndicatorTrend label={label} history={history} />
        ) : (
          <span className="profile-trend-unavailable">Sem histórico</span>
        )}
      </dd>
      <dd className="profile-stat-delta">
        {delta === undefined ? (
          'Variação indisponível'
        ) : (
          <>
            <Arrow size={12} aria-hidden="true" />
            <span>{formatDelta(delta)} no último tick</span>
            <span className="sr-only">{change}</span>
          </>
        )}
      </dd>
    </div>
  )
}

export function ProfileStats({
  legitimacy,
  approval,
  approvalHistory = [],
  indicators = [],
}: {
  legitimacy: number | null
  approval: number | null
  approvalHistory?: readonly number[]
  indicators?: readonly Indicator[]
}) {
  const [legitimacyCard, approvalCard, stabilityCard] = politics
  const latestApproval = approvalHistory.at(-1)
  const previousApproval = approvalHistory.at(-2)
  const stability = indicators.find((indicator) => indicator.label === stabilityCard.label)

  return (
    <ProfileSection
      title="Indicadores"
      className="profile-indicator-section"
      action={
        <Link to="/indicadores" className={profileLink} aria-label="Ver mais indicadores">
          Ver mais <ChevronRight size={16} aria-hidden="true" />
        </Link>
      }
    >
      <dl className="profile-indicators profile-indicators-main">
        <ProfileIndicator {...legitimacyCard} value={legitimacy?.toLocaleString('pt-BR')} />
        <ProfileIndicator
          {...approvalCard}
          value={(latestApproval ?? approval)?.toLocaleString('pt-BR')}
          delta={
            latestApproval !== undefined && previousApproval !== undefined
              ? latestApproval - previousApproval
              : undefined
          }
          history={approvalHistory}
        />
        <ProfileIndicator {...stabilityCard} value={stability?.value} delta={stability?.delta} />
      </dl>
      <dl className="profile-indicators profile-indicators-secondary">
        {economy.map((card) => {
          const source = indicators.find(
            ({ label }) =>
              label === card.label || (label === 'IDH' && card.label.endsWith('(IDH)')),
          )
          const formatted = source?.value
          const [value, unit] = formatted?.endsWith('%')
            ? [formatted.slice(0, -1).trimEnd(), '%']
            : [formatted, undefined]
          return (
            <ProfileIndicator
              key={card.label}
              {...card}
              value={value}
              unit={unit}
              delta={source?.delta}
              lowerIsBetter={card.lowerIsBetter ?? source?.lowerIsBetter}
            />
          )
        })}
      </dl>
    </ProfileSection>
  )
}
