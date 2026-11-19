import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { checkFounding, confirmFounding, drawQuiz, previewFounding } from '@/data/foundingApi'
import {
  validateEconomy,
  validateFoundingText,
  validateSymbols,
  type FoundingDraft,
  type FoundingPreview,
} from '@/domain/founding/draft'
import { ARTICLES, composeOfficialCountryName, validateShortName } from '@/domain/founding/name'
import {
  GOVERNMENT_FORMS,
  GOVERNMENT_SYSTEMS,
  LABELS,
  LOCAL_SELECTIONS,
  REGIMES,
  SECOND_LEVEL_DIVISIONS,
  STATE_FORMS,
  firstLevelDivisions,
  requiresHeadOfGovernment,
  suggestedLocalSelection,
  validLeadershipBases,
  validSystems,
  validateInstitutions,
  type InstitutionsInput,
} from '@/domain/founding/options'
import { missingQuestions, scoreQuiz, topThree } from '@/domain/ideology'
import { primaryButton, secondaryButton } from '@/ui/CenteredScreen'
import { DiplomaticCard } from '@/ui/founding/DiplomaticCard'
import { Choice, SymbolFields, TextField } from '@/ui/founding/Fields'
import { Revelation } from '@/ui/founding/Revelation'
import { Quiz } from '@/ui/ideology/Quiz'
import { Report } from '@/ui/ideology/Report'
import { TerritoryPicker } from './TerritoryPicker'

const STEPS = [
  ['Território', 'Escolha a região onde sua nação será fundada.'],
  ['Nome curto e artigo', 'Defina o nome pelo qual a nação será conhecida.'],
  ['Capital e moeda', 'Escolha a sede do governo e a moeda nacional.'],
  ['Forma de governo', 'Escolha como se organiza a chefia de Estado.'],
  ['Regime político', 'Determine como o poder é exercido no país.'],
  ['Sistema de governo', 'Defina como os poderes se relacionam.'],
  ['Forma de Estado', 'Determine como o poder é distribuído pelo território.'],
  ['Divisão administrativa', 'Organize as divisões territoriais e a escolha de seus governantes.'],
  ['Liderança', 'Defina os cargos e nomes das primeiras lideranças da sua nação.'],
  ['Questionário ideológico', 'Responda às 36 afirmações e escolha a ideologia governante.'],
  ['Identidade simbólica', 'Escolha os símbolos e conte a história da sua nação.'],
  ['Revelação final', 'Confira os dados iniciais da sua nação antes de confirmar.'],
] as const

const initialDraft: FoundingDraft = {
  territoryId: null,
  shortName: '',
  article: 'de',
  capital: '',
  currencyCode: '',
  currencyName: '',
  institutions: {
    governmentForm: 'republica',
    regime: 'democratico',
    system: 'presidencialismo',
    stateForm: 'unitario',
    firstLevel: 'Províncias',
    secondLevel: 'Municípios',
    localSelection: 'nomeados',
    leadershipBasis: 'eleito_direto',
    headOfState: { title: '', name: '' },
  },
  answers: {},
  ideology: null,
  symbols: {
    flag: '',
    coatOfArms: '',
    color: '',
    anthem: '',
    emblem: '',
    motto: '',
    description: '',
    history: '',
  },
}

const buttonDisabled =
  'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0'
const lastStep = STEPS.length - 1

function normalizeCurrencyCode(value: string) {
  const code = value.trim()
  return /^[A-Za-z]{2,4}$/.test(code) ? code.toUpperCase() : code
}

