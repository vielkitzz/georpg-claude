import { useState } from 'react'
import { drawQuiz } from '@/data/foundingApi'
import { useAuth } from '@/auth/AuthContext'
import {
  LABELS,
  GOVERNMENT_FORMS,
  LOCAL_SELECTIONS,
  REGIMES,
  STATE_FORMS,
  type GovernmentForm,
  type LocalSelection,
  type Regime,
  type StateForm,
} from '@/domain/founding/options'
import { scoreQuiz, topThree, type Answer, type Answers, type ArchetypeId } from '@/domain/ideology'
import { PageTitle, Panel } from '@/ui/Panel'
import { secondaryButton } from '@/ui/CenteredScreen'
import { Quiz } from '@/ui/ideology/Quiz'
import { Report } from '@/ui/ideology/Report'

function Select<T extends string>({
  label,
  value,
  options,
  names,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  names: Record<T, string>
  onChange: (value: T) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="rounded-md border border-line bg-bg px-3 py-2"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {names[option]}
          </option>
        ))}
      </select>
    </label>
  )
}

export function QuizPreviewPage() {
  const { role } = useAuth()
  const [answers, setAnswers] = useState<Answers>({})
  const [finished, setFinished] = useState(false)
  const [ideology, setIdeology] = useState<ArchetypeId | null>(null)
  const [form, setForm] = useState<GovernmentForm>('republica')
  const [regime, setRegime] = useState<Regime>('democratico')
  const [stateForm, setStateForm] = useState<StateForm>('unitario')
  const [local, setLocal] = useState<LocalSelection>('nomeados')
  const [drawing, setDrawing] = useState(false)
  const [drawError, setDrawError] = useState('')

  const scores = finished ? scoreQuiz(answers) : null

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle note="Página de teste do questionário ideológico. As instituições abaixo só servem para ver a análise de coerência.">
        Questionário ideológico
      </PageTitle>

      {!scores ? (
        <Quiz
          answers={answers}
          onAnswer={(id: string, answer: Answer) =>
            setAnswers((current) => ({ ...current, [id]: answer }))
          }
          onFinish={() => setFinished(true)}
          busy={drawing}
          onRandomFill={
            role === 'ADMIN'
              ? async () => {
                  setDrawing(true)
                  setDrawError('')
                  const result = await drawQuiz()
                  if ('error' in result) setDrawError(result.error)
                  else setAnswers(result.answers)
                  setDrawing(false)
                }
              : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <Panel title="Instituições (só para teste)">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                label="Forma de governo"
                value={form}
                options={GOVERNMENT_FORMS}
                names={LABELS.governmentForm}
                onChange={setForm}
              />
              <Select
                label="Regime"
                value={regime}
                options={REGIMES}
                names={LABELS.regime}
                onChange={setRegime}
              />
              <Select
                label="Forma de Estado"
                value={stateForm}
                options={STATE_FORMS}
                names={LABELS.stateForm}
                onChange={setStateForm}
              />
              <Select
                label="Governantes locais"
                value={local}
                options={LOCAL_SELECTIONS}
                names={LABELS.localSelection}
                onChange={setLocal}
              />
            </div>
          </Panel>
          <Report
            scores={scores}
            institutions={{ governmentForm: form, regime, stateForm, localSelection: local }}
            selectedIdeology={ideology ?? topThree(scores)[0].archetype.id}
            onSelectIdeology={setIdeology}
          />
          <button
            type="button"
            className={`${secondaryButton} self-start`}
            onClick={() => {
              setAnswers({})
              setFinished(false)
              setIdeology(null)
            }}
          >
            Refazer o questionário
          </button>
        </div>
      )}
      {drawError && (
        <p role="alert" className="text-warning">
          {drawError}
        </p>
      )}
    </div>
  )
}
