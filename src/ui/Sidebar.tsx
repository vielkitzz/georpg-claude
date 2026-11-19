import { X } from 'lucide-react'
import { NavLink } from 'react-router'
import { NAV_ITEMS } from '@/domain/nav'
import { Brand } from './Brand'
import { NAV_ICONS } from './navIcons'

const rowBase =
  'flex h-11 items-center gap-3 rounded-md px-3 text-[0.95rem] md:justify-center md:px-0 lg:justify-start lg:px-3'

/** Gaveta no celular, só ícones no médio, completa no grande. */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}
      <aside
        id="menu-lateral"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col gap-6 border-r border-line bg-panel p-4 transition-transform duration-200 md:static md:z-auto md:w-[4.5rem] md:translate-x-0 md:px-3 lg:w-72 lg:px-4 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-10 items-center justify-between md:justify-center lg:justify-between">
          <span className="rounded-md bg-[#071C2A] py-1.5 pr-3 pl-1.5 md:hidden lg:inline">
            <Brand />
          </span>
          <span className="hidden md:inline lg:hidden">
            <Brand showWordmark={false} />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="grid size-10 place-items-center rounded-md hover:bg-raised md:hidden"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <nav aria-label="Seções do jogo" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.icon]
            const label = <span className="md:sr-only lg:not-sr-only">{item.label}</span>
            if (!item.path) {
              return (
                <span
                  key={item.id}
                  aria-disabled="true"
                  title={`${item.label} (em breve)`}
                  className={`${rowBase} cursor-not-allowed text-muted opacity-70`}
                >
                  <Icon size={20} aria-hidden className="shrink-0" />
                  {label}
                  <span className="ml-auto shrink-0 whitespace-nowrap rounded-sm border border-line px-1.5 py-0.5 text-xs md:hidden lg:inline">
                    em breve
                  </span>
                </span>
              )
            }
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/'}
                title={item.label}
                onClick={onClose}
                className={({ isActive }) =>
                  `${rowBase} transition-colors ${
                    isActive
                      ? 'bg-primary font-semibold text-on-primary'
                      : 'text-fg hover:bg-raised'
                  }`
                }
              >
                <Icon size={20} aria-hidden className="shrink-0" />
                {label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