export function FoundNationPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [draft, setDraft] = useState(initialDraft)
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(0)
  const [territoryAvailable, setTerritoryAvailable] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [governmentHead, setGovernmentHead] = useState({ title: '', name: '' })
  const [customLocalSelection, setCustomLocalSelection] = useState(false)
  const [preview, setPreview] = useState<FoundingPreview | null>(null)
  const [error, setError] = useState<{ error: string; code?: string } | null>(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState(0)
  const heading = useRef<HTMLHeadingElement>(null)
  const institutions = draft.institutions
  const systems = validSystems(institutions.governmentForm, institutions.regime)
  const bases = validLeadershipBases(institutions.governmentForm, institutions.regime)
  const needsGovernmentHead = requiresHeadOfGovernment(institutions.system)
  const payload = needsGovernmentHead
    ? { ...draft, institutions: { ...institutions, headOfGovernment: governmentHead } }
    : draft
  const officialName = draft.shortName.trim()
    ? composeOfficialCountryName({ ...draft, ...institutions })
    : ''
  const scores = quizFinished ? scoreQuiz(draft.answers) : null
  const invalidText = (value: string) => !!error && !validateFoundingText(value, 2, 60)

  const edit = <K extends keyof FoundingDraft>(field: K, value: FoundingDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setError(null)
    setPreview(null)
  }
  const changeInstitution = (change: Partial<InstitutionsInput>) =>
    edit('institutions', { ...institutions, ...change })
  const alignInstitutions = (change: Partial<InstitutionsInput>) => {
    const next = { ...institutions, ...change }
    const allowed = validSystems(next.governmentForm, next.regime)
    const validBases = validLeadershipBases(next.governmentForm, next.regime)
    const notices = []
    if (!allowed.includes(next.system)) {
      next.system = allowed[0]
      notices.push(`Sistema ajustado para ${LABELS.system[next.system]}.`)
    }
    if (!validBases.includes(next.leadershipBasis)) {
      next.leadershipBasis = validBases[0]
      notices.push(
        `Base da chefia de Estado ajustada para ${LABELS.leadershipBasis[next.leadershipBasis]}.`,
      )
    }
    setNotice(notices.join(' '))
    edit('institutions', next)
  }
  const goTo = (destination: number) => {
    setError(null)
    setNotice('')
    setStep(destination)
    setReached((current) => Math.max(current, destination))
    requestAnimationFrame(() => heading.current?.focus())
  }

  const refreshPreview = async () => {
    setBusy(true)
    setPreview(null)
    setError(null)
    const result = await previewFounding(payload)
    if ('error' in result && result.code === 'owned') navigate('/', { replace: true })
    else if ('error' in result) setError(result)
    else setPreview(result.preview)
    setBusy(false)
  }

  const next = async () => {
    const currencyCode = normalizeCurrencyCode(draft.currencyCode)
    const validation = [
      territoryAvailable && draft.territoryId !== null
        ? null
        : 'Selecione um território livre para continuar.',
      validateShortName(draft.shortName),
      validateEconomy({ ...draft, currencyCode }),
      null,
      null,
      null,
      null,
      null,
      validateInstitutions(payload.institutions)[0],
      !scores
        ? 'Conclua o questionário para continuar.'
        : !topThree(scores).some((match) => match.archetype.id === draft.ideology)
          ? 'Escolha uma das três ideologias mais próximas.'
          : null,
      validateSymbols(draft.symbols),
    ][step]
    if (validation) {
      setError({ error: validation })
      return
    }
    if (step === 1) {
      setBusy(true)
      const result = await checkFounding(payload)
      setBusy(false)
      if ('error' in result) {
        if (result.code === 'owned') {
          navigate('/', { replace: true })
          return
        }
        setError(result)
        return
      }
    }
    if (step === 2) edit('currencyCode', currencyCode)
    goTo(step + 1)
    if (step === 10) await refreshPreview()
  }

  const confirm = async () => {
    if (!preview) return
    setBusy(true)
    setError(null)
    const result = await confirmFounding(payload, preview.token)
    if ('error' in result && result.code !== 'owned') {
      setError(result)
      if (result.code === 'preview' || result.code === 'name' || result.code === 'territory')
        setPreview(null)
    } else navigate('/', { replace: true })
    setBusy(false)
  }

  const randomFill = async () => {
    setBusy(true)
    setError(null)
    const result = await drawQuiz()
    if ('error' in result) setError(result)
    else edit('answers', result.answers)
    setBusy(false)
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <TerritoryPicker
            selectedId={draft.territoryId}
            onSelect={(id) => edit('territoryId', id)}
            onAvailability={setTerritoryAvailable}
          />
        )
      case 1:
        return (
          <>
            <TextField
              label="Nome curto"
              max={40}
              value={draft.shortName}
              onChange={(value) => edit('shortName', value)}
              invalid={!!error && (!!validateShortName(draft.shortName) || error.code === 'name')}
            />
            <Choice
              label="Artigo"
              value={draft.article}
              values={ARTICLES}
              onChange={(value) => edit('article', value)}
            />
            {officialName && (
              <p className="text-sm text-muted">
                Nome oficial provisório <strong className="text-fg">{officialName}</strong>
              </p>
            )}
          </>
        )
      case 2:
        return (
          <>
            <TextField
              label="Capital"
              invalid={invalidText(draft.capital)}
              max={60}
              value={draft.capital}
              onChange={(value) => edit('capital', value)}
            />
            <TextField
              label="Código monetário"
              invalid={!!error && !/^[A-Z]{2,4}$/.test(normalizeCurrencyCode(draft.currencyCode))}
              placeholder="Ex.: BRL"
              value={draft.currencyCode}
              onChange={(value) => edit('currencyCode', value)}
            />
            <TextField
              label="Nome da moeda"
              invalid={invalidText(draft.currencyName)}
              max={60}
              value={draft.currencyName}
              onChange={(value) => edit('currencyName', value)}
            />
          </>
        )
      case 3:
        return (
          <Choice
            label="Forma de governo"
            value={institutions.governmentForm}
            values={GOVERNMENT_FORMS}
            names={LABELS.governmentForm}
            onChange={(governmentForm) => alignInstitutions({ governmentForm })}
          />
        )
      case 4:
        return (
          <Choice
            label="Regime político"
            value={institutions.regime}
            values={REGIMES}
            names={LABELS.regime}
            onChange={(regime) => alignInstitutions({ regime })}
          />
        )
      case 5:
        return (
          <Choice
            label="Sistema de governo"
            value={institutions.system}
            values={GOVERNMENT_SYSTEMS}
            available={systems}
            names={LABELS.system}
            onChange={(system) => changeInstitution({ system })}
          />
        )
      case 6:
        return (
          <Choice
            label="Forma de Estado"
            value={institutions.stateForm}
            values={STATE_FORMS}
            names={LABELS.stateForm}
            onChange={(stateForm) => {
              const divisions = firstLevelDivisions(stateForm)
              changeInstitution({
                stateForm,
                firstLevel: divisions.includes(institutions.firstLevel)
                  ? institutions.firstLevel
                  : divisions[0],
                localSelection: customLocalSelection
                  ? institutions.localSelection
                  : suggestedLocalSelection(stateForm),
              })
            }}
          />
        )
      case 7:
        return (
          <>
            <Choice
              label="Primeiro nível"
              value={institutions.firstLevel}
              values={firstLevelDivisions(institutions.stateForm)}
              onChange={(firstLevel) => changeInstitution({ firstLevel })}
            />
            <Choice
              label="Segundo nível"
              value={institutions.secondLevel}
              values={SECOND_LEVEL_DIVISIONS}
              onChange={(secondLevel) => changeInstitution({ secondLevel })}
            />
            <Choice
              label="Governantes locais"
              value={institutions.localSelection}
              values={LOCAL_SELECTIONS}
              names={{ eleitos: 'Eleitos (+5)', nomeados: 'Nomeados (−5)', misto: 'Misto (0)' }}
              onChange={(localSelection) => {
                setCustomLocalSelection(true)
                changeInstitution({ localSelection })
              }}
            />
            <p className="text-sm text-muted">
              Os valores entre parênteses indicam o efeito na legitimidade inicial.
            </p>
          </>
        )
      case 8:
        return (
          <>
            <TextField
              label="Título do chefe de Estado"
              invalid={invalidText(institutions.headOfState.title)}
              max={60}
              value={institutions.headOfState.title}
              onChange={(title) =>
                changeInstitution({ headOfState: { ...institutions.headOfState, title } })
              }
            />
            <TextField
              label="Nome do chefe de Estado"
              invalid={invalidText(institutions.headOfState.name)}
              max={60}
              value={institutions.headOfState.name}
              onChange={(name) =>
                changeInstitution({ headOfState: { ...institutions.headOfState, name } })
              }
            />
            <Choice
              label="Base da chefia de Estado"
              value={institutions.leadershipBasis}
              values={bases}
              names={LABELS.leadershipBasis}
              onChange={(leadershipBasis) => changeInstitution({ leadershipBasis })}
            />
            {needsGovernmentHead && (
              <>
                <TextField
                  label="Título do chefe de Governo"
                  invalid={invalidText(governmentHead.title)}
                  max={60}
                  value={governmentHead.title}
                  onChange={(title) => {
                    setError(null)
                    setGovernmentHead({ ...governmentHead, title })
                  }}
                />
                <TextField
                  label="Nome do chefe de Governo"
                  invalid={invalidText(governmentHead.name)}
                  max={60}
                  value={governmentHead.name}
                  onChange={(name) => {
                    setError(null)
                    setGovernmentHead({ ...governmentHead, name })
                  }}
                />
              </>
            )}
          </>
        )
      case 9:
        return scores ? (
          <>
            <Report
              scores={scores}
              institutions={institutions}
              selectedIdeology={draft.ideology}
              onSelectIdeology={(ideology) => edit('ideology', ideology)}
            />
            <button
              type="button"
              className={secondaryButton}
              onClick={() => {
                setQuizFinished(false)
                edit('ideology', null)
              }}
            >
              Revisar respostas
            </button>
          </>
        ) : (
          <Quiz
            answers={draft.answers}
            onAnswer={(id, answer) => edit('answers', { ...draft.answers, [id]: answer })}
            onFinish={() => {
              if (!missingQuestions(draft.answers).length) {
                setQuizFinished(true)
                setError(null)
              }
            }}
            onRandomFill={role === 'ADMIN' ? randomFill : undefined}
            busy={busy}
          />
        )
      case 10:
        return (
          <SymbolFields
            value={draft.symbols}
            onChange={(field, value) =>
              setDraft((current) => ({
                ...current,
                symbols: { ...current.symbols, [field]: value },
              }))
            }
            onReading={(active) => setReading((current) => current + (active ? 1 : -1))}
            invalid={!!error}
          />
        )
      case 11:
        return preview ? (
          <Revelation preview={preview} draft={draft} />
        ) : busy ? (
          <p role="status">Gerando prévia da fundação…</p>
        ) : null
    }
  }

  return (
    <main className="founding min-h-dvh bg-bg text-fg">
      <div className="mx-auto max-w-[83rem] px-4 py-6 sm:px-8 sm:py-10">
        <header className="mb-5 border-b border-line pb-5">
          <p className="subtitle text-sm text-secondary">GEO-RPG</p>
          <h1 className="title mt-1 text-5xl sm:text-7xl">Fundação de nação</h1>
        </header>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 max-lg:order-2">
            <section className="founding-panel p-4 sm:p-7" aria-labelledby="fundacao-etapa">
              <div className="mb-6">
                <p className="subtitle text-sm text-secondary">
                  Etapa {step + 1} de {STEPS.length}
                </p>
                <div
                  className="my-3 grid grid-cols-12 gap-1"
                  role="progressbar"
                  aria-label="Progresso da fundação"
                  aria-valuemin={1}
                  aria-valuemax={STEPS.length}
                  aria-valuenow={step + 1}
                >
                  {STEPS.map(([name], index) => (
                    <span
                      aria-hidden
                      key={name}
                      className={`h-1.5 rounded-full transition-colors ${index <= step ? 'bg-primary' : 'bg-line'}`}
                    />
                  ))}
                </div>
                <h2
                  ref={heading}
                  id="fundacao-etapa"
                  tabIndex={-1}
                  className="title-semi mt-5 text-4xl outline-none sm:text-5xl"
                >
                  {STEPS[step][0]}
                </h2>
                <p className="mt-2 text-sm text-muted">{STEPS[step][1]}</p>
              </div>
              <fieldset disabled={busy} className="min-w-0 space-y-4">
                {renderStep()}
              </fieldset>
              {notice && (
                <p role="status" className="mt-4 text-sm text-warning">
                  {notice}
                </p>
              )}
              {error && (
                <p role="alert" className="founding-error mt-4 text-sm">
                  {error.error}
                </p>
              )}
              <nav
                aria-label="Etapas da fundação"
                className="mt-6 flex flex-wrap justify-between gap-3 border-t border-line pt-4"
              >
                <button
                  type="button"
                  className={`${secondaryButton} ${buttonDisabled}`}
                  disabled={step === 0 || busy || reading > 0}
                  onClick={() => goTo(step - 1)}
                >
                  Anterior
                </button>
                {step < lastStep ? (
                  <button
                    type="button"
                    className={`${primaryButton} ${buttonDisabled}`}
                    disabled={busy || reading > 0}
                    onClick={next}
                  >
                    {busy ? 'Aguarde…' : 'Próxima'}
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {error?.code === 'territory' && (
                      <button type="button" className={secondaryButton} onClick={() => goTo(0)}>
                        Escolher território
                      </button>
                    )}
                    {error?.code === 'name' && (
                      <button type="button" className={secondaryButton} onClick={() => goTo(1)}>
                        Revisar nome
                      </button>
                    )}
                    {!preview && !busy && (
                      <button type="button" className={secondaryButton} onClick={refreshPreview}>
                        Atualizar prévia
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${primaryButton} ${buttonDisabled}`}
                      disabled={!preview || busy}
                      onClick={confirm}
                    >
                      {busy && preview ? 'Confirmando…' : 'CONFIRMAR FUNDAÇÃO'}
                    </button>
                  </div>
                )}
              </nav>
            </section>
          </div>
          <DiplomaticCard draft={payload} officialName={officialName} reached={reached} />
        </div>
      </div>
    </main>
  )
}
