import { ChevronDown, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { matchPath, NavLink, useLocation } from 'react-router'
import { NAV_ITEMS, type NavId, type NavItem } from '@/domain/nav'
import { Brand } from './Brand'
import { NAV_ICONS } from './navIcons'

type Tooltip = { label: string; x: number; y: number }
const linkColor = (isActive: boolean) =>
  isActive
    ? 'border-primary bg-panel font-semibold text-fg'
    : 'border-transparent text-fg hover:bg-raised'

function MenuLinks({
  onSelect,
  expanded,
  toggle,
  compact = false,
}: {
  onSelect: () => void
  expanded: ReadonlySet<NavId>
  toggle: (id: NavId) => void
  compact?: boolean
}) {
  const menuId = useId()
  const { pathname } = useLocation()
  const [tip, setTip] = useState<Tooltip | null>(null)
  const hide = () => setTip(null)
  const show = (element: HTMLElement, label: string) => {
    if (!compact) return
    const { right, top, height } = element.getBoundingClientRect()
    setTip({ label, x: right + 10, y: top + height / 2 })
  }
  const tipEvents = (label: string) => ({
    onPointerEnter: (event: PointerEvent<HTMLElement>) => show(event.currentTarget, label),
    onPointerLeave: hide,
    onFocus: (event: FocusEvent<HTMLElement>) => show(event.currentTarget, label),
    onBlur: hide,
  })
  const select = () => {
    hide()
    onSelect()
  }
  const routeInSection = (item: NavItem) =>
    Boolean(matchPath({ path: item.path, end: false }, pathname))

  return (
    <nav
      aria-label="Seções do jogo"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
      onScroll={hide}
      onKeyDown={(event) => {
        if (event.key === 'Escape') hide()
      }}
    >
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.id]
          const activeSection = routeInSection(item)
          const open = activeSection || expanded.has(item.id)
          const submenuId = `${menuId}-${item.id}`
          const secondary = compact
            ? 'justify-center gap-0 lg:justify-start lg:gap-3 lg:px-2'
            : 'gap-3 px-2'
          return (
            <li key={item.id}>
              <div className="flex h-[42px] items-stretch gap-0.5">
                <NavLink
                  to={item.path}
                  end
                  onClick={select}
                  {...tipEvents(item.label)}
                  className={({ isActive }) =>
                    `flex min-w-0 flex-1 items-center rounded-md border-l-2 text-sm transition-colors focus-visible:outline-offset-[-2px] ${secondary} ${linkColor(isActive)} ${activeSection && !isActive ? 'text-secondary' : ''}`
                  }
                >
                  <Icon size={20} aria-hidden className="shrink-0" />
                  <span className={compact ? 'sr-only lg:not-sr-only' : undefined}>
                    {item.label}
                  </span>
                </NavLink>
                {item.children && (
                  <button
                    type="button"
                    aria-label={`Submenu de ${item.label}`}
                    aria-controls={submenuId}
                    aria-expanded={open}
                    aria-disabled={activeSection || undefined}
                    className={`grid shrink-0 place-items-center self-center rounded-md text-muted focus-visible:outline-offset-[-2px] ${compact ? 'h-9 w-6 lg:w-9' : 'size-9'} ${activeSection ? 'text-secondary' : 'hover:bg-raised'}`}
                    {...tipEvents(`Submenu de ${item.label}`)}
                    onClick={() => {
                      hide()
                      if (!activeSection) toggle(item.id)
                    }}
                  >
                    <ChevronDown
                      size={16}
                      aria-hidden
                      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>
              {item.children && (
                <div
                  id={submenuId}
                  inert={!open}
                  aria-hidden={!open || undefined}
                  className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <ul
                      className={`my-1 space-y-0.5 rounded-md border-l border-line ${compact ? 'mx-1 bg-panel/45 px-1 lg:mr-0 lg:ml-5 lg:bg-transparent' : 'ml-5 pl-1'}`}
                    >
                      {item.children.map((child) => {
                        const ChildIcon = NAV_ICONS[child.id]
                        return (
                          <li key={child.id}>
                            <NavLink
                              to={`${item.path}/${child.id}`}
                              end
                              onClick={select}
                              {...tipEvents(child.label)}
                              className={({ isActive }) =>
                                `flex min-h-9 items-center rounded-md border-l-2 text-sm transition-colors focus-visible:outline-offset-[-2px] ${secondary} ${linkColor(isActive)}`
                              }
                            >
                              <ChildIcon size={16} aria-hidden className="shrink-0" />
                              <span className={compact ? 'sr-only lg:not-sr-only' : undefined}>
                                {child.label}
                              </span>
                            </NavLink>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {tip && (
        <span
          aria-hidden
          style={{ left: tip.x, top: tip.y }}
          className="pointer-events-none fixed z-40 hidden -translate-y-1/2 rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-fg shadow-lg md:block lg:hidden"
        >
          {tip.label}
        </span>
      )}
    </nav>
  )
}

function MenuHeader({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-3 md:justify-center lg:justify-between">
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
  const [expanded, setExpanded] = useState<ReadonlySet<NavId>>(() => new Set())
  const toggle = (id: NavId) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

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
      <aside className="sticky top-0 z-20 hidden h-dvh w-20 shrink-0 flex-col border-r border-line bg-bg md:flex lg:w-72">
        <MenuHeader />
        <MenuLinks compact onSelect={onClose} expanded={expanded} toggle={toggle} />
      </aside>
      <dialog
        id="menu-lateral"
        ref={drawer}
        aria-label="Menu de navegação"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[calc(100vw-2rem)] border-r border-line bg-bg p-0 text-fg backdrop:bg-black/60 md:hidden"
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
            <MenuLinks onSelect={onClose} expanded={expanded} toggle={toggle} />
          </div>
        )}
      </dialog>
    </>
  )
}
