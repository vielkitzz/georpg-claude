import { AXES, AXIS_IDS, CHAPTERS } from './axes'
import { ARCHETYPES } from './archetypes'
import { analyzeCoherence, initialLegitimacy, MAX_COHERENCE_PENALTY } from './coherence'
import { leanOf, portrait } from './portrait'
import { QUESTIONS } from './questions'
import {
  QuizIncompleteError,
  compass,
  randomAnswers,
  rankArchetypes,
  scoreQuiz,
  topThree,
  type Answers,
} from './scoring'
import { createRng } from '../founding/rng'

const answersFor = (pick: (polarity: 1 | -1) => 1 | 2 | 3 | 4 | 5): Answers =>
  Object.fromEntries(QUESTIONS.map((q) => [q.id, pick(q.polarity)]))

describe('estrutura do questionário', () => {
  it('são 36 afirmações: 4 capítulos × 3 eixos × 3 perguntas', () => {
    expect(QUESTIONS).toHaveLength(36)
    expect(CHAPTERS).toHaveLength(4)
    expect(AXES).toHaveLength(12)
    for (const chapter of CHAPTERS) {
      expect(AXES.filter((axis) => axis.chapter === chapter.id)).toHaveLength(3)
    }
    for (const axis of AXIS_IDS) {
      expect(QUESTIONS.filter((q) => q.axis === axis)).toHaveLength(3)
    }
  })

  it('os ids são únicos e as perguntas vêm agrupadas por capítulo', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(36)
    const chapters = QUESTIONS.map((q) => AXES.find((a) => a.id === q.axis)?.chapter)
    const order = CHAPTERS.map((c) => c.id)
    const indices = chapters.map((c) => order.indexOf(c!))
    expect([...indices].sort((a, b) => a - b)).toEqual(indices)
  })

  it('cada eixo tem afirmações dos dois sentidos (polaridade invertida em parte)', () => {
    for (const axis of AXIS_IDS) {
      const polarities = new Set(QUESTIONS.filter((q) => q.axis === axis).map((q) => q.polarity))
      expect(polarities.size).toBe(2)
    }
  })
})

describe('scoreQuiz', () => {
  it('lança erro claro se faltar resposta, listando quais', () => {
    const answers = answersFor(() => 3)
    delete answers['federal_unitario-1']
    answers['aceleracao_cautela-3'] = undefined
    try {
      scoreQuiz(answers)
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(QuizIncompleteError)
      expect((error as QuizIncompleteError).missing).toEqual([
        'federal_unitario-1',
        'aceleracao_cautela-3',
      ])
      expect((error as Error).message).toBe('Faltam 2 resposta(s) do questionário.')
    }
  })

  it('recusa respostas fora de 1 a 5', () => {
    const answers = answersFor(() => 3)
    ;(answers as Record<string, unknown>)['federal_unitario-1'] = 7
    expect(() => scoreQuiz(answers)).toThrow(QuizIncompleteError)
  })

  it('tudo neutro dá 50 em todos os eixos', () => {
    const scores = scoreQuiz(answersFor(() => 3))
    for (const axis of AXIS_IDS) expect(scores[axis]).toBe(50)
  })

  it('concordar com tudo que leva ao polo alto dá 100 em todos os eixos', () => {
    const scores = scoreQuiz(answersFor((p) => (p === 1 ? 5 : 1)))
    for (const axis of AXIS_IDS) expect(scores[axis]).toBe(100)
  })

  it('a polaridade invertida espelha o resultado (0 em todos os eixos)', () => {
    const scores = scoreQuiz(answersFor((p) => (p === 1 ? 1 : 5)))
    for (const axis of AXIS_IDS) expect(scores[axis]).toBe(0)
  })

  it('concordar com tudo, cegamente, não vira extremo (as invertidas compensam)', () => {
    const scores = scoreQuiz(answersFor(() => 5))
    for (const axis of AXIS_IDS) {
      expect(scores[axis]).toBeGreaterThan(20)
      expect(scores[axis]).toBeLessThan(80)
    }
  })
})

describe('arquétipos', () => {
  it('são 11, com ids únicos e perfis completos entre 0 e 100', () => {
    expect(ARCHETYPES).toHaveLength(11)
    expect(new Set(ARCHETYPES.map((a) => a.id)).size).toBe(11)
    for (const archetype of ARCHETYPES) {
      for (const axis of AXIS_IDS) {
        expect(archetype.profile[axis]).toBeGreaterThanOrEqual(0)
        expect(archetype.profile[axis]).toBeLessThanOrEqual(100)
      }
    }
  })

  it('o perfil de cada arquétipo é, ele mesmo, o mais próximo de si', () => {
    for (const archetype of ARCHETYPES) {
      expect(rankArchetypes(archetype.profile)[0].archetype.id).toBe(archetype.id)
    }
  })

  it('o ranking tem os 11, ordenados por proximidade, e top 3 tem 3', () => {
    const scores = scoreQuiz(randomAnswers(createRng('rank')))
    const ranking = rankArchetypes(scores)
    expect(ranking).toHaveLength(11)
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i].distance).toBeGreaterThanOrEqual(ranking[i - 1].distance)
    }
    expect(topThree(scores)).toHaveLength(3)
    expect(ranking[0].affinity).toBeGreaterThanOrEqual(ranking[10].affinity)
  })

  it('quem concorda com a descrição de um perfil fica mais perto dele', () => {
    const scores = { ...ARCHETYPES.find((a) => a.id === 'absolutista')!.profile }
    expect(topThree(scores)[0].archetype.id).toBe('absolutista')
  })
})

