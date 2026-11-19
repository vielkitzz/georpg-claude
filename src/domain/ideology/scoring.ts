import { AXES, AXIS_IDS, type AxisScores } from './axes'
import { ARCHETYPES, type Archetype } from './archetypes'
import { QUESTIONS } from './questions'
import { createRng, pick, type Rng } from '../founding/rng'

export type Answer = 1 | 2 | 3 | 4 | 5
/** Respostas por id de pergunta. */
export type Answers = Record<string, Answer | undefined>

export class QuizIncompleteError extends Error {
  readonly missing: string[]
  constructor(missing: string[]) {
    super(`Faltam ${missing.length} resposta(s) do questionário.`)
    this.name = 'QuizIncompleteError'
    this.missing = missing
  }
}

export const isAnswer = (value: unknown): value is Answer =>
  value === 1 || value === 2 || value === 3 || value === 4 || value === 5

/** Ids das perguntas ainda sem resposta válida. */
export const missingQuestions = (answers: Answers): string[] =>
  QUESTIONS.filter((question) => !isAnswer(answers[question.id])).map((question) => question.id)

/**
 * Pontuação por eixo, de 0 a 100: cada resposta vira 0..100 (1 → 0, 5 → 100),
 * invertida nas afirmações de polaridade −1; o eixo é a média das 3 perguntas.
 * Lança QuizIncompleteError se faltar qualquer resposta.
 */
export function scoreQuiz(answers: Answers): AxisScores {
  const missing = missingQuestions(answers)
  if (missing.length) throw new QuizIncompleteError(missing)

  const scores = {} as AxisScores
  for (const axis of AXIS_IDS) {
    const own = QUESTIONS.filter((question) => question.axis === axis)
    const total = own.reduce((sum, question) => {
      const raw = ((answers[question.id] as Answer) - 1) * 25
      return sum + (question.polarity === 1 ? raw : 100 - raw)
    }, 0)
    scores[axis] = Math.round((total / own.length) * 10) / 10
  }
  return scores
}

/** Bússola política: x = econômico (0 coletivista → 100 mercado), y = autoridade (0 liberdade → 100 autocracia). */
export function compass(scores: AxisScores): { x: number; y: number } {
  const mean = (values: number[]) =>
    Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
  return {
    x: mean([
      scores.coletivismo_propriedade,
      scores.planejamento_livremercado,
      scores.protecionismo_livrecomercio,
    ]),
    y: mean([scores.democratico_autocratico, scores.liberdade_seguranca]),
  }
}

export interface ArchetypeMatch {
  archetype: Archetype
  /** Distância quadrática média entre o perfil do jogador e o do arquétipo (0 = idêntico). */
  distance: number
  /** 0 a 100, maior = mais próximo. */
  affinity: number
}

/** Os 11 arquétipos ordenados por proximidade. */
export function rankArchetypes(scores: AxisScores): ArchetypeMatch[] {
  return ARCHETYPES.map((archetype) => {
    const squares = AXIS_IDS.map((axis) => (scores[axis] - archetype.profile[axis]) ** 2)
    const distance = Math.sqrt(squares.reduce((a, b) => a + b, 0) / squares.length)
    return { archetype, distance, affinity: Math.max(0, Math.round(100 - distance)) }
  }).sort((a, b) => a.distance - b.distance || a.archetype.id.localeCompare(b.archetype.id))
}

/** As 3 ideologias entre as quais o jogador escolhe a governante. */
export const topThree = (scores: AxisScores): ArchetypeMatch[] => rankArchetypes(scores).slice(0, 3)

/** Respostas aleatórias para testes. Só deve ser exposta a administradores. */
export function randomAnswers(rng: Rng = createRng(Date.now())): Answers {
  const options: readonly Answer[] = [1, 2, 3, 4, 5]
  return Object.fromEntries(QUESTIONS.map((question) => [question.id, pick(rng, options)]))
}

export const AXIS_BY_ID = Object.fromEntries(AXES.map((axis) => [axis.id, axis]))
