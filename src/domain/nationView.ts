import { ARCHETYPES, compass, type ArchetypeId, type AxisScores } from '@/domain/ideology'
import { MONTH_NAMES } from '@/domain/time'

/** Separa "Reino da" de "Lieltuânia": só o nome do país vai em destaque no título. */
export function splitOfficialName(
  officialName: string,
  shortName: string,
): { prefix: string; core: string } {
  const core = shortName.trim()
  if (core && officialName.toLowerCase().endsWith(core.toLowerCase())) {
    const cut = officialName.length - core.length
    return { prefix: officialName.slice(0, cut), core: officialName.slice(cut) }
  }
  return { prefix: '', core: officialName }
}

/** "Fundada em 12 de março de 1920", descartando as partes que ainda não se conhecem. */
export function formatFounded(year: number, month?: number, day?: number): string {
  const monthName = month && month >= 1 && month <= 12 ? MONTH_NAMES[month - 1].toLowerCase() : null
  if (monthName && day) return `Fundada em ${day} de ${monthName} de ${year}`
  if (monthName) return `Fundada em ${monthName} de ${year}`
  return `Fundada em ${year}`
}

const spaced = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

/** "1 000 000", com espaço fixo entre os grupos (não quebra de linha no meio do número). */
export const formatSpaced = (value: number): string =>
  spaced.format(Math.round(value)).replaceAll('.', '\u00A0')

/** Posição no ranking: "3.º". */
export const formatRank = (rank: number): string => `${rank}.º`

const decimals = (min: number, max: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max })

const MAGNITUDES = [
  { from: 1e12, label: 'tri', format: decimals(2, 2) },
  { from: 1e9, label: 'bi', format: decimals(2, 2) },
  { from: 1e6, label: 'mi', format: decimals(0, 1) },
  { from: 1e3, label: 'mil', format: decimals(0, 1) },
] as const

/** "1,25 tri", "310 mi". Abaixo de mil, o número inteiro. */
export function formatMagnitude(value: number): string {
  const size = Math.abs(value)
  const unit = MAGNITUDES.find((magnitude) => size >= magnitude.from)
  if (!unit) return decimals(0, 0).format(value)
  return `${unit.format.format(value / unit.from)} ${unit.label}`
}

export const formatDecimal = (value: number, digits: number): string =>
  decimals(digits, digits).format(value)

/** Prefixo da moeda no PIB: o símbolo, quando existe, e senão o código. */
export const currencyPrefix = (currency: { code: string; symbol?: string }): string =>
  currency.symbol?.trim() || currency.code

/** "Coroa lieltuaniana (£)(LCR)": nome, símbolo (se houver) e código. */
export function formatCurrency(currency: { code: string; name: string; symbol?: string }): string {
  const symbol = currency.symbol?.trim()
  return `${currency.name}${symbol ? ` (${symbol})` : ''}(${currency.code})`
}

/* ---------- Ideologia ---------- */

/** Nome da ideologia como corrente de pensamento (o arquétipo descreve a pessoa). */
export const IDEOLOGY_NAMES: Record<ArchetypeId, string> = {
  liberal_classico: 'Liberalismo clássico',
  conservador: 'Conservadorismo tradicionalista',
  social_democrata: 'Social-democracia',
  socialista_revolucionario: 'Socialismo revolucionário',
  nacionalista_autoritario: 'Nacionalismo autoritário',
  absolutista: 'Absolutismo monárquico',
  teocrata: 'Teocracia',
  republicano_progressista: 'Republicanismo progressista',
  federalista: 'Federalismo autonomista',
  modernizador: 'Modernização tecnocrática',
  internacionalista: 'Internacionalismo pacifista',
}

export interface IdeologyView {
  name: string
  summary: string
  /** Posição na bússola: x = mercado, y = autoridade, de 0 a 100. */
  position: { x: number; y: number }
  /** Quatro marcas do perfil, da mais forte à mais fraca. */
  bars: { label: string; value: number }[]
}

const clamp100 = (value: number) => Math.max(0, Math.min(100, value))