describe('bússola', () => {
  it('fica entre 0 e 100 e reage ao eixo econômico e ao de autoridade', () => {
    const left = compass(scoreQuiz(answersFor((p) => (p === 1 ? 1 : 5))))
    const right = compass(scoreQuiz(answersFor((p) => (p === 1 ? 5 : 1))))
    expect(left).toEqual({ x: 0, y: 0 })
    expect(right).toEqual({ x: 100, y: 100 })
  })
})

describe('respostas aleatórias', () => {
  it('são completas, válidas e determinísticas com a mesma semente', () => {
    const a = randomAnswers(createRng('s'))
    const b = randomAnswers(createRng('s'))
    expect(a).toEqual(b)
    expect(() => scoreQuiz(a)).not.toThrow()
  })
})

describe('retrato textual', () => {
  it('um parágrafo por capítulo; eixos equilibrados ficam de fora', () => {
    const neutral = portrait(scoreQuiz(answersFor(() => 3)))
    expect(neutral).toHaveLength(4)
    for (const part of neutral) expect(part.text).toMatch(/equilibrado/)
  })

  it('descreve as posições marcadas', () => {
    const text = portrait(scoreQuiz(answersFor((p) => (p === 1 ? 5 : 1))))
      .map((p) => p.text)
      .join(' ')
    expect(text).toMatch(/Estado unificado/)
    expect(text).toMatch(/propriedade privada/)
  })

  it('classifica as inclinações pelos limites 35 e 65', () => {
    expect(leanOf(34.9)).toBe('low')
    expect(leanOf(35)).toBe('mid')
    expect(leanOf(65)).toBe('mid')
    expect(leanOf(65.1)).toBe('high')
  })
})

describe('análise de coerência', () => {
  const neutral = scoreQuiz(answersFor(() => 3))
  const republic = {
    governmentForm: 'republica' as const,
    regime: 'democratico' as const,
    stateForm: 'unitario' as const,
    localSelection: 'misto' as const,
  }

  it('perfil neutro não gera tensões', () => {
    expect(analyzeCoherence(neutral, republic)).toEqual({ tensions: [], penalty: 0 })
  })

  it('centralista que funda Estado federal gera tensão proporcional', () => {
    const mild = analyzeCoherence(
      { ...neutral, federal_unitario: 70 },
      { ...republic, stateForm: 'federal' },
    )
    const strong = analyzeCoherence(
      { ...neutral, federal_unitario: 100 },
      { ...republic, stateForm: 'federal' },
    )
    expect(mild.tensions.map((t) => t.id)).toEqual(['federal-vs-centralista'])
    expect(strong.penalty).toBeGreaterThan(mild.penalty)
    expect(strong.tensions[0].penalty).toBe(5)
  })

  it('autocrata em regime democrático e democrata em regime autoritário geram tensão', () => {
    expect(
      analyzeCoherence({ ...neutral, democratico_autocratico: 90 }, republic).tensions,
    ).toHaveLength(1)
    expect(
      analyzeCoherence(
        { ...neutral, democratico_autocratico: 10 },
        { ...republic, regime: 'autoritario' },
      ).tensions,
    ).toHaveLength(1)
  })

  it('laico em teocracia e progressista em monarquia geram tensão', () => {
    expect(
      analyzeCoherence(
        { ...neutral, secular_religioso: 5 },
        { ...republic, governmentForm: 'teocracia' },
      ).tensions,
    ).toHaveLength(1)
    expect(
      analyzeCoherence(
        { ...neutral, progressista_tradicional: 5 },
        { ...republic, governmentForm: 'monarquia' },
      ).tensions,
    ).toHaveLength(1)
  })

  it('a penalidade total é limitada', () => {
    const extreme = scoreQuiz(answersFor((p) => (p === 1 ? 5 : 1)))
    const result = analyzeCoherence(extreme, {
      governmentForm: 'teocracia',
      regime: 'democratico',
      stateForm: 'federal',
      localSelection: 'eleitos',
    })
    expect(result.penalty).toBeLessThanOrEqual(MAX_COHERENCE_PENALTY)
  })
})

describe('initialLegitimacy', () => {
  it('base 55; eleitos +5, nomeados −5, menos a penalidade', () => {
    expect(initialLegitimacy('misto', 0)).toBe(55)
    expect(initialLegitimacy('eleitos', 0)).toBe(60)
    expect(initialLegitimacy('nomeados', 0)).toBe(50)
    expect(initialLegitimacy('eleitos', 7)).toBe(53)
  })

  it('fica entre 0 e 100', () => {
    expect(initialLegitimacy('nomeados', 99)).toBe(0)
  })
})
