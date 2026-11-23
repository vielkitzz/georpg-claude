import { LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { useWorldState } from '@/data/hooks'
import { formatSimulationDate, simulationDateAt } from '@/domain/time'
import { ThemeToggle } from './ThemeToggle'
import { NextTick } from './NextTick'

function SimulationDate() {
  const world = useWorldState()
  const text =
    world.status === 'ready'
      ? formatSimulationDate(simulationDateAt(world.data.tickIndex))
      : world.status === 'error'
        ? 'Data indisponível'
        : 'Carregando…'
  return (
    <div className="leading-tight">
      <p className="text-xs text-muted">Data da simulação</p>
      <p className="subtitle text-sm sm:text-base">{text}</p>
    </div>
  )
}

export function Topbar({ menuOpen, onOpenMenu }: { menuOpen: boolean; onOpenMenu: () => void }) {
  const { player, signOut } = useAuth()
  const navigate = useNavigate()
  const name = player?.name ?? 'Jogador'
  const leave = async () => {
    await signOut()
    navigate('/login')
  }
  return (
    <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center gap-2 border-b border-line bg-bg/95 px-3 py-1 backdrop-blur sm:flex-nowrap sm:gap-3 sm:px-4 md:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
        aria-expanded={menuOpen}
        aria-controls="menu-lateral"
        aria-haspopup="dialog"
        className="grid size-11 place-items-center rounded-md hover:bg-raised md:hidden"
      >
        <Menu size={22} aria-hidden />
      </button>
      <SimulationDate />
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <div className="flex items-center gap-2 sm:ml-1 sm:border-l sm:border-line sm:pl-3">
          {player?.avatarUrl ? (
            <img src={player.avatarUrl} alt="" className="size-8 rounded-full" />
          ) : (
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-on-primary"
            >
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <span className="sr-only block max-w-32 truncate text-sm sm:not-sr-only">{name}</span>
            <NextTick />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void leave()}
          aria-label="Sair"
          className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-2.5 text-sm hover:bg-raised sm:px-3"
        >
          <LogOut size={18} aria-hidden />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
