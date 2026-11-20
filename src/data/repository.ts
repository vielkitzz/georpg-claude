import { createContext } from 'react'
import type { Nation, TerritoryClaim, WorldState } from '@/domain/types'

/** Fonte de dados do app; os testes podem injetar seu próprio repositório. */
export interface GameRepository {
  getWorldState(): Promise<WorldState>
  getNation(): Promise<Nation | null>
  getTerritoryClaims(): Promise<TerritoryClaim[]>
}

export const RepositoryContext = createContext<GameRepository | null>(null)
