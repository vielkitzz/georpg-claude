import type { AxisScores } from './axes'

export type ArchetypeId =
  | 'liberal_classico'
  | 'conservador'
  | 'social_democrata'
  | 'socialista_revolucionario'
  | 'nacionalista_autoritario'
  | 'absolutista'
  | 'teocrata'
  | 'republicano_progressista'
  | 'federalista'
  | 'modernizador'
  | 'internacionalista'

export interface Archetype {
  id: ArchetypeId
  name: string
  summary: string
  /** Perfil de referência no mesmo espaço dos 12 eixos (0 a 100). */
  profile: AxisScores
}

// Ordem dos valores: federal_unitario, democratico_autocratico, liberdade_seguranca,
// nacionalismo_internacionalismo, militarismo_pacifismo, assimilacao_multiculturalismo,
// coletivismo_propriedade, planejamento_livremercado, protecionismo_livrecomercio,
// secular_religioso, progressista_tradicional, aceleracao_cautela.
const profile = (v: number[]): AxisScores => ({
  federal_unitario: v[0],
  democratico_autocratico: v[1],
  liberdade_seguranca: v[2],
  nacionalismo_internacionalismo: v[3],
  militarismo_pacifismo: v[4],
  assimilacao_multiculturalismo: v[5],
  coletivismo_propriedade: v[6],
  planejamento_livremercado: v[7],
  protecionismo_livrecomercio: v[8],
  secular_religioso: v[9],
  progressista_tradicional: v[10],
  aceleracao_cautela: v[11],
})

/** As 11 ideologias-arquétipo. O jogador escolhe uma das 3 mais próximas. */
export const ARCHETYPES: readonly Archetype[] = [
  {
    id: 'liberal_classico',
    name: 'Liberal clássico',
    summary:
      'Defende liberdades individuais, propriedade privada, mercado livre e governo limitado.',
    profile: profile([40, 15, 20, 60, 50, 55, 85, 85, 80, 25, 35, 40]),
  },
  {
    id: 'conservador',
    name: 'Conservador tradicionalista',
    summary: 'Valoriza a tradição, a ordem e a fé, e prefere mudanças lentas e testadas.',
    profile: profile([60, 40, 60, 30, 35, 30, 75, 60, 50, 70, 85, 80]),
  },
  {
    id: 'social_democrata',
    name: 'Social-democrata',
    summary:
      'Quer democracia plena com proteção aos trabalhadores e um Estado que corrige o mercado.',
    profile: profile([45, 15, 30, 65, 60, 65, 30, 35, 45, 35, 25, 45]),
  },
  {
    id: 'socialista_revolucionario',
    name: 'Socialista revolucionário',
    summary: 'Busca a propriedade coletiva e a economia planejada, mesmo por meio de uma ruptura.',
    profile: profile([65, 55, 55, 70, 45, 65, 10, 10, 40, 15, 10, 15]),
  },
  {
    id: 'nacionalista_autoritario',
    name: 'Nacionalista autoritário',
    summary:
      'Põe a nação acima de tudo, com um líder forte, exército respeitado e unidade cultural.',
    profile: profile([85, 85, 85, 5, 15, 10, 55, 40, 15, 60, 70, 50]),
  },
  {
    id: 'absolutista',
    name: 'Monarquista absolutista',
    summary:
      'Defende o poder concentrado no trono, a hierarquia herdada e a autoridade da tradição.',
    profile: profile([75, 95, 75, 25, 35, 20, 60, 40, 40, 85, 95, 90]),
  },
  {
    id: 'teocrata',
    name: 'Teocrata',
    summary: 'Acredita que a fé deve orientar as leis e que o poder religioso guia o Estado.',
    profile: profile([65, 80, 75, 35, 40, 25, 55, 45, 45, 95, 90, 75]),
  },
  {
    id: 'republicano_progressista',
    name: 'Republicano progressista',
    summary:
      'Quer uma república laica e reformista, com direitos ampliados e instituições abertas.',
    profile: profile([45, 10, 25, 55, 60, 70, 50, 50, 55, 20, 15, 30]),
  },
  {
    id: 'federalista',
    name: 'Federalista autonomista',
    summary: 'Prefere poder descentralizado, com regiões fortes e um governo central enxuto.',
    profile: profile([10, 25, 35, 45, 50, 60, 60, 60, 60, 45, 50, 55]),
  },
  {
    id: 'modernizador',
    name: 'Modernizador tecnocrata',
    summary: 'Confia em técnicos e no Estado para industrializar e modernizar o país depressa.',
    profile: profile([70, 60, 60, 40, 40, 45, 45, 25, 35, 35, 20, 10]),
  },
  {
    id: 'internacionalista',
    name: 'Internacionalista pacifista',
    summary:
      'Aposta na cooperação entre nações, no comércio aberto e na solução negociada de conflitos.',
    profile: profile([45, 15, 25, 90, 90, 80, 45, 50, 85, 30, 30, 50]),
  },
]
