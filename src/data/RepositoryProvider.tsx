import type { ReactNode } from 'react'
import { RepositoryContext, demoRepository, type GameRepository } from './repository'
import { supabaseRepository } from './supabaseRepository'

export function RepositoryProvider({
  repository = import.meta.env.MODE === 'test' ? demoRepository : supabaseRepository,
  children,
}: {
  repository?: GameRepository
  children: ReactNode
}) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>
}