/**
 * Retrato ideológico da nação. Sem as pontuações do questionário (nações antigas),
 * usa o perfil de referência da ideologia governante. Sem nenhuma das duas, devolve null.
 */
export function ideologyView(
  ideology: ArchetypeId | undefined,
  scores: AxisScores | undefined,
): IdeologyView | null {
  const archetype = ARCHETYPES.find((item) => item.id === ideology)
  const axes = scores ?? archetype?.profile
  if (!archetype || !axes) return null
  const { x, y } = compass(axes)
  const bars = [
    { label: 'Mercado', value: x },
    { label: 'Tradição', value: axes.progressista_tradicional },
    { label: 'Liberdades civis', value: 100 - axes.liberdade_seguranca },
    { label: 'Descentralização', value: 100 - axes.federal_unitario },
  ]
    .map((bar) => ({ ...bar, value: Math.round(clamp100(bar.value)) }))
    .sort((a, b) => b.value - a.value)
  return {
    name: IDEOLOGY_NAMES[archetype.id],
    summary: archetype.summary,
    position: { x: clamp100(x), y: clamp100(y) },
    bars,
  }
}

/* ---------- Território ---------- */

/**
 * Quilômetros quadrados por célula do mapa. É uma escala provisória: o export do
 * Azgaar não traz a escala real, então ajuste este número à do mundo de Erda.
 */
export const KM2_PER_CELL = 120

export const areaFromCells = (cells: number): number => cells * KM2_PER_CELL

/** Posição (1 = maior) do território entre todos, pelo número de células. */
export function areaRank(territoryId: number, territories: { id: number; cells: number }[]) {
  const own = territories.find((territory) => territory.id === territoryId)
  if (!own) return null
  return 1 + territories.filter((territory) => territory.cells > own.cells).length
}

/** Retângulo que contém todos os pontos de um caminho SVG (M/L/Z, coordenadas absolutas). */
export function pathBounds(d: string): { minX: number; minY: number; maxX: number; maxY: number } {
  const numbers = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    minX = Math.min(minX, numbers[i])
    maxX = Math.max(maxX, numbers[i])
    minY = Math.min(minY, numbers[i + 1])
    maxY = Math.max(maxY, numbers[i + 1])
  }
  return { minX, minY, maxX, maxY }
}

/** Enquadra um retângulo numa moldura de proporção fixa, com margem em volta. */
export function fitViewBox(
  bounds: ReturnType<typeof pathBounds>,
  aspect: number,
  margin = 0.18,
  minSpan = 80,
): { x: number; y: number; width: number; height: number } {
  const w = Math.max(bounds.maxX - bounds.minX, 1)
  const h = Math.max(bounds.maxY - bounds.minY, 1)
  const pad = Math.max(w, h) * margin
  let width = w + pad * 2
  let height = h + pad * 2
  if (width / height < aspect) width = height * aspect
  else height = width / aspect
  if (width < minSpan * aspect) {
    width = minSpan * aspect
    height = minSpan
  }
  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2
  return { x: cx - width / 2, y: cy - height / 2, width, height }
}

/* ---------- Índices derivados ---------- */

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

/**
 * Estabilidade (0 a 100) quando a nação ainda não guarda o valor: média ponderada da
 * legitimidade e da aprovação, descontada pela pressão de inflação e desemprego.
 */
export function deriveStability(input: {
  legitimacy: number
  approval: number
  inflation: number
  unemployment: number
}): number {
  const pressure = clamp(input.inflation * 4 + input.unemployment * 3, 0, 100)
  return Math.round(
    clamp(0.4 * input.legitimacy + 0.4 * input.approval + 0.2 * (100 - pressure), 0, 100),
  )
}

/**
 * IDH (0 a 1) quando a nação ainda não guarda o valor: cresce com o logaritmo do PIB
 * per capita, de 0,30 (100) a 0,90 (10.000).
 */
export function deriveHdi(gdpPerCapita: number): number {
  if (!(gdpPerCapita > 0)) return 0
  return Math.round(clamp(0.3 + 0.3 * Math.log10(gdpPerCapita / 100), 0.1, 0.99) * 1000) / 1000
}
