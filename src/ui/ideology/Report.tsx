import {
  AXES,
  CHAPTERS,
  analyzeCoherence,
  compass,
  initialLegitimacy,
  portrait,
  rankArchetypes,
  type ArchetypeId,
  type AxisScores,
  type ChosenInstitutions,
} from '@/domain/ideology'
import { Panel } from '@/ui/Panel'

const SIZE = 220
const PAD = 14

function Compass({ x, y }: { x: number; y: number }) {
  const inner = SIZE - PAD * 2
  const cx = PAD + (x / 100) * inner
  const cy = PAD + (1 - y / 100) * inner
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`Bússola política: economia ${x} de 100 (0 coletivista, 100 mercado) e autoridade ${y} de 100 (0 liberdade, 100 autocracia)`}
      className="size-full max-w-64"
    >
      <rect
        x={PAD}
        y={PAD}
        width={inner}
        height={inner}
        fill="var(--panel-raised)"
        stroke="var(--line)"
      />
      <line x1={SIZE / 2} x2={SIZE / 2} y1={PAD} y2={SIZE - PAD} stroke="var(--line)" />
      <line y1={SIZE / 2} y2={SIZE / 2} x1={PAD} x2={SIZE - PAD} stroke="var(--line)" />
      <g fontSize="9" fill="var(--muted)" textAnchor="middle">
        <text x={SIZE / 2} y={10}>
          Autocracia
        </text>
        <text x={SIZE / 2} y={SIZE - 3}>
          Liberdade
        </text>
        <text x={PAD + 2} y={SIZE / 2 - 4} textAnchor="start">
          Coletivo
        </text>
        <text x={SIZE - PAD - 2} y={SIZE / 2 - 4} textAnchor="end">
          Mercado
        </text>
      </g>
      <circle cx={cx} cy={cy} r="7" fill="var(--primary)" stroke="var(--bg)" strokeWidth="2" />
    </svg>
  )
}

function AxisBar({ axis, score }: { axis: (typeof AXES)[number]; score: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{axis.low}</span>
        <span className="text-muted">{Math.round(score)}</span>
        <span>{axis.high}</span>
      </div>
      <div
        role="img"
        aria-label={`${axis.low} contra ${axis.high}: ${Math.round(score)} de 100`}
        className="relative h-2 rounded-full bg-raised"
      >
        <span
          aria-hidden
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-primary"
          style={{ left: `${score}%` }}
        />
      </div>
    </div>
  )
}

interface Props {
  scores: AxisScores
  /** Instituições já escolhidas: ativam a análise de coerência. */
  institutions?: ChosenInstitutions
  selectedIdeology: ArchetypeId | null
  onSelectIdeology: (id: ArchetypeId) => void
}

/** Relatório final: bússola, eixos por capítulo, 11 ideologias, retrato e coerência. */
export function Report({ scores, institutions, selectedIdeology, onSelectIdeology }: Props) {
  const position = compass(scores)
  const ranking = rankArchetypes(scores)
  const coherence = institutions ? analyzeCoherence(scores, institutions) : null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Bússola política">
        <div className="flex flex-col items-center gap-3">
          <Compass {...position} />
          <p className="text-sm text-muted">
            Economia {position.x}/100 · Autoridade {position.y}/100
          </p>
        </div>
      </Panel>

      <Panel title="Retrato">
        <div className="flex flex-col gap-4">
          {portrait(scores).map((part) => (
            <div key={part.chapter}>
              <h3 className="subtitle">{part.title}</h3>
              <p className="text-sm text-muted">{part.text}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Eixos por capítulo" className="lg:col-span-2">
        <div className="grid gap-6 md:grid-cols-2">
          {CHAPTERS.map((chapter) => (
            <div key={chapter.id} className="flex flex-col gap-4">
              <h3 className="subtitle">{chapter.title}</h3>
              {AXES.filter((axis) => axis.chapter === chapter.id).map((axis) => (
                <AxisBar key={axis.id} axis={axis} score={scores[axis.id]} />
              ))}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Ideologias" className="lg:col-span-2">
        <p className="mb-4 text-sm text-muted">
          As 11 ideologias, da mais próxima à mais distante. Escolha uma das três primeiras como a
          ideologia governante.
        </p>
        <div role="radiogroup" aria-label="Ideologia governante" className="flex flex-col gap-2">
          {ranking.map((match, i) => {
            const eligible = i < 3
            const selected = selectedIdeology === match.archetype.id
            return (
              <button
                key={match.archetype.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!eligible}
                onClick={() => onSelectIdeology(match.archetype.id)}
                className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-md border px-4 py-3 text-left transition-colors disabled:cursor-default ${
                  selected
                    ? 'border-primary bg-primary text-on-primary'
                    : eligible
                      ? 'border-line bg-panel hover:bg-raised'
                      : 'border-line opacity-70'
                }`}
              >
                <span className="subtitle">
                  {i + 1}. {match.archetype.name}
                </span>
                <span>{match.affinity}%</span>
                <span className={`col-span-2 text-sm ${selected ? '' : 'text-muted'}`}>
                  {match.archetype.summary}
                </span>
                <span
                  aria-hidden
                  className="col-span-2 h-1.5 overflow-hidden rounded-full bg-black/20"
                >
                  <span
                    className={`block h-full ${selected ? 'bg-on-primary' : 'bg-primary'}`}
                    style={{ width: `${match.affinity}%` }}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </Panel>

      {coherence && institutions && (
        <Panel title="Análise de coerência" className="lg:col-span-2">
          {coherence.tensions.length === 0 ? (
            <p className="text-positive">
              Seu perfil é coerente com as instituições que você escolheu. Nenhuma penalidade.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {coherence.tensions.map((tension) => (
                  <li
                    key={tension.id}
                    className="flex justify-between gap-4 border-l-2 border-warning pl-3"
                  >
                    <span>{tension.message}</span>
                    <span className="shrink-0 text-warning">−{tension.penalty}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">
                Penalidade total de legitimidade: −{coherence.penalty}.
              </p>
            </>
          )}
          <p className="mt-2 text-sm">
            Legitimidade inicial:{' '}
            <strong>{initialLegitimacy(institutions.localSelection, coherence.penalty)}</strong>
          </p>
        </Panel>
      )}
    </div>
  )
}
