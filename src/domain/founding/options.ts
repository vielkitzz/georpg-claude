import { validateFoundingText } from './draft.ts'

/**
 * Opções institucionais da fundação e suas combinações válidas.
 * O navegador só MOSTRA o que é válido; o servidor revalida com estas mesmas funções.
 */
export type GovernmentForm = 'republica' | 'monarquia' | 'teocracia'
export type Regime = 'democratico' | 'autoritario' | 'totalitario' | 'absolutista' | 'colonial'
export type GovernmentSystem =
  'parlamentarismo' | 'presidencialismo' | 'semipresidencialismo' | 'diretorial' | 'concentracao'
export type StateForm = 'unitario' | 'federal' | 'confederado'
export type LocalSelection = 'eleitos' | 'nomeados' | 'misto'
export type LeadershipBasis =
  'hereditario' | 'divino' | 'nomeado' | 'eleito_direto' | 'eleito_indireto' | 'autoproclamado'

export const GOVERNMENT_FORMS: readonly GovernmentForm[] = ['republica', 'monarquia', 'teocracia']
export const REGIMES: readonly Regime[] = [
  'democratico',
  'autoritario',
  'totalitario',
  'absolutista',
  'colonial',
]
export const GOVERNMENT_SYSTEMS: readonly GovernmentSystem[] = [
  'parlamentarismo',
  'presidencialismo',
  'semipresidencialismo',
  'diretorial',
  'concentracao',
]
export const STATE_FORMS: readonly StateForm[] = ['unitario', 'federal', 'confederado']
export const LOCAL_SELECTIONS: readonly LocalSelection[] = ['eleitos', 'nomeados', 'misto']

export const LABELS = {
  governmentForm: { republica: 'República', monarquia: 'Monarquia', teocracia: 'Teocracia' },
  regime: {
    democratico: 'Democrático',
    autoritario: 'Autoritário',
    totalitario: 'Totalitário',
    absolutista: 'Absolutista',
    colonial: 'Colonial',
  },
  system: {
    parlamentarismo: 'Parlamentarismo',
    presidencialismo: 'Presidencialismo',
    semipresidencialismo: 'Semipresidencialismo',
    diretorial: 'Diretorial',
    concentracao: 'Concentração de poderes',
  },
  stateForm: { unitario: 'Unitário', federal: 'Federal', confederado: 'Confederado' },
  localSelection: { eleitos: 'Eleitos', nomeados: 'Nomeados', misto: 'Misto' },
  leadershipBasis: {
    hereditario: 'Hereditário',
    divino: 'Divino',
    nomeado: 'Nomeado',
    eleito_direto: 'Eleito diretamente',
    eleito_indireto: 'Eleito indiretamente',
    autoproclamado: 'Autoproclamado',
  },
} as const

/**
 * Sistemas de governo permitidos:
 * - absolutismo → só concentração de poderes;
 * - monarquia democrática → só parlamentarismo;
 * - democracia nunca usa concentração de poderes.
 */
export function validSystems(form: GovernmentForm, regime: Regime): GovernmentSystem[] {
  if (regime === 'absolutista') return ['concentracao']
  if (form === 'monarquia' && regime === 'democratico') return ['parlamentarismo']
  if (regime === 'democratico') return GOVERNMENT_SYSTEMS.filter((s) => s !== 'concentracao')
  return [...GOVERNMENT_SYSTEMS]
}

/**
 * Base do cargo de chefe de Estado:
 * monarquia → hereditário; teocracia → divino ou nomeado;
 * república democrática → eleito direto ou indireto;
 * demais repúblicas → eleito indireto, nomeado ou autoproclamado.
 */
export function validLeadershipBases(form: GovernmentForm, regime: Regime): LeadershipBasis[] {
  if (form === 'monarquia') return ['hereditario']
  if (form === 'teocracia') return ['divino', 'nomeado']
  if (regime === 'democratico') return ['eleito_direto', 'eleito_indireto']
  return ['eleito_indireto', 'nomeado', 'autoproclamado']
}

/** Parlamentarismo e semipresidencialismo têm chefe de Governo à parte do chefe de Estado. */
export const requiresHeadOfGovernment = (system: GovernmentSystem): boolean =>
  system === 'parlamentarismo' || system === 'semipresidencialismo'

export function firstLevelDivisions(stateForm: StateForm): string[] {
  return stateForm === 'federal'
    ? ['Estados']
    : ['Províncias', 'Departamentos', 'Distritos', 'Regiões', 'Condados']
}

export const SECOND_LEVEL_DIVISIONS: readonly string[] = [
  'Municípios',
  'Concelhos',
  'Comunas',
  'Distritos',
]

/** Federal sugere eleitos; os demais, nomeados. */
export const suggestedLocalSelection = (stateForm: StateForm): LocalSelection =>
  stateForm === 'federal' ? 'eleitos' : 'nomeados'

/** Legitimidade inicial: eleitos +5, nomeados −5, misto 0. */
export const localSelectionLegitimacy = (selection: LocalSelection): number =>
  selection === 'eleitos' ? 5 : selection === 'nomeados' ? -5 : 0

export interface Leader {
  title: string
  name: string
}

export interface InstitutionsInput {
  governmentForm: GovernmentForm
  regime: Regime
  system: GovernmentSystem
  stateForm: StateForm
  firstLevel: string
  secondLevel: string
  localSelection: LocalSelection
  leadershipBasis: LeadershipBasis
  headOfState: Leader
  headOfGovernment?: Leader
}

const inList = <T>(list: readonly T[], value: T) => list.includes(value)
const validLeader = (leader: Leader | undefined) =>
  validateFoundingText(leader?.title, 2, 60) && validateFoundingText(leader?.name, 2, 60)

/** Lista os problemas do conjunto institucional (vazia = válido). */
export function validateInstitutions(input: InstitutionsInput): string[] {
  const errors: string[] = []
  if (!inList(GOVERNMENT_FORMS, input.governmentForm)) errors.push('Forma de governo inválida.')
  if (!inList(REGIMES, input.regime)) errors.push('Regime inválido.')
  if (!inList(STATE_FORMS, input.stateForm)) errors.push('Forma de Estado inválida.')
  if (!inList(LOCAL_SELECTIONS, input.localSelection)) {
    errors.push('Escolha dos governantes locais inválida.')
  }
  if (errors.length) return errors

  if (!inList(validSystems(input.governmentForm, input.regime), input.system)) {
    errors.push('Esse sistema de governo não combina com a forma de governo e o regime.')
  }
  if (!inList(validLeadershipBases(input.governmentForm, input.regime), input.leadershipBasis)) {
    errors.push('Essa base do cargo não combina com a forma de governo e o regime.')
  }
  if (!inList(firstLevelDivisions(input.stateForm), input.firstLevel)) {
    errors.push('Divisão de primeiro nível inválida para essa forma de Estado.')
  }
  if (!inList(SECOND_LEVEL_DIVISIONS, input.secondLevel)) {
    errors.push('Divisão de segundo nível inválida.')
  }
  if (!validLeader(input.headOfState)) {
    errors.push('Informe o título e o nome do chefe de Estado (2 a 60 caracteres).')
  }
  if (requiresHeadOfGovernment(input.system)) {
    const head = input.headOfGovernment
    if (!validLeader(head)) {
      errors.push('Informe o título e o nome do chefe de Governo (2 a 60 caracteres).')
    }
  } else if (input.headOfGovernment) {
    errors.push('Esse sistema de governo não tem chefe de Governo separado.')
  }
  return errors
}
