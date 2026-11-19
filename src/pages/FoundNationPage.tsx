import { useState } from 'react'
import { Link } from 'react-router'
import { composeOfficialCountryName, validateShortName, type Article } from '@/domain/founding/name'
import {
  GOVERNMENT_FORMS, REGIMES, STATE_FORMS, LABELS, validSystems,
  validLeadershipBases, firstLevelDivisions, SECOND_LEVEL_DIVISIONS,
  LOCAL_SELECTIONS, type GovernmentForm, type Regime, type StateForm,
  type GovernmentSystem, type LeadershipBasis, type LocalSelection,
} from '@/domain/founding/options'
import { Quiz } from '@/ui/ideology/Quiz'
import { scoreQuiz, topThree, missingQuestions, type Answer, type Answers } from '@/domain/ideology'

const STEPS = [
  'Nome da nação', 'Território', 'Forma de governo', 'Regime político',
  'Sistema de governo', 'Organização territorial', 'Governo local',
  'Chefia de Estado', 'Chefia de Governo', 'Identidade nacional',
  'Questionário ideológico', 'Revisão',
] as const

const fieldClass = 'w-full rounded-md border border-line bg-bg px-3 py-2 text-foreground'
const buttonClass = 'rounded-md bg-primary px-5 py-2 font-semibold text-white disabled:opacity-40'

function Choice<T extends string>({ label, value, values, names, onChange }: {
  label: string; value: T; values: readonly T[]; names?: Record<T, string>; onChange: (v: T) => void
}) {
  return <label className="block space-y-2 text-sm"><span>{label}</span>
    <select className={fieldClass} value={value} onChange={e => onChange(e.target.value as T)}>
      {values.map(v => <option key={v} value={v}>{names?.[v] ?? v}</option>)}
    </select>
  </label>
}

