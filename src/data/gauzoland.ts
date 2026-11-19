import raw from './gauzoland.json'

export interface Territory {
  id: number
  cells: number
  provinceIds: number[]
  neighbors: number[]
  pole: [number, number]
  poleRadius: number
  d: string
}

export interface Province {
  id: number
  stateId: number
  pole: [number, number]
  d: string
}

export interface Lake {
  id: number
  d: string
}

export interface WorldGeography {
  meta: { name: string; width: number; height: number }
  states: Territory[]
  provinces: Province[]
  lakes: Lake[]
  /** Terra sem estado, desenhada como fundo neutro. */
  neutral: string
}

/** Geografia pura (sem dono, nome ou cor): gerada por `npm run build-map`. */
export const geography = raw as unknown as WorldGeography
