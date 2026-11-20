import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter } from 'react-router'
import { NAV_GROUPS, NAV_ITEMS } from '@/domain/nav'
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

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <MenuHarness />
    </MemoryRouter>,
  )

describe('Sidebar', () => {
  it('mostra os grupos e seus links com rótulos acessíveis', () => {
    renderAt('/')
    const menu = within(screen.getByRole('navigation', { name: 'Seções do jogo' }))
    expect(menu.getAllByRole('link')).toHaveLength(NAV_ITEMS.length)
    for (const group of NAV_GROUPS) {
      expect(menu.getByRole('heading', { name: group.title })).toBeInTheDocument()
      for (const item of group.items)
        expect(menu.getByRole('link', { name: item.label })).toHaveAttribute('href', item.path)
    }
    expect(menu.queryByRole('link', { name: /fundação/i })).not.toBeInTheDocument()
  })

  it('marca a seção ativa e permite navegar e revelar a dica com o teclado', async () => {
    const user = userEvent.setup()
    renderAt('/governo')
    const government = screen.getByRole('link', { name: 'Governo e Política' })
    const overview = screen.getByRole('link', { name: 'Painel Geral' })
    expect(government).toHaveAttribute('aria-current', 'page')
    expect(government.className).toContain('bg-primary')
    await user.tab()
    await user.tab()
    expect(overview).toHaveFocus()
    expect(
      screen.getByText('Painel Geral', { selector: 'span[aria-hidden="true"]' }),
    ).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(overview).toHaveAttribute('aria-current', 'page')
    expect(government).not.toHaveAttribute('aria-current')
  })

  it('abre e fecha a gaveta móvel ao cancelar ou escolher um link', () => {
    renderAt('/')
    const opener = screen.getByRole('button', { name: 'Abrir menu' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Menu de navegação' })
    expect(opener).toHaveAttribute('aria-expanded', 'true')
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(opener)
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('link', { name: 'Histórico Nacional' }),
    )
    expect(opener).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
