import { useContext, useEffect, useState } from 'react'
import { RepositoryContext, type GameRepository } from './repository'

type Load<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error' }

function useLoad<T>(pick: (repository: GameRepository) => Promise<T>): Load<T> {
  const repository = useContext(RepositoryContext)
  const [state, setState] = useState<Load<T>>({ status: 'loading' })
  useEffect(() => {
    if (!repository) return
    let active = true
    pick(repository).then(
      (data) => active && setState({ status: 'ready', data }),
      () => active && setState({ status: 'error' }),
    )
    return () => {
      active = false
    }
  }, [repository, pick])
  return repository ? state : { status: 'error' }
}

const pickWorld = (r: GameRepository) => r.getWorldState()
const pickNation = (r: GameRepository) => r.getNation()
const pickClaims = (r: GameRepository) => r.getTerritoryClaims()

export const useWorldState = () => useLoad(pickWorld)
export const useNation = () => useLoad(pickNation)
export const useTerritoryClaims = () => useLoad(pickClaims)
