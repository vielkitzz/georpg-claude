import { ARTICLES, validateNationName } from '../../../src/domain/founding/name.ts'
import { generateInitialConditions } from '../../../src/domain/founding/generator.ts'
import {
  GOVERNMENT_FORMS,
  STATE_FORMS,
  validateInstitutions,
} from '../../../src/domain/founding/options.ts'
import {
  isTerritoryId,
  validateEconomy,
  validateSymbols,
  type FoundingDraft,
} from '../../../src/domain/founding/draft.ts'
import { analyzeCoherence, initialLegitimacy } from '../../../src/domain/ideology/coherence.ts'
import {
  missingQuestions,
  randomAnswers,
  scoreQuiz,
  topThree,
} from '../../../src/domain/ideology/scoring.ts'
import { QUESTIONS } from '../../../src/domain/ideology/questions.ts'
import { simulationDateAt } from '../../../src/domain/time.ts'

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

function getName(input: FoundingDraft) {
  const {
    shortName,
    article,
    institutions: { governmentForm, stateForm },
  } = input
  return validateNationName({ shortName, article, governmentForm, stateForm }, new Set())
}

export const setupError = (draft: unknown) => {
  if (!record(draft) || !isTerritoryId(draft.territoryId)) return 'Selecione um território válido.'
  if (typeof draft.shortName !== 'string' || !record(draft.institutions))
    return 'Informe o nome e as instituições.'
  const input = draft as unknown as FoundingDraft
  if (!ARTICLES.includes(input.article)) return 'Artigo inválido.'
  if (
    !GOVERNMENT_FORMS.includes(input.institutions.governmentForm) ||
    !STATE_FORMS.includes(input.institutions.stateForm)
  ) {
    return 'Forma de governo ou de Estado inválida.'
  }
  return getName(input).error
}

export function randomQuizForRole(role: unknown) {
  return role === 'ADMIN' ? randomAnswers() : null
}

export function prepareFounding(draft: unknown, tick: number) {
  const error = setupError(draft)
  if (error) return { error } as const
  const input = draft as FoundingDraft
  const { institutions: politics, answers, symbols } = input
  const fieldError = validateEconomy(input)
  if (fieldError) return { error: fieldError } as const
  const institutionError = validateInstitutions(politics)[0]
  if (institutionError) return { error: institutionError } as const
  if (
    !record(answers) ||
    Object.keys(answers).length !== QUESTIONS.length ||
    missingQuestions(answers).length
  ) {
    return { error: 'Responda às 36 afirmações do questionário.' } as const
  }
  const scores = scoreQuiz(answers)
  const ideology = topThree(scores).find(({ archetype }) => archetype.id === input.ideology)
    ?.archetype.id
  if (!ideology) return { error: 'Escolha uma das três ideologias mais próximas.' } as const
  if (!record(symbols)) return { error: 'Preencha a identidade simbólica.' } as const
  const symbolError = validateSymbols(symbols)
  if (symbolError) return { error: symbolError } as const
  const head = (leader: typeof politics.headOfState) => ({
    title: leader.title.trim(),
    name: leader.name.trim(),
  })
  const name = getName(input)
  const coherence = analyzeCoherence(scores, politics)
  const legitimacy = initialLegitimacy(politics.localSelection, coherence.penalty)
  const { ministries, chambers, approval, ...economy } = generateInitialConditions({
    ...politics,
    seed: `${name.key}:${input.territoryId}`,
    ideology,
    legitimacy,
    legitimacyPenalty: -coherence.penalty,
  })
  const year = simulationDateAt(tick).year
  const fields = {
    p_name: name.officialName,
    p_name_key: name.key,
    p_slug: name.slug,
    p_short_name: input.shortName.trim(),
    p_capital: input.capital.trim(),
    p_region_id: input.territoryId,
    p_regime: politics.regime,
    p_currency_code: input.currencyCode,
    p_currency_name: input.currencyName.trim(),
    p_motto: symbols.motto.trim(),
    p_anthem: symbols.anthem.trim(),
    p_description: symbols.description.trim(),
    p_history: symbols.history.trim(),
    p_symbols: {
      emblem: symbols.emblem.trim(),
      flag: symbols.flag,
      coatOfArms: symbols.coatOfArms,
    },
    p_politics: {
      governmentForm: politics.governmentForm,
      regime: politics.regime,
      system: politics.system,
      stateForm: politics.stateForm,
      firstLevel: politics.firstLevel,
      secondLevel: politics.secondLevel,
      localSelection: politics.localSelection,
      leadershipBasis: politics.leadershipBasis,
      headOfState: head(politics.headOfState),
      ...(politics.headOfGovernment ? { headOfGovernment: head(politics.headOfGovernment) } : {}),
      ideology,
      legitimacy,
      ministries,
      chambers,
      ideologyScores: scores,
      ideologyAnswers: answers,
      coherencePenalty: coherence.penalty,
      events: [{ type: 'fundacao', title: `Fundação de ${name.officialName}`, tickIndex: tick }],
    },
    p_economy: economy,
    p_society: { approval },
    p_color: symbols.color.toUpperCase(),
    p_world_tick: tick,
    p_founded_year: year,
  }
  return {
    fields,
    preview: {
      officialName: name.officialName,
      year,
      population: economy.population,
      gdp: economy.gdp,
      approval,
      legitimacy,
      ministries: ministries.length,
      chambers: chambers.length,
    },
  } as const
}

const encoder = new TextEncoder()
const tokenMessage = (owner: string, fields: object) =>
  encoder.encode(JSON.stringify([owner, fields]))
const signingKey = (secret: string) =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])

export async function makePreviewToken(secret: string, owner: string, fields: object) {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await signingKey(secret),
    tokenMessage(owner, fields),
  )
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

export async function matchesPreview(
  secret: string,
  owner: string,
  fields: object,
  token: unknown,
) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(token)) return false
  const signature = Uint8Array.from(atob(token), (byte) => byte.charCodeAt(0))
  return crypto.subtle.verify(
    'HMAC',
    await signingKey(secret),
    signature,
    tokenMessage(owner, fields),
  )
}
