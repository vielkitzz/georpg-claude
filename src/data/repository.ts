import { createContext } from 'react'
import type { Nation, TerritoryClaim, WorldState } from '@/domain/types'
import { DEMO_CLAIMS, DEMO_NATION, DEMO_WORLD } from './demo'

/**
 * Fonte de dados do app. Na Fase 0 é a demonstração; na Fase 2 a implementação
 * troca para o Supabase sem mexer nas páginas.
 */
export interface GameRepository {
  getWorldState(): Promise<WorldState>
  getNation(): Promise<Nation | null>
  getTerritoryClaims(): Promise<TerritoryClaim[]>
}

export const demoRepository: GameRepository = {
  getWorldState: async () => DEMO_WORLD,
  getNation: async () => DEMO_NATION,
  getTerritoryClaims: async () => DEMO_CLAIMS,
}

export const RepositoryContext = createContext<GameRepository>(demoRepository)
