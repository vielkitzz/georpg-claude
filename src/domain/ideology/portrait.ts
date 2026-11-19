import { AXES, CHAPTERS, type AxisId, type AxisScores, type ChapterId } from './axes'

const PHRASES: Record<AxisId, { low: string; high: string }> = {
  federal_unitario: {
    low: 'quer regiões com autonomia e um poder repartido',
    high: 'quer um Estado unificado, com comando central forte',
  },
  democratico_autocratico: {
    low: 'confia no voto, no parlamento e na responsabilização dos governantes',
    high: 'prefere decisões rápidas nas mãos de poucos',
  },
  liberdade_seguranca: {
    low: 'protege as liberdades individuais mesmo em tempos difíceis',
    high: 'aceita limitar liberdades em nome da ordem e da segurança',
  },
  nacionalismo_internacionalismo: {
    low: 'põe o interesse nacional à frente de tudo',
    high: 'aposta na cooperação e nos acordos entre as nações',
  },
  militarismo_pacifismo: {
    low: 'vê nas forças armadas a base do respeito entre os países',
    high: 'prefere a negociação à guerra',
  },
  assimilacao_multiculturalismo: {
    low: 'espera que todos adotem a língua e os costumes da maioria',
    high: 'defende que cada povo mantenha sua cultura dentro do país',
  },
  coletivismo_propriedade: {
    low: 'quer que terras e grandes empresas sirvam ao conjunto do povo',
    high: 'defende a propriedade privada como direito fundamental',
  },
  planejamento_livremercado: {
    low: 'quer um Estado que planeje a produção',
    high: 'quer preços e salários livres, com pouca interferência',
  },
  protecionismo_livrecomercio: {
    low: 'quer proteger a indústria nacional com tarifas',
    high: 'quer fronteiras abertas ao comércio',
  },
  secular_religioso: {
    low: 'quer o Estado separado da religião',
    high: 'quer leis guiadas pelos valores da fé',
  },
  progressista_tradicional: {
    low: 'quer costumes que acompanhem os novos tempos',
    high: 'vê na tradição a base de uma sociedade estável',
  },
  aceleracao_cautela: {
    low: 'quer modernizar depressa, aceitando turbulência',
    high: 'quer reformas lentas, testadas e corrigidas',
  },
}

/** Abaixo de 35 pende para o polo "low"; acima de 65, para o "high"; no meio, equilibrado. */
export const LEAN_LOW = 35
export const LEAN_HIGH = 65

export type Lean = 'low' | 'mid' | 'high'
export const leanOf = (score: number): Lean =>
  score < LEAN_LOW ? 'low' : score > LEAN_HIGH ? 'high' : 'mid'

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** Retrato textual por capítulo, só com os eixos em que o perfil tem posição clara. */
export function portrait(
  scores: AxisScores,
): { chapter: ChapterId; title: string; text: string }[] {
  return CHAPTERS.map(({ id, title }) => {
    const parts = AXES.filter((axis) => axis.chapter === id)
      .map((axis) => {
        const lean = leanOf(scores[axis.id])
        return lean === 'mid' ? null : PHRASES[axis.id][lean]
      })
      .filter((part): part is string => part !== null)
    const text = parts.length
      ? `${capitalize(parts.join('; '))}.`
      : 'Sem posições marcadas neste capítulo: o perfil é equilibrado.'
    return { chapter: id, title, text }
  })
}
