import type { AxisId } from './axes'

export interface Question {
  /** "{eixo}-{1..3}" */
  id: string
  axis: AxisId
  text: string
  /**
   * +1: concordar leva ao polo de valor 100 do eixo; −1: leva ao polo de valor 0
   * (afirmação com polaridade invertida).
   */
  polarity: 1 | -1
}

type Row = [axis: AxisId, polarity: 1 | -1, text: string]

const ROWS: Row[] = [
  // Governamental: federal–unitário
  [
    'federal_unitario',
    1,
    'Um país forte precisa de um único governo central, com as mesmas leis para todo o território.',
  ],
  [
    'federal_unitario',
    -1,
    'As regiões devem ter autonomia para fazer suas próprias leis e cobrar seus próprios impostos.',
  ],
  [
    'federal_unitario',
    1,
    'Os governadores locais devem obedecer às ordens da capital, mesmo quando discordam delas.',
  ],
  // Governamental: democrático–autocrático
  [
    'democratico_autocratico',
    -1,
    'O chefe de governo deve ser escolhido pelo voto do povo e poder ser removido por ele.',
  ],
  [
    'democratico_autocratico',
    1,
    'Em tempos difíceis, é melhor que poucos decidam depressa do que muitos discutam sem fim.',
  ],
  [
    'democratico_autocratico',
    -1,
    'Um parlamento livre deve poder barrar as decisões do líder do país.',
  ],
  // Governamental: liberdade–segurança
  [
    'liberdade_seguranca',
    1,
    'Vigiar e deter suspeitos sem demora é um preço aceitável pela ordem pública.',
  ],
  [
    'liberdade_seguranca',
    -1,
    'Ninguém deve ser preso sem acusação formal e julgamento justo, nem em tempos de crise.',
  ],
  ['liberdade_seguranca', -1, 'Os jornais devem poder criticar o governo sem medo de censura.'],
  // Diplomático: nacionalismo–internacionalismo
  [
    'nacionalismo_internacionalismo',
    -1,
    'Os interesses da nossa nação devem vir antes dos interesses de qualquer outra.',
  ],
  [
    'nacionalismo_internacionalismo',
    1,
    'Organizações entre nações resolvem disputas melhor do que cada país sozinho.',
  ],
  [
    'nacionalismo_internacionalismo',
    1,
    'Abrir mão de parte da soberania vale a pena em troca de uma paz duradoura.',
  ],
  // Diplomático: militarismo–pacifismo
  [
    'militarismo_pacifismo',
    -1,
    'Um exército grande e bem armado é a melhor garantia de respeito entre as nações.',
  ],
  [
    'militarismo_pacifismo',
    1,
    'Os conflitos entre países devem ser resolvidos na mesa de negociação, e não no campo de batalha.',
  ],
  ['militarismo_pacifismo', -1, 'O serviço militar obrigatório faz bem ao caráter dos cidadãos.'],
  // Diplomático: assimilação–multiculturalismo
  [
    'assimilacao_multiculturalismo',
    -1,
    'Quem vive aqui deve adotar a língua e os costumes da maioria.',
  ],
  [
    'assimilacao_multiculturalismo',
    1,
    'Povos de culturas diferentes devem poder manter suas línguas e tradições dentro do país.',
  ],
  ['assimilacao_multiculturalismo', 1, 'A diversidade de origens torna uma nação mais rica.'],
  // Econômico: coletivismo–propriedade
  [
    'coletivismo_propriedade',
    1,
    'A propriedade privada é um direito que o Estado deve proteger acima de quase tudo.',
  ],
  [
    'coletivismo_propriedade',
    -1,
    'Terras, ferrovias e minas devem pertencer ao povo, e não a particulares.',
  ],
  [
    'coletivismo_propriedade',
    -1,
    'Os trabalhadores devem participar das decisões e dos lucros das empresas.',
  ],
  // Econômico: planejamento–livre mercado
  [
    'planejamento_livremercado',
    -1,
    'O governo deve planejar a economia e definir o que e quanto se produz.',
  ],
  [
    'planejamento_livremercado',
    1,
    'Preços e salários devem ser fixados pela oferta e pela procura, sem interferência do Estado.',
  ],
  [
    'planejamento_livremercado',
    1,
    'Menos impostos e menos regras fazem a economia crescer mais depressa.',
  ],
  // Econômico: protecionismo–livre comércio
  [
    'protecionismo_livrecomercio',
    -1,
    'Tarifas altas sobre produtos estrangeiros protegem os empregos e as indústrias nacionais.',
  ],
  ['protecionismo_livrecomercio', 1, 'O comércio sem barreiras entre os países beneficia a todos.'],
  [
    'protecionismo_livrecomercio',
    1,
    'Nossa indústria deve aprender a competir com a estrangeira, sem proteção do governo.',
  ],
  // Societal: secular–religioso
  [
    'secular_religioso',
    -1,
    'A religião deve ficar fora das decisões do Estado e das escolas públicas.',
  ],
  ['secular_religioso', 1, 'As leis do país devem refletir os valores da fé da maioria.'],
  ['secular_religioso', 1, 'Os líderes religiosos devem ter voz ativa nos assuntos de governo.'],
  // Societal: progressista–tradicional
  [
    'progressista_tradicional',
    1,
    'As tradições herdadas dos antepassados são a base de uma sociedade estável.',
  ],
  [
    'progressista_tradicional',
    -1,
    'Os costumes devem mudar com os tempos, inclusive os papéis da família e da mulher.',
  ],
  [
    'progressista_tradicional',
    -1,
    'A sociedade deve avançar com ideias novas, mesmo que rompam com o passado.',
  ],
  // Societal: aceleração–cautela
  ['aceleracao_cautela', -1, 'É melhor modernizar o país depressa, mesmo que haja turbulência.'],
  [
    'aceleracao_cautela',
    1,
    'Reformas profundas devem ser feitas devagar, testadas e corrigidas pelo caminho.',
  ],
  [
    'aceleracao_cautela',
    -1,
    'O país deve adotar logo as máquinas e técnicas novas, antes que outros o façam.',
  ],
]

const counter = new Map<AxisId, number>()

/** As 36 afirmações, na ordem de apresentação (capítulo a capítulo). */
export const QUESTIONS: readonly Question[] = ROWS.map(([axis, polarity, text]) => {
  const n = (counter.get(axis) ?? 0) + 1
  counter.set(axis, n)
  return { id: `${axis}-${n}`, axis, polarity, text }
})

export const ANSWER_LABELS = [
  'Discordo totalmente',
  'Discordo',
  'Neutro',
  'Concordo',
  'Concordo totalmente',
] as const
