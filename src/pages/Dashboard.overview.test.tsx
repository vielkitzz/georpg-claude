import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DEMO_NATION, DEMO_WORLD } from '@/data/demo'
import { RepositoryProvider } from '@/data/RepositoryProvider'
import { DashboardPage } from './Dashboard'

it('mostra os símbolos, as etiquetas do anexo e os indicadores estáveis na visão geral', async () => {
  const coatOfArms = 'https://storage.example/brasao.png?token=assinatura'
  const nation = {
    ...DEMO_NATION,
    symbols: { ...DEMO_NATION.symbols, coatOfArms },
    indicators: [
      { ...DEMO_NATION.indicators[0], delta: 0 },
      { ...DEMO_NATION.indicators[1], delta: 1, deltaText: '+1' },
    ],
  }
  render(
    <RepositoryProvider
      repository={{
        getNation: async () => nation,
        getWorldState: async () => DEMO_WORLD,
        getTerritoryClaims: async () => [],
      }}
    >
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </RepositoryProvider>,
  )

  const hero = await screen.findByRole('region', { name: 'Identidade da nação' })
  expect(within(hero).getByRole('img', { name: 'Bandeira' })).toHaveAttribute(
    'src',
    nation.symbols.flag,
  )
  expect(within(hero).getByRole('img', { name: 'Brasão de armas' })).toHaveAttribute(
    'src',
    coatOfArms,
  )
  expect(within(hero).getByText('República').querySelector('use')).toHaveAttribute(
    'href',
    expect.stringMatching(/#republica$/),
  )
  expect(within(hero).getByText('Liberalismo clássico').querySelector('use')).toHaveAttribute(
    'href',
    expect.stringMatching(/#liberal-classico$/),
  )

  const unchanged = screen.getByText('Sem variação no último tick').parentElement?.parentElement
  const changed = screen.getByText('+1 no último tick').parentElement?.parentElement
  expect(unchanged?.style.backgroundImage).toBe('')
  expect(changed?.style.backgroundImage).toMatch(/^linear-gradient/)
  expect(screen.getByRole('img', { name: 'Mapa do território de Teste' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Restaurar enquadramento' })).toBeInTheDocument()
})
