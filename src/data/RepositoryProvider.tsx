import type { ReactNode } from 'react'
import { RepositoryContext, demoRepository, type GameRepository } from './repository'

export function RepositoryProvider({
  repository = demoRepository,
  children,
}: {
  repository?: GameRepository
  children: ReactNode
}) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>
}
