import type { ReactNode } from 'react'
import { useNation } from '@/data/hooks'
import type { Nation } from '@/domain/types'

/** Entrega a nação do jogador às páginas, cuidando de carregando/erro/vazio. */
export function NationGate({ children }: { children: (nation: Nation) => ReactNode }) {
  const nation = useNation()
  if (nation.status === 'loading') return <p className="text-muted">Carregando a nação…</p>
  if (nation.status === 'error') {
    return (
      <p role="alert">
        Não foi possível carregar a nação. Recarregue a página para tentar de novo.
      </p>
    )
  }
  if (!nation.data) return <p>Você ainda não fundou uma nação.</p>
  return <>{children(nation.data)}</>
}
