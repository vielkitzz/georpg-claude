import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Sidebar } from './Sidebar'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar open={false} onClose={() => {}} />
    </MemoryRouter>,
  )

describe('Sidebar', () => {
  it('mostra as dez seções', () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: 'Seções do jogo' })
    expect(nav.children).toHaveLength(10)
  })

  it('seções que ainda não existem ficam desabilitadas com "em breve"', () => {
    renderAt('/')
    const economia = screen.getByText('Economia').closest('[aria-disabled]')
    expect(economia).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getAllByText('em breve')).toHaveLength(7)
  })

  it('destaca a seção ativa', () => {
    renderAt('/governo')
    const link = screen.getByRole('link', { name: 'Governo e política' })
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link.className).toContain('bg-primary')
    expect(screen.getByRole('link', { name: 'Visão geral' })).not.toHaveAttribute('aria-current')
  })

  it('não tem "Fundar nação"', () => {
    renderAt('/')
    expect(screen.queryByText(/fundar/i)).toBeNull()
  })
})
