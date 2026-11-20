import type { ReactNode } from 'react'
import { RepositoryContext, type GameRepository } from './repository'
import { supabaseRepository } from './supabaseRepository'

export function RepositoryProvider({
  repository = supabaseRepository,
  children,
}: {
  repository?: GameRepository
  children: ReactNode
}) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>
}
