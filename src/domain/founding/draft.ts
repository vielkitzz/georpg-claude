import type { ArchetypeId } from '../ideology/archetypes.ts'
import type { Answers } from '../ideology/scoring.ts'
import type { Article } from './name.ts'
import type { InstitutionsInput } from './options.ts'

export interface FoundingDraft {
  territoryId: number | null
  shortName: string
  article: Article
  capital: string
  currencyCode: string
  currencyName: string
  institutions: InstitutionsInput
  answers: Answers
  ideology: ArchetypeId | null
  symbols: FoundingSymbols
}

export interface FoundingSymbols {
  flag: string
  coatOfArms: string
  color: string
  anthem: string
  emblem: string
  motto: string
  description: string
  history: string
}

export interface FoundingPreview {
  officialName: string
  year: number
  population: number
  gdp: number
  approval: number
  legitimacy: number
  ministries: number
  chambers: number
  token: string
}

export const SYMBOL_IMAGE_BYTES = 256 * 1024
export const SYMBOL_IMAGE_SIDE = 2048

export const isTerritoryId = (id: unknown): id is number =>
  typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 50

export function validateFoundingText(value: unknown, min: number, max: number, multiline = false) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) return false
  const content = multiline ? value.replace(/[\t\r\n]/g, '') : value
  return !/[\p{Cc}\p{Cf}\p{Cs}]/u.test(content)
}

export function validateEconomy(
  input: Pick<FoundingDraft, 'capital' | 'currencyCode' | 'currencyName'>,
) {
  if (!validateFoundingText(input.capital, 2, 60))
    return 'Informe uma capital de 2 a 60 caracteres.'
  if (typeof input.currencyCode !== 'string' || !/^[A-Z]{2,4}$/.test(input.currencyCode)) {
    return 'Use de 2 a 4 letras maiúsculas no código monetário.'
  }
  if (!validateFoundingText(input.currencyName, 2, 60))
    return 'Informe um nome de moeda de 2 a 60 caracteres.'
  return null
}

export const SYMBOL_FIELDS = {
  anthem: { label: 'Hino (opcional)', min: 0, max: 2000, multiline: true },
  emblem: { label: 'Animal ou planta nacional (opcional)', min: 0, max: 80, multiline: false },
  motto: { label: 'Lema', min: 2, max: 200, multiline: false },
  description: { label: 'Descrição nacional', min: 2, max: 2000, multiline: true },
  history: { label: 'História nacional', min: 2, max: 6000, multiline: true },
} as const

export function validateSymbols(symbols: FoundingSymbols) {
  if (typeof symbols.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(symbols.color))
    return 'Escolha uma cor nacional.'
  for (const field of ['flag', 'coatOfArms'] as const) {
    const value = symbols[field]
    if (
      typeof value !== 'string' ||
      value.length > Math.ceil(SYMBOL_IMAGE_BYTES / 3) * 4 ||
      (value !== '' && !/^[A-Za-z0-9+/]+={0,2}$/.test(value))
    ) {
      return 'A bandeira e o brasão devem ser imagens PNG de até 256 KiB.'
    }
  }
  for (const field of Object.keys(SYMBOL_FIELDS) as (keyof typeof SYMBOL_FIELDS)[]) {
    const { min, max, multiline, label } = SYMBOL_FIELDS[field]
    if (!validateFoundingText(symbols[field], min, max, multiline)) {
      return min
        ? `Informe o campo “${label}” com ${min} a ${max} caracteres válidos.`
        : `Use até ${max} caracteres válidos no campo “${label}”.`
    }
  }
  return null
}
