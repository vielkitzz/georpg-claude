import { useState } from 'react'
import { ArrowDownToLine, ArrowRight, ChevronRight, MapPin, TriangleAlert } from 'lucide-react'
import { Link, NavLink, useParams, useSearchParams } from 'react-router'
import { formatInteger } from '@/domain/format'
import {
  INDICATOR_CATEGORIES as SECTIONS,
  INDICATOR_LINKS,
  INDICATORS_PATH as ROOT,
  METRIC_SLUGS as SLUGS,
  type MetricKey,
} from '@/domain/indicatorNavigation'
import { deltaMood } from '@/domain/indicators'
import { currencyPrefix, formatDecimal, formatMagnitude } from '@/domain/nationView'
import type { Indicator, Nation } from '@/domain/types'
import { useWorldState } from '@/data/hooks'
import { EmptySection } from '@/ui/NationPage'
import { NationGate } from '@/ui/NationGate'
import { PageTitle, Panel } from '@/ui/Panel'
import { Sparkline } from '@/ui/nation/Sparkline'
import './indicators.css'

type Metric = Omit<Indicator, 'key' | 'delta' | 'deltaText' | 'caption'> & {
  key: MetricKey
  delta?: number
  deltaText?: string
}

const metricPath = (metric: Metric) => `${ROOT}/metrica/${SLUGS[metric.key]}`
const metricValue = ({ value, unit }: Metric) =>
  `${value}${unit === '%' ? unit : unit ? ` ${unit}` : ''}`
const tone = (metric: Metric) =>
  ({ good: 'var(--positive)', bad: 'var(--warning)', flat: 'var(--muted)' })[
    deltaMood({ delta: metric.delta ?? 0, lowerIsBetter: metric.lowerIsBetter })
  ]

function getMetrics(nation: Nation): Metric[] {
  const metrics: Metric[] = nation.indicators.map((metric) =>
    metric.key === 'approval' && nation.approvalHistory.length > metric.history.length
      ? { ...metric, history: nation.approvalHistory }
      : metric,
  )
  if (nation.population > 0) {
    metrics.push({
      key: 'population',
      label: 'População',
      value: formatInteger(nation.population),
      history: [],
      info: 'Total de habitantes da nação.',
    })
  }
  return metrics
}

function Delta({ metric }: { metric: Metric }) {
  if (!metric.delta || !metric.deltaText) return null
  return (
    <span className="text-sm whitespace-nowrap" style={{ color: tone(metric) }}>
      <span className="sr-only">Variação no último tick </span>
      {metric.delta > 0 ? '+' : metric.delta < 0 ? '−' : ''}
      {metric.deltaText}
    </span>
  )
}

const relationshipPath = (metric: Metric) => `?metrica=${SLUGS[metric.key]}`

