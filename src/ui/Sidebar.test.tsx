import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter } from 'react-router'
import { NAV_ITEMS } from '@/domain/nav'
import { Sidebar } from './Sidebar'

// O navegador implementa a gaveta modal. No jsdom, simulamos sua propriedade open.
if (!HTMLDialogElement.prototype.showModal) {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      value(this: HTMLDialogElement) {
        this.open = true
      },
    },
    close: {
      value(this: HTMLDialogElement) {
        this.open = false
      },
    },
  })
}

function MenuHarness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-lateral"
        onClick={() => setOpen(true)}
      >
        Abrir menu
      </button>
      <Sidebar open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <MenuHarness />
    </MemoryRouter>,
  )
  return within(screen.getByRole('navigation', { name: 'Seções do jogo' }))
}

describe('Sidebar', () => {
  it('apresenta dez links principais e todos os 39 sublinks ao abrir as seções', () => {
    const menu = renderAt('/nacao')
    const links = () => menu.getAllByRole('link')
    expect(links()).toHaveLength(10)
    for (const item of NAV_ITEMS) {
      expect(menu.getByRole('link', { name: item.label })).toHaveAttribute('href', item.path)
      if (item.children) {
        const control = menu.getByRole('button', { name: `Submenu de ${item.label}` })
        expect(control).toHaveAttribute('aria-expanded', 'false')
        fireEvent.click(control)
        expect(control).toHaveAttribute('aria-expanded', 'true')
        const submenu = document.getElementById(control.getAttribute('aria-controls') ?? '')
        if (!submenu) throw new Error(`Submenu ausente para ${item.label}`)
        for (const child of item.children) {
          expect(within(submenu).getByRole('link', { name: child.label })).toHaveAttribute(
            'href',
            `${item.path}/${child.id}`,
          )
        }
      }
    }
    expect(links()).toHaveLength(49)
    expect(links().map((link) => link.getAttribute('href'))).not.toContain('/criar-pais')
    expect(menu.queryByRole('link', { name: 'Imprensa' })).not.toBeInTheDocument()
  }, 15_000)

  it('mantém a seção ativa aberta e permite recolher as demais sem navegação', () => {
    const menu = renderAt('/governo/congresso')
    const congress = menu.getByRole('link', { name: 'Congresso' })
    const government = menu.getByRole('link', { name: 'Governo' })
    const governmentControl = menu.getByRole('button', { name: 'Submenu de Governo' })
    const economyControl = menu.getByRole('button', { name: 'Submenu de Economia' })
    const historyControl = menu.getByRole('button', { name: 'Submenu de Histórico' })
    expect(congress).toHaveAttribute('aria-current', 'page')
    expect(congress).toHaveClass('bg-panel', 'border-primary')
    expect(government).not.toHaveAttribute('aria-current')
    fireEvent.click(governmentControl)
    expect(governmentControl).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(economyControl)
    fireEvent.click(historyControl)
    expect(economyControl).toHaveAttribute('aria-expanded', 'true')
    expect(historyControl).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(economyControl)
    expect(menu.queryByRole('link', { name: 'Banco Central' })).not.toBeInTheDocument()
    expect(historyControl).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(government)
    expect(government).toHaveAttribute('aria-current', 'page')
    expect(historyControl).toHaveAttribute('aria-expanded', 'true')
  })

  it('mostra a dica de ícone ao receber foco por teclado e segue o link com Enter', async () => {
    const user = userEvent.setup()
    const menu = renderAt('/governo')
    const nation = menu.getByRole('link', { name: 'Nação' })
    await user.tab()
    await user.tab()
    expect(nation).toHaveFocus()
    expect(menu.getByText('Nação', { selector: 'span[aria-hidden="true"]' })).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(nation).toHaveAttribute('aria-current', 'page')
  })

  it('fecha a gaveta móvel ao cancelar e depois ao escolher uma subpágina', () => {
    renderAt('/nacao')
    const opener = screen.getByRole('button', { name: 'Abrir menu' })
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Menu de navegação' })
    expect(opener).toHaveAttribute('aria-expanded', 'true')
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(opener)
    const drawer = within(screen.getByRole('dialog'))
    fireEvent.click(drawer.getByRole('button', { name: 'Submenu de Histórico' }))
    fireEvent.click(drawer.getByRole('link', { name: 'Turnos' }))
    expect(opener).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Turnos' })).toHaveAttribute('aria-current', 'page')
  })
})
