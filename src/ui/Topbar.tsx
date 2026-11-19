import { Bell, LogOut, Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { DEMO_NOTICES } from '@/data/demo'
import { useWorldState } from '@/data/hooks'
import { formatSimulationDate, simulationDateAt } from '@/domain/time'
import { ThemeToggle } from './ThemeToggle'

function SimulationDate() {
  const world = useWorldState()
  const text =
    world.status === 'ready' ? formatSimulationDate(simulationDateAt(world.data.tickIndex)) : '…'
  return (
    <div className="leading-tight">
      <p className="text-xs text-muted">Data da simulação</p>
      <p className="subtitle text-sm sm:text-base">{text}</p>
    </div>
  )
}

function Notices() {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') setOpen(false)
      } else if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const warnings = DEMO_NOTICES.filter((notice) => notice.level === 'warning').length

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="avisos"
        aria-label={`Avisos (${DEMO_NOTICES.length})`}
        className="relative grid size-10 place-items-center rounded-md hover:bg-raised"
      >
        <Bell size={20} aria-hidden />
        {warnings > 0 && (
          <span className="absolute top-2 right-2 size-2.5 rounded-full bg-warning" aria-hidden />
        )}
      </button>
      {open && (
        <div
          id="avisos"
          role="region"
          aria-label="Avisos"
          className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-line bg-panel p-3 shadow-xl"
        >
          <p className="subtitle mb-2 text-sm">Avisos</p>
          <ul className="flex flex-col gap-2">
            {DEMO_NOTICES.map((notice) => (
              <li
                key={notice.id}
                className={`border-l-2 pl-3 text-sm ${
                  notice.level === 'warning' ? 'border-warning' : 'border-line'
                }`}
              >
                {notice.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { player, signOut } = useAuth()
  const navigate = useNavigate()
  const name = player?.name ?? 'Jogador'
  const leave = async () => {
    await signOut()
    navigate('/login')
  }
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-line bg-bg/95 px-3 backdrop-blur sm:gap-3 sm:px-4 md:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
        aria-controls="menu-lateral"
        className="grid size-10 place-items-center rounded-md hover:bg-raised md:hidden"
      >
        <Menu size={22} aria-hidden />
      </button>
      <SimulationDate />
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Notices />
        <ThemeToggle />
        <div className="ml-1 hidden items-center gap-2 border-l border-line pl-3 sm:flex">
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
          <span className="hidden max-w-32 truncate text-sm sm:block">{name}</span>
        </div>
        <button
          type="button"
          onClick={() => void leave()}
          aria-label="Sair"
          className="flex h-10 items-center gap-2 rounded-md px-2.5 text-sm hover:bg-raised sm:px-3"
        >
          <LogOut size={18} aria-hidden />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