function MetricRows({
  metrics,
  destination = metricPath,
}: {
  metrics: Metric[]
  destination?: (metric: Metric) => string
}) {
  if (!metrics.length) return <EmptySection>Sem indicadores registrados.</EmptySection>
  return (
    <ul className="divide-y divide-line">
      {metrics.map((metric) => (
        <li key={metric.key}>
          <Link
            to={destination(metric)}
            className="indicator-row rounded-sm py-2.5 hover:bg-raised/35 hover:text-primary-text"
          >
            <span className="text-sm font-medium">{metric.label}</span>
            {metric.history.length > 1 ? (
              <Sparkline
                className="indicator-mini h-5 w-full"
                values={metric.history}
                color={tone(metric)}
              />
            ) : (
              <span className="indicator-mini" aria-hidden />
            )}
            <strong className="indicator-value font-mono text-sm">{metricValue(metric)}</strong>
            <span className="indicator-change font-mono">
              <Delta metric={metric} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function History({ metric, nation }: { metric: Metric; nation: Nation }) {
  const values = metric.history
  if (values.length < 2) {
    return <EmptySection>O gráfico aparece quando houver pelo menos dois registros.</EmptySection>
  }

  const formatPoint = (value: number) => {
    if (metric.key === 'gdp') return `${currencyPrefix(nation.currency)} ${formatMagnitude(value)}`
    const precision = metric.key === 'hdi' ? 3 : metric.unit === '/ 100' ? 0 : 1
    return `${formatDecimal(value, precision)}${metric.unit === '%' ? '%' : ''}`
  }
  const first = formatPoint(values[0]!)
  const last = formatPoint(values[values.length - 1]!)
  return (
    <div
      role="img"
      aria-label={`Histórico de ${metric.label}. Primeiro registro: ${first}. Último registro: ${last}. ${values.length} medições.`}
    >
      <div className="relative border-y border-line px-1 py-3">
        <div
          className="absolute inset-x-1 top-1/2 border-t border-dashed border-line"
          aria-hidden
        />
        <Sparkline values={values} color={tone(metric)} className="relative h-28 w-full sm:h-36" />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-xs text-muted" aria-hidden>
        <span>Primeiro registro · {first}</span>
        <span className="text-right">Último registro · {last}</span>
      </div>
    </div>
  )
}

function MetricSummary({ metric }: { metric: Metric }) {
  return (
    <p className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <strong className="text-2xl">{metricValue(metric)}</strong>
      <Delta metric={metric} />
    </p>
  )
}

function SectionView({ metrics, nation }: { metrics: Metric[]; nation: Nation }) {
  if (!metrics.length)
    return <EmptySection>Sem indicadores registrados nesta categoria.</EmptySection>
  return (
    <div className="grid gap-6">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <li key={metric.key}>
            <Link
              to={metricPath(metric)}
              className="block rounded-md border border-line bg-panel p-3 hover:bg-raised sm:p-4"
            >
              <span className="mb-2 block text-xs text-muted">{metric.label}</span>
              <strong className="block wrap-break-word font-mono text-lg sm:text-2xl">
                {metricValue(metric)}
              </strong>
              <Delta metric={metric} />
              {metric.history.length > 1 && (
                <Sparkline
                  values={metric.history}
                  color={tone(metric)}
                  className="mt-3 h-6 w-full"
                />
              )}
            </Link>
          </li>
        ))}
      </ul>
      <div className="grid gap-4 xl:grid-cols-2">
        {metrics
          .filter((metric) => metric.history.length > 1)
          .map((metric) => (
            <Panel
              key={metric.key}
              title={metric.label}
              action={
                <Link
                  to={metricPath(metric)}
                  aria-label={`Ver detalhes de ${metric.label}`}
                  className="rounded p-1 text-primary-text"
                >
                  <ChevronRight size={18} aria-hidden />
                </Link>
              }
            >
              <History metric={metric} nation={nation} />
            </Panel>
          ))}
      </div>
      {metrics.some((metric) => metric.history.length < 2) && (
        <Panel title="Medições atuais">
          <MetricRows metrics={metrics.filter((metric) => metric.history.length < 2)} />
        </Panel>
      )}
    </div>
  )
}

function MetricDetail({
  metric,
  metrics,
  nation,
}: {
  metric: Metric
  metrics: Metric[]
  nation: Nation
}) {
  const inputs = metrics.filter(({ key }) => key !== 'population' && metric.inputs?.includes(key))
  return (
    <div className="grid gap-4">
      <Panel title="Histórico">
        <MetricSummary metric={metric} />
        <History metric={metric} nation={nation} />
      </Panel>
      {inputs.length > 0 && (
        <Panel title="O que compõe o indicador">
          <MetricRows metrics={inputs} />
          <Link
            to={`${ROOT}/teia?metrica=${SLUGS[metric.key]}`}
            className="mt-3 inline-block text-sm text-primary-text"
          >
            Explorar na Teia
          </Link>
        </Panel>
      )}
      <Panel title="Sobre o indicador">
        <p className="text-sm text-muted">{metric.info}</p>
      </Panel>
    </div>
  )
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim()

function Relationships({ metrics }: { metrics: Metric[] }) {
  const [query, setQuery] = useState('')
  const [params] = useSearchParams()
  const selected = metrics.find(({ key }) => SLUGS[key] === params.get('metrica'))
  const visible = metrics.filter(({ label }) => normalize(label).includes(normalize(query)))
  const incoming = selected?.inputs
  const outgoing = metrics.filter(
    ({ inputs }) => selected && selected.key !== 'population' && inputs?.includes(selected.key),
  )
  const sources = metrics.filter(({ key }) => key !== 'population' && incoming?.includes(key))

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Panel title="Explorar indicadores">
        <label htmlFor="metric-search" className="mb-2 block text-sm text-muted">
          Buscar na Teia
        </label>
        <input
          id="metric-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mb-4 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
        />
        <ul className="flex flex-wrap gap-2">
          {visible.map((metric) => (
            <li key={metric.key}>
              <Link
                to={relationshipPath(metric)}
                aria-current={metric === selected ? 'true' : undefined}
                className="block rounded-md border border-line px-3 py-2 text-sm hover:bg-raised aria-[current=true]:border-primary aria-[current=true]:bg-raised"
              >
                {metric.label}
              </Link>
            </li>
          ))}
        </ul>
        {visible.length === 0 && <EmptySection>Nenhum indicador encontrado.</EmptySection>}
        {selected && (sources.length > 0 || outgoing.length > 0) && (
          <div
            className="indicator-network mt-5 rounded-md border border-line bg-bg p-4"
            aria-label="Conexões da métrica selecionada"
          >
            {sources.length > 0 && (
              <ul className="flex flex-wrap justify-center gap-2">
                {sources.map((metric) => (
                  <li key={metric.key}>
                    <Link
                      to={relationshipPath(metric)}
                      className="block rounded border border-line bg-panel px-2 py-1 text-xs hover:text-primary-text"
                    >
                      {metric.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {sources.length > 0 && (
              <span className="mx-auto block text-primary-text" aria-hidden>
                ↓
              </span>
            )}
            <strong className="mx-auto block w-fit rounded border border-primary bg-panel px-3 py-2 text-sm">
              {selected.label}
            </strong>
            {outgoing.length > 0 && (
              <span className="mx-auto block text-primary-text" aria-hidden>
                ↓
              </span>
            )}
            {outgoing.length > 0 && (
              <ul className="flex flex-wrap justify-center gap-2">
                {outgoing.map((metric) => (
                  <li key={metric.key}>
                    <Link
                      to={relationshipPath(metric)}
                      className="block rounded border border-line bg-panel px-2 py-1 text-xs hover:text-primary-text"
                    >
                      {metric.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Panel>
      {selected ? (
        <Panel title={selected.label}>
          <MetricSummary metric={selected} />
          {sources.length > 0 && (
            <div className="mb-4">
              <h3 className="subtitle text-sm">O que compõe</h3>
              <MetricRows metrics={sources} destination={relationshipPath} />
            </div>
          )}
          {outgoing.length > 0 && (
            <div className="mb-4">
              <h3 className="subtitle text-sm">Usado no cálculo de</h3>
              <MetricRows metrics={outgoing} destination={relationshipPath} />
            </div>
          )}
          {sources.length === 0 && outgoing.length === 0 && (
            <EmptySection>Sem relações de cálculo registradas para este indicador.</EmptySection>
          )}
          <Link
            to={metricPath(selected)}
            className="mt-3 inline-flex items-center gap-2 text-sm text-primary-text"
          >
            Ver detalhes <ArrowRight size={15} aria-hidden />
          </Link>
        </Panel>
      ) : (
        <EmptySection>Selecione um indicador para ver suas relações de cálculo.</EmptySection>
      )}
    </div>
  )
}

function Overview({ metrics, nation }: { metrics: Metric[]; nation: Nation }) {
  const world = useWorldState()
  const warnings = nation.alerts.filter(({ level }) => level === 'warning')
  const cell = (value: string) => {
    const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value
    return `"${safe.replaceAll('"', '""')}"`
  }
  const csv = [
    ['Indicador', 'Valor', 'Variação'],
    ...metrics.map((metric) => [metric.label, metricValue(metric), metric.delta?.toString() ?? '']),
  ]
    .map((row) => row.map(cell).join(';'))
    .join('\r\n')

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          {warnings.length > 0 && (
            <details className="text-warning">
              <summary className="cursor-pointer">
                <TriangleAlert size={14} className="mr-1 inline" aria-hidden />
                {warnings.length} {warnings.length === 1 ? 'alerta' : 'alertas'}
              </summary>
              <ul aria-label="Alertas nacionais" className="mt-2 list-inside list-disc">
                {warnings.map(({ id, text }) => (
                  <li key={id}>{text}</li>
                ))}
              </ul>
            </details>
          )}
          <span>
            {nation.officialName}
            {world.status === 'ready' && ` · Tick ${world.data.tickIndex}`}
          </span>
        </div>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`}
          download="indicadores-georpg.csv"
          className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-raised"
        >
          <ArrowDownToLine size={16} aria-hidden /> Baixar CSV
        </a>
      </div>
      <div className="indicator-board">
        {SECTIONS.map(({ id, label, keys }) => (
          <Panel
            key={id}
            title={label}
            className="border border-line"
            action={
              <Link
                to={`${ROOT}/${id}`}
                aria-label={`Ver indicadores de ${label}`}
                className="inline-flex items-center gap-1 text-sm text-primary-text"
              >
                Ver <ChevronRight size={15} aria-hidden />
              </Link>
            }
          >
            <MetricRows metrics={metrics.filter(({ key }) => keys.includes(key))} />
          </Panel>
        ))}
      </div>
    </>
  )
}

function IndicatorsContent({ nation }: { nation: Nation }) {
  const { section, metric: slug } = useParams()
  const metrics = getMetrics(nation)
  const category = SECTIONS.find(({ id }) => id === section)
  const metric = metrics.find(({ key }) => SLUGS[key] === slug)
  const title = metric?.label ?? category?.label ?? (section === 'teia' ? 'Teia' : 'Indicadores')

  return (
    <>
      {title !== 'Indicadores' && (
        <Link to={ROOT} className="mb-2 inline-block text-sm text-muted hover:text-primary-text">
          Indicadores
        </Link>
      )}
      <PageTitle>{title}</PageTitle>
      <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-1.5 text-sm">
        <MapPin size={15} className="text-primary-text" aria-hidden />
        <span>{nation.shortName}</span>
      </div>
      <nav aria-label="Seções de indicadores" className="mb-5 flex flex-wrap gap-2 lg:hidden">
        {INDICATOR_LINKS.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            end
            className="rounded-md border border-line px-3 py-2 text-sm hover:bg-raised aria-[current=page]:border-primary aria-[current=page]:bg-panel aria-[current=page]:text-primary-text"
          >
            {label}
          </NavLink>
        ))}
      </nav>
      {metric ? (
        <MetricDetail metric={metric} metrics={metrics} nation={nation} />
      ) : category ? (
        <SectionView
          nation={nation}
          metrics={metrics.filter(({ key }) => category.keys.includes(key))}
        />
      ) : section === 'teia' ? (
        <Relationships metrics={metrics} />
      ) : section || slug ? (
        <EmptySection>
          Indicador ou categoria indisponível.{' '}
          <Link to={ROOT} className="underline">
            Voltar à visão geral
          </Link>
        </EmptySection>
      ) : (
        <Overview metrics={metrics} nation={nation} />
      )}
    </>
  )
}

export function IndicatorsPage() {
  return (
    <div className="indicator-page mx-auto max-w-7xl">
      <NationGate>{(nation) => <IndicatorsContent nation={nation} />}</NationGate>
    </div>
  )
}
