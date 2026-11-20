import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router'
import { NAV_GROUPS } from '@/domain/nav'
import { Brand } from './Brand'
import { NAV_ICONS } from './navIcons'

type Tooltip = { label: string; x: number; y: number }

function MenuLinks({ onSelect, compact = false }: { onSelect: () => void; compact?: boolean }) {
  const menuId = useId()
  const [tip, setTip] = useState<Tooltip | null>(null)
  const hide = () => setTip(null)
  const show = (link: HTMLAnchorElement, label: string) => {
    if (!compact) return
    const { right, top, height } = link.getBoundingClientRect()
    setTip({ label, x: right + 10, y: top + height / 2 })
  }
  return (
    <nav
      aria-label="Seções do jogo"
      className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-2 py-2"
      onScroll={hide}
      onKeyDown={(event) => {
        if (event.key === 'Escape') hide()
      }}
    >
      {NAV_GROUPS.map(({ title, items }, index) => (
        <section key={title} aria-labelledby={`${menuId}-${index}`}>
          <h2
            id={`${menuId}-${index}`}
            className={`subtitle mb-1 text-secondary ${compact ? 'text-center text-[0.625rem] lg:px-3 lg:text-left lg:text-xs' : 'px-3 text-xs'}`}
          >
            {title}
          </h2>
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = NAV_ICONS[item.id]
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    end
                    onClick={() => {
                      hide()
                      onSelect()
                    }}
                    onPointerEnter={(event) => show(event.currentTarget, item.label)}
                    onPointerLeave={hide}
                    onFocus={(event) => show(event.currentTarget, item.label)}
                    onBlur={hide}
                    className={({ isActive }) =>
                      `flex min-h-10 items-center rounded-md text-sm transition-colors focus-visible:outline-offset-[-2px] ${compact ? 'justify-center lg:justify-start lg:gap-3 lg:px-3' : 'gap-3 px-3'} ${isActive ? 'bg-primary font-semibold text-on-primary' : 'text-fg hover:bg-raised'}`
                    }
                  >
                    <Icon size={20} aria-hidden className="shrink-0" />
                    <span className={compact ? 'sr-only lg:not-sr-only' : undefined}>
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      {tip && (
        <span
          aria-hidden
          className="pointer-events-none fixed z-40 hidden -translate-y-1/2 rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-fg shadow-lg md:block lg:hidden"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.label}
        </span>
      )}
    </nav>
  )
}

function MenuHeader({ children }: { children?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-line p-3 md:justify-center lg:justify-between">
      <span className="rounded-md bg-[#071C2A] p-1.5 md:hidden lg:inline">
        <Brand />
      </span>
      <span className="hidden md:inline lg:hidden">
        <Brand showWordmark={false} />
      </span>
      {children}
    </div>
  )
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const drawer = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = drawer.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open || typeof window.matchMedia !== 'function') return
    const tablet = window.matchMedia('(min-width: 48rem)')
    const closeOnResize = () => {
      if (tablet.matches) onClose()
    }
    closeOnResize()
    tablet.addEventListener('change', closeOnResize)
    return () => tablet.removeEventListener('change', closeOnResize)
  }, [onClose, open])

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-[5rem] shrink-0 flex-col border-r border-line bg-panel md:flex lg:w-72">
        <MenuHeader />
        <MenuLinks compact onSelect={onClose} />
      </aside>
      <dialog
        id="menu-lateral"
        ref={drawer}
        aria-label="Menu de navegação"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[calc(100vw-2rem)] border-r border-line bg-panel p-0 text-fg backdrop:bg-black/60 md:hidden"
        onCancel={(event) => {
          event.preventDefault()
          onClose()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        {open && (
          <div className="flex h-full flex-col">
            <MenuHeader>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={onClose}
                className="grid size-10 place-items-center rounded-md hover:bg-raised"
              >
                <X size={20} aria-hidden />
              </button>
            </MenuHeader>
            <MenuLinks onSelect={onClose} />
          </div>
        )}
      </dialog>
    </>
  )
}
