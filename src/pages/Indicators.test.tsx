import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet } from 'react-router'
import { App } from '@/App'
import { DEMO_NATION } from '@/data/demo'
import { RepositoryContext } from '@/data/repository'
import { FakeAuth } from '@/test/auth'

vi.mock('@/auth/RequireNation', () => ({ RequireNation: () => <Outlet /> }))

function openIndicators(path = '/indicadores', nation = DEMO_NATION) {
  return render(
    <RepositoryContext.Provider
      value={{
        getNation: async () => nation,
        getWorldState: async () => ({ tickIndex: 1 }),
        getTerritoryClaims: async () => [],
      }}
    >
      <FakeAuth>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </FakeAuth>
    </RepositoryContext.Provider>,
  )
}

it('permite abrir uma categoria e navegar até o histórico de um indicador', async () => {
  openIndicators()
  const download = await screen.findByRole('link', { name: 'Baixar CSV' })
  expect(decodeURIComponent(download.getAttribute('href') ?? '')).toContain('"PIB";')

  fireEvent.click(screen.getByRole('link', { name: 'Ver indicadores de Economia' }))
  const tabs = await screen.findByRole('navigation', { name: 'Seções de indicadores' })
  expect(await within(tabs).findByRole('link', { name: 'Economia' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  fireEvent.click(await screen.findByRole('link', { name: 'Ver detalhes de PIB' }))
  expect(await screen.findByRole('heading', { name: 'PIB' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Histórico de PIB/ })).toBeInTheDocument()
})

it('busca sem acentos e mostra as relações de cálculo do indicador selecionado', async () => {
  openIndicators('/indicadores/teia')
  fireEvent.change(await screen.findByRole('searchbox'), { target: { value: 'inflacao' } })
  fireEvent.click(screen.getByRole('link', { name: 'Inflação' }))
  const uses = screen.getByRole('heading', { name: 'Usado no cálculo de' }).parentElement!
  fireEvent.click(within(uses).getByRole('link', { name: /Estabilidade/ }))
  expect(screen.getByRole('heading', { name: 'O que compõe' })).toBeInTheDocument()
})

it('abre uma métrica sem série e exibe o estado de histórico insuficiente', async () => {
  openIndicators('/indicadores/metrica/populacao')
  expect(await screen.findByRole('heading', { name: 'População' })).toBeInTheDocument()
  expect(
    screen.getByText('O gráfico aparece quando houver pelo menos dois registros.'),
  ).toBeInTheDocument()
  expect(within(screen.getByRole('main')).queryByRole('img')).not.toBeInTheDocument()
})
