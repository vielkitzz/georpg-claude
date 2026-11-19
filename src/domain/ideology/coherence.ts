import type { AxisScores } from './axes.ts'
import {
  localSelectionLegitimacy,
  type GovernmentForm,
  type LocalSelection,
  type Regime,
  type StateForm,
} from '../founding/options.ts'

export interface Tension {
  id: string
  message: string
  /** 0 a 1: quão além do limite o perfil está. */
  intensity: number
  /** Pontos de legitimidade perdidos por esta tensão (1 a 5). */
  penalty: number
}

export interface Coherence {
  tensions: Tension[]
  /** Soma das penalidades, limitada a 25. */
  penalty: number
}

export interface ChosenInstitutions {
  governmentForm: GovernmentForm
  regime: Regime
  stateForm: StateForm
  localSelection: LocalSelection
}

export const BASE_LEGITIMACY = 55
export const MAX_COHERENCE_PENALTY = 25

/** Fração (0 a 1) em que `value` passa de `threshold`, até `limit`. */
const beyond = (value: number, threshold: number, limit: number) =>
  Math.max(0, Math.min(1, (value - threshold) / (limit - threshold)))

/**
 * Analisa tensões entre o perfil do jogador e as instituições escolhidas.
 * A penalidade de legitimidade cresce com o número e a intensidade das tensões.
 */
export function analyzeCoherence(scores: AxisScores, chosen: ChosenInstitutions): Coherence {
  const found: { id: string; message: string; intensity: number }[] = []
  const add = (id: string, message: string, intensity: number) => {
    if (intensity > 0) found.push({ id, message, intensity })
  }

  const unitary = scores.federal_unitario
  add(
    'federal-vs-centralista',
    'Seu perfil defende um governo central forte, mas você fundou um Estado federal.',
    chosen.stateForm === 'federal' ? beyond(unitary, 65, 100) : 0,
  )
  add(
    'unitario-vs-autonomista',
    'Seu perfil defende autonomia regional, mas você fundou um Estado unitário.',
    chosen.stateForm === 'unitario' ? beyond(100 - unitary, 65, 100) : 0,
  )
  add(
    'confederado-vs-centralista',
    'Seu perfil prefere um centro forte, mas uma confederação deixa o poder com as partes.',
    chosen.stateForm === 'confederado' ? beyond(unitary, 55, 100) : 0,
  )

  const autocratic = scores.democratico_autocratico
  const democratic = chosen.regime === 'democratico'
  const authoritarian =
    chosen.regime === 'autoritario' ||
    chosen.regime === 'totalitario' ||
    chosen.regime === 'absolutista'
  add(
    'democracia-vs-autocrata',
    'Seu perfil prefere decisões concentradas, mas você escolheu um regime democrático.',
    democratic ? beyond(autocratic, 65, 100) : 0,
  )
  add(
    'autocracia-vs-democrata',
    'Seu perfil defende o poder compartilhado e o voto, mas você escolheu um regime sem democracia.',
    authoritarian ? beyond(100 - autocratic, 65, 100) : 0,
  )
  add(
    'totalitario-vs-liberdade',
    'Seu perfil valoriza as liberdades civis, mas você escolheu um regime totalitário.',
    chosen.regime === 'totalitario' ? beyond(100 - scores.liberdade_seguranca, 60, 100) : 0,
  )
  add(
    'locais-eleitos-vs-autocrata',
    'Seu perfil prefere o comando centralizado, mas você deixou os governantes locais serem eleitos.',
    chosen.localSelection === 'eleitos' ? beyond(autocratic, 70, 100) : 0,
  )
  add(
    'locais-nomeados-vs-democrata',
    'Seu perfil defende o voto, mas você fez os governantes locais serem nomeados.',
    chosen.localSelection === 'nomeados' ? beyond(100 - autocratic, 70, 100) : 0,
  )
  add(
    'teocracia-vs-secular',
    'Seu perfil é laico, mas você fundou uma teocracia.',
    chosen.governmentForm === 'teocracia' ? beyond(100 - scores.secular_religioso, 60, 100) : 0,
  )
  add(
    'monarquia-vs-progressista',
    'Seu perfil é progressista, mas você fundou uma monarquia.',
    chosen.governmentForm === 'monarquia'
      ? beyond(100 - scores.progressista_tradicional, 70, 100)
      : 0,
  )

  const tensions: Tension[] = found.map((tension) => ({
    ...tension,
    penalty: Math.round(1 + tension.intensity * 4),
  }))
  const penalty = Math.min(
    MAX_COHERENCE_PENALTY,
    tensions.reduce((sum, tension) => sum + tension.penalty, 0),
  )
  return { tensions, penalty }
}

/** Legitimidade inicial: base, ± governantes locais, − penalidade de coerência (0 a 100). */
export function initialLegitimacy(
  localSelection: LocalSelection,
  coherencePenalty: number,
): number {
  const value = BASE_LEGITIMACY + localSelectionLegitimacy(localSelection) - coherencePenalty
  return Math.max(0, Math.min(100, Math.round(value)))
}
