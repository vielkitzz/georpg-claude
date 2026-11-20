import type { GovernmentForm, StateForm } from './options.ts'

export type Article = 'de' | 'da' | 'do'
export const ARTICLES: readonly Article[] = ['de', 'da', 'do']

/**
 * Nome oficial (regra da seção 4):
 * monarquia → "Reino {artigo} {nome}"; teocracia → "Estado Teocrático {artigo} {nome}";
 * república federal → "República Federativa …"; república confederada → "Confederação …";
 * demais repúblicas → "República …".
 */
export function composeOfficialCountryName(input: {
  governmentForm: GovernmentForm
  stateForm: StateForm
  article: Article
  shortName: string
}): string {
  const { governmentForm, stateForm, article } = input
  const shortName = input.shortName.trim()
  if (governmentForm === 'monarquia') return `Reino ${article} ${shortName}`
  if (governmentForm === 'teocracia') return `Estado Teocrático ${article} ${shortName}`
  if (stateForm === 'federal') return `República Federativa ${article} ${shortName}`
  if (stateForm === 'confederado') return `Confederação ${article} ${shortName}`
  return `República ${article} ${shortName}`
}

/** Chave de comparação: sem acento, caixa ou pontuação ("Côte d'Or" = "cote d or"). */
export function nameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export const slugify = (name: string): string => nameKey(name).replace(/ /g, '-')

/** Nomes que não podem ser usados por jogadores (comparados por `nameKey`). */
export const RESERVED_NAME_KEYS: readonly string[] = [
  'teste',
  'demo',
  'admin',
  'administracao',
  'georpg',
  'gauzoland',
  'neutro',
  'neutra',
  'sem dono',
  'sem nome',
  'nenhum',
  'null',
  'undefined',
  'moderacao',
  'sistema',
]

const SHORT_NAME_PATTERN = /^\p{L}[\p{L}\p{M} '’.-]{1,39}$/u

/** Mensagem de erro do nome curto, ou null se estiver ok. */
export function validateShortName(shortName: string): string | null {
  const name = shortName.trim()
  if (name.length < 2 || name.length > 40) return 'O nome deve ter de 2 a 40 caracteres.'
  if (!SHORT_NAME_PATTERN.test(name) || /\s{2,}/.test(name)) {
    return 'Use só letras, espaços, hífen e apóstrofo, começando por uma letra.'
  }
  if (RESERVED_NAME_KEYS.includes(nameKey(name))) return 'Esse nome é reservado.'
  return null
}

/** Valida o nome curto e a unicidade do nome oficial (`takenKeys` = name_key das nações existentes). */
export function validateNationName(
  input: Parameters<typeof composeOfficialCountryName>[0],
  takenKeys: ReadonlySet<string>,
): { error: string | null; officialName: string; key: string; slug: string } {
  const officialName = composeOfficialCountryName(input)
  const key = nameKey(officialName)
  const error =
    validateShortName(input.shortName) ??
    (!ARTICLES.includes(input.article) ? 'Artigo inválido.' : null) ??
    (takenKeys.has(key) ? 'Já existe uma nação com esse nome.' : null)
  return { error, officialName, key, slug: slugify(officialName) }
}