export function FoundNationPage() {
  const [step, setStep] = useState(0)
  const [shortName, setShortName] = useState('')
  const [article, setArticle] = useState<Article>('de')
  const [territory, setTerritory] = useState('')
  const [governmentForm, setGovernmentForm] = useState<GovernmentForm>('republica')
  const [regime, setRegime] = useState<Regime>('democratico')
  const [system, setSystem] = useState<GovernmentSystem>('presidencialismo')
  const [stateForm, setStateForm] = useState<StateForm>('unitario')
  const [firstLevel, setFirstLevel] = useState('Províncias')
  const [secondLevel, setSecondLevel] = useState('Municípios')
  const [localSelection, setLocalSelection] = useState<LocalSelection>('nomeados')
  const [leadershipBasis, setLeadershipBasis] = useState<LeadershipBasis>('eleito_direto')
  const [headOfState, setHeadOfState] = useState('')
  const [headOfGovernment, setHeadOfGovernment] = useState('')
  const [capital, setCapital] = useState('')
  const [motto, setMotto] = useState('')
  const [answers, setAnswers] = useState<Answers>({})
  const [quizFinished, setQuizFinished] = useState(false)
  const [ideology, setIdeology] = useState('')
  const officialName = composeOfficialCountryName({ governmentForm, stateForm, article, shortName })
  const systems = validSystems(governmentForm, regime)
  const bases = validLeadershipBases(governmentForm, regime)
  const needsGovernmentHead = system === 'parlamentarismo' || system === 'semipresidencialismo'
  const valid = [
    !validateShortName(shortName), false, true, true, true, true, true,
    headOfState.trim().length >= 2, !needsGovernmentHead || headOfGovernment.trim().length >= 2,
    capital.trim().length >= 2, quizFinished && !!ideology, false,
  ][step]
  const scores = quizFinished ? scoreQuiz(answers) : null

  return <main className="mx-auto min-h-dvh max-w-3xl space-y-6 px-4 py-10 text-foreground">
    <div className="flex items-center justify-between gap-4">
      <div><p className="text-sm text-muted">GEO-RPG · Fundação de nação</p>
        <h1 className="text-3xl font-bold uppercase">{STEPS[step]}</h1></div>
      <Link to="/login" className="text-sm underline">Voltar ao login</Link>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-line">
      <div className="h-full bg-primary transition-all" style={{ width: `${(step + 1) / STEPS.length * 100}%` }} />
    </div>
    <p className="text-sm text-muted">Etapa {step + 1} de {STEPS.length}. Suas respostas ainda não são salvas.</p>
    <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
      {step === 0 && <>
        <label className="block space-y-2">Nome curto<input className={fieldClass} value={shortName} maxLength={40} onChange={e => setShortName(e.target.value)} placeholder="Ex.: Valdris" /></label>
        <Choice label="Artigo" value={article} values={['de','da','do'] as const} onChange={setArticle} />
        <p className="text-sm text-muted">Nome oficial: {officialName}</p>
        {shortName && validateShortName(shortName) && <p role="alert" className="text-sm text-red-400">{validateShortName(shortName)}</p>}
      </>}
      {step === 1 && <p className="text-muted">A seleção de território será conectada ao mapa e validada no servidor. Não é possível avançar enquanto isso não estiver pronto. {territory && <span>{territory}</span>}</p>}
      {step === 2 && <Choice label="Forma de governo" value={governmentForm} values={GOVERNMENT_FORMS} names={LABELS.governmentForm} onChange={v => { setGovernmentForm(v); const allowed = validSystems(v, regime); if (!allowed.includes(system)) setSystem(allowed[0]); const b = validLeadershipBases(v, regime); if (!b.includes(leadershipBasis)) setLeadershipBasis(b[0]) }} />}
      {step === 3 && <Choice label="Regime" value={regime} values={REGIMES} names={LABELS.regime} onChange={v => { setRegime(v); const allowed = validSystems(governmentForm, v); if (!allowed.includes(system)) setSystem(allowed[0]); const b = validLeadershipBases(governmentForm, v); if (!b.includes(leadershipBasis)) setLeadershipBasis(b[0]) }} />}
      {step === 4 && <Choice label="Sistema" value={system} values={systems} names={LABELS.system} onChange={setSystem} />}
      {step === 5 && <div className="space-y-4">
        <Choice label="Forma de Estado" value={stateForm} values={STATE_FORMS} names={LABELS.stateForm} onChange={v => { setStateForm(v); setFirstLevel(firstLevelDivisions(v)[0]) }} />
        <Choice label="Divisões principais" value={firstLevel} values={firstLevelDivisions(stateForm)} onChange={setFirstLevel} />
        <Choice label="Divisões secundárias" value={secondLevel} values={SECOND_LEVEL_DIVISIONS} onChange={setSecondLevel} />
      </div>}
      {step === 6 && <Choice label="Seleção dos governantes locais" value={localSelection} values={LOCAL_SELECTIONS} names={LABELS.localSelection} onChange={setLocalSelection} />}
      {step === 7 && <div className="space-y-4">
        <Choice label="Base da chefia de Estado" value={leadershipBasis} values={bases} names={LABELS.leadershipBasis} onChange={setLeadershipBasis} />
        <label className="block space-y-2">Nome do chefe de Estado<input className={fieldClass} value={headOfState} onChange={e => setHeadOfState(e.target.value)} /></label>
      </div>}
      {step === 8 && (needsGovernmentHead ? <label className="block space-y-2">Nome do chefe de Governo<input className={fieldClass} value={headOfGovernment} onChange={e => setHeadOfGovernment(e.target.value)} /></label> : <p>Seu sistema não exige um chefe de Governo separado.</p>)}
      {step === 9 && <div className="space-y-4">
        <label className="block space-y-2">Capital<input className={fieldClass} value={capital} onChange={e => setCapital(e.target.value)} /></label>
        <label className="block space-y-2">Lema (opcional)<input className={fieldClass} value={motto} onChange={e => setMotto(e.target.value)} /></label>
      </div>}
      {step === 10 && (!quizFinished ? <Quiz answers={answers} onAnswer={(id: string, answer: Answer) => setAnswers(current => ({ ...current, [id]: answer }))} onFinish={() => { if (!missingQuestions(answers).length) setQuizFinished(true) }} /> :
        <div className="space-y-3"><p>Escolha a ideologia governante:</p>{topThree(scores!).map(x => <label key={x.archetype.id} className="flex gap-2"><input type="radio" name="ideology" checked={ideology === x.archetype.id} onChange={() => setIdeology(x.archetype.id)} />{x.archetype.name} ({x.affinity}% de afinidade)</label>)}</div>)}
      {step === 11 && <div className="space-y-2">
        <p><strong>País:</strong> {officialName}</p><p><strong>Capital:</strong> {capital}</p>
        <p><strong>Governo:</strong> {LABELS.governmentForm[governmentForm]}, {LABELS.regime[regime]}</p>
        <p><strong>Território:</strong> ainda não selecionado</p>
        <p className="text-amber-400">Fundação indisponível: aguardando integração segura com o mapa e o Supabase.</p>
      </div>}
    </section>
    <div className="flex justify-between gap-4">
      <button type="button" className={buttonClass} disabled={step === 0} onClick={() => setStep(s => s - 1)}>Anterior</button>
      <button type="button" className={buttonClass} disabled={!valid || step === STEPS.length - 1} onClick={() => setStep(s => s + 1)}>Próximo</button>
    </div>
  </main>
}
