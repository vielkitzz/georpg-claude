export type ChapterId = 'governamental' | 'diplomatico' | 'economico' | 'societal'

export type AxisId =
  | 'federal_unitario'
  | 'democratico_autocratico'
  | 'liberdade_seguranca'
  | 'nacionalismo_internacionalismo'
  | 'militarismo_pacifismo'
  | 'assimilacao_multiculturalismo'
  | 'coletivismo_propriedade'
  | 'planejamento_livremercado'
  | 'protecionismo_livrecomercio'
  | 'secular_religioso'
  | 'progressista_tradicional'
  | 'aceleracao_cautela'

export interface Axis {
  id: AxisId
  chapter: ChapterId
  /** Polo no valor 0. */
  low: string
  /** Polo no valor 100. */
  high: string
}

export const CHAPTERS: readonly { id: ChapterId; title: string }[] = [
  { id: 'governamental', title: 'Governamental' },
  { id: 'diplomatico', title: 'Diplomático' },
  { id: 'economico', title: 'Econômico' },
  { id: 'societal', title: 'Societal' },
]

/** Os 12 eixos, em ordem: 4 capítulos × 3 eixos. Pontuação de 0 (polo "low") a 100 (polo "high"). */
export const AXES: readonly Axis[] = [
  { id: 'federal_unitario', chapter: 'governamental', low: 'Federal', high: 'Unitário' },
  {
    id: 'democratico_autocratico',
    chapter: 'governamental',
    low: 'Democrático',
    high: 'Autocrático',
  },
  { id: 'liberdade_seguranca', chapter: 'governamental', low: 'Liberdade', high: 'Segurança' },
  {
    id: 'nacionalismo_internacionalismo',
    chapter: 'diplomatico',
    low: 'Nacionalismo',
    high: 'Internacionalismo',
  },
  { id: 'militarismo_pacifismo', chapter: 'diplomatico', low: 'Militarismo', high: 'Pacifismo' },
  {
    id: 'assimilacao_multiculturalismo',
    chapter: 'diplomatico',
    low: 'Assimilação',
    high: 'Multiculturalismo',
  },
  {
    id: 'coletivismo_propriedade',
    chapter: 'economico',
    low: 'Coletivismo',
    high: 'Propriedade privada',
  },
  {
    id: 'planejamento_livremercado',
    chapter: 'economico',
    low: 'Planejamento',
    high: 'Livre mercado',
  },
  {
    id: 'protecionismo_livrecomercio',
    chapter: 'economico',
    low: 'Protecionismo',
    high: 'Livre comércio',
  },
  { id: 'secular_religioso', chapter: 'societal', low: 'Secular', high: 'Religioso' },
  { id: 'progressista_tradicional', chapter: 'societal', low: 'Progressista', high: 'Tradicional' },
  { id: 'aceleracao_cautela', chapter: 'societal', low: 'Aceleração', high: 'Cautela' },
]

export type AxisScores = Record<AxisId, number>

export const AXIS_IDS: readonly AxisId[] = AXES.map((axis) => axis.id)
