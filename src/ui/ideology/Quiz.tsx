import { ArrowLeft, Dices } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  ANSWER_LABELS,
  AXES,
  CHAPTERS,
  QUESTIONS,
  missingQuestions,
  type Answer,
  type Answers,
} from '@/domain/ideology'
import { primaryButton, secondaryButton } from '@/ui/CenteredScreen'

const ANSWER_VALUES: readonly Answer[] = [1, 2, 3, 4, 5]

interface Props {
  answers: Answers
  onAnswer: (questionId: string, answer: Answer) => void
  onFinish: () => void
  /** Preenchimento aleatório: só aparece para administradores (testes). */
  onRandomFill?: () => void
}

/** Uma pergunta por vez, 5 respostas, atalho de teclado 1 a 5 e botão de voltar. */
export function Quiz({ answers, onAnswer, onFinish, onRandomFill }: Props) {
  const [index, setIndex] = useState(0)
  const question = QUESTIONS[index]
  const chapterId = AXES.find((axis) => axis.id === question.axis)?.chapter
  const chapter = CHAPTERS.find((item) => item.id === chapterId)
  const complete = missingQuestions(answers).length === 0
  const current = answers[question.id]

  const choose = (answer: Answer) => {
    onAnswer(question.id, answer)
    if (index < QUESTIONS.length - 1) setIndex(index + 1)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const value = Number(event.key)
      if (value >= 1 && value <= 5) {
        onAnswer(question.id, value as Answer)
        setIndex((i) => Math.min(i + 1, QUESTIONS.length - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question.id, onAnswer])

  return (
    <section aria-labelledby="pergunta" className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <div className="mb-2 flex items-baseline justify-between text-sm text-muted">
          <span>Capítulo {chapter?.title}</span>
          <span>
            {index + 1}/{QUESTIONS.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso do questionário"
          aria-valuemin={1}
          aria-valuemax={QUESTIONS.length}
          aria-valuenow={index + 1}
          className="h-2 overflow-hidden rounded-full bg-raised"
        >
          <div
            className="h-full bg-primary transition-[width]"
            style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <h2 id="pergunta" className="subtitle text-2xl leading-snug">
        {question.text}
      </h2>

      <div role="radiogroup" aria-labelledby="pergunta" className="flex flex-col gap-2">
        {ANSWER_VALUES.map((value) => {
          const selected = current === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(value)}
              className={`flex items-center gap-4 rounded-md border px-4 py-3 text-left transition-colors ${
                selected
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line bg-panel hover:bg-raised'
              }`}
            >
              <span
                aria-hidden
                className={`grid size-7 place-items-center rounded-sm border text-sm font-semibold ${
                  selected ? 'border-on-primary' : 'border-line text-muted'
                }`}
              >
                {value}
              </span>
              {ANSWER_LABELS[value - 1]}
            </button>
          )
        })}
      </div>
      <p className="text-sm text-muted">Dica: use as teclas 1 a 5 para responder.</p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setIndex(index - 1)}
          disabled={index === 0}
          className={`${secondaryButton} flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <ArrowLeft size={18} aria-hidden />
          Voltar à pergunta anterior
        </button>
        {complete && (
          <button type="button" onClick={onFinish} className={primaryButton}>
            Ver resultado
          </button>
        )}
        {onRandomFill && (
          <button
            type="button"
            onClick={onRandomFill}
            className={`${secondaryButton} ml-auto flex items-center gap-2`}
          >
            <Dices size={18} aria-hidden />
            Preencher aleatoriamente (admin)
          </button>
        )}
      </div>
      {!complete && (
        <p className="text-sm text-muted" role="status">
          Faltam {missingQuestions(answers).length} resposta(s) para ver o resultado.
        </p>
      )}
    </section>
  )
}
