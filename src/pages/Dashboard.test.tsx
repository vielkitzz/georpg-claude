import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { demoRepository } from '@/data/demo'
import { RepositoryContext } from '@/data/repository'
import { profileFixture } from '@/test/nation-profile'
import { AlertCard, DashboardPage, DiplomaticSheet } from './Dashboard'
import { ProfileHeader, ProfileStats } from './nation-profile-components'

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }))
vi.mock('@/auth/supabase', () => ({ getSupabase: () => ({ functions: { invoke } }) }))

function route(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>)
}

it('carrega uma bandeira HTTPS e exibe o nome do símbolo para texto e links inseguros', () => {
  const profile = {
    ...profileFixture,
    symbols: {
      ...profileFixture.symbols,
      flag: 'https://assets.example/bandeira.png',
      coatOfArms: 'http://assets.example/brasao.png',
    },
  }
  const { rerender } = render(
    <ProfileHeader profile={profile} color="#123456" ideology="Reformismo" />,
  )
  expect(screen.getByRole('img', { name: 'Bandeira' })).toHaveAttribute(
    'src',
    'https://assets.example/bandeira.png',
  )
  expect(screen.queryByRole('img', { name: 'Brasão' })).not.toBeInTheDocument()
  expect(screen.getByText('Brasão')).toBeInTheDocument()
  rerender(
    <ProfileHeader
      profile={{ ...profile, symbols: { ...profile.symbols, flag: 'Listras brancas' } }}
      color={null}
      ideology={null}
    />,
  )
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(screen.getByText('Bandeira')).toBeInTheDocument()
  expect(screen.getByText('República')).toBeInTheDocument()
  expect(screen.getByText('Presidencialismo')).toBeInTheDocument()
})

it('omite a chefia de Governo ausente da ficha', () => {
  route(<DiplomaticSheet profile={profileFixture} />)
  expect(screen.getByText('Presidente: Alda')).toBeInTheDocument()
  expect(screen.queryByText('Chefe de Governo')).not.toBeInTheDocument()
})

it('mantém os sete indicadores nas duas linhas quando faltam dados', () => {
  route(<ProfileStats legitimacy={60} approval={39} />)
  const section = within(screen.getByRole('region', { name: 'Indicadores' }))
  const [politics, economy] = screen
    .getByRole('region', { name: 'Indicadores' })
    .querySelectorAll('dl')
  expect(within(politics).getAllByRole('term')).toHaveLength(3)
  expect(within(economy).getAllByRole('term')).toHaveLength(4)
  expect(section.getAllByText('—')).toHaveLength(5)
  expect(section.getAllByText('Sem histórico')).toHaveLength(7)
  expect(section.queryByRole('img')).not.toBeInTheDocument()
  expect(section.getByRole('link', { name: 'Ver mais indicadores' })).toHaveAttribute(
    'href',
    '/indicadores',
  )
  const info = section.getByRole('button', { name: 'Sobre Estabilidade' })
  const explanation = document.getElementById(info.getAttribute('popovertarget') ?? '')
  expect(explanation).toHaveTextContent('menor risco de crise')
  expect(
    section.getByRole('button', { name: 'Sobre Legitimidade' }).closest('.profile-stat'),
  ).toHaveAttribute('data-tone', 'flat')
})

it('usa o histórico registrado e interpreta a queda do desemprego como favorável', () => {
  route(
    <ProfileStats
      legitimacy={95}
      approval={85}
      approvalHistory={[88, 83, 82]}
      indicators={[
        { label: 'Inflação', value: '3,1%', delta: 0.3 },
        { label: 'Desemprego', value: '7,4%', delta: -0.2 },
      ]}
    />,
  )
  const approval = screen.getByRole('button', { name: 'Sobre Aprovação' }).closest('.profile-stat')
  expect(approval).toHaveTextContent('82%')
  expect(approval).toHaveTextContent('−1,0 no último tick')
  expect(approval).toHaveAttribute('data-tone', 'bad')
  expect(
    screen
      .getByRole('img', { name: 'Histórico de Aprovação' })
      .querySelector('polyline')
      ?.getAttribute('points')
      ?.split(' '),
  ).toHaveLength(3)
  expect(
    screen.getByRole('button', { name: 'Sobre Inflação' }).closest('.profile-stat'),
  ).toHaveAttribute('data-tone', 'bad')
  expect(
    screen.getByRole('button', { name: 'Sobre Desemprego' }).closest('.profile-stat'),
  ).toHaveAttribute('data-tone', 'good')
})

it('alterna a aba pela URL, preserva o cabeçalho e exibe indicadores do repositório', async () => {
  invoke.mockReset().mockResolvedValueOnce({ data: profileFixture, error: null })
  render(
    <MemoryRouter initialEntries={['/nacao?aba=informacoes&origem=menu']}>
      <RepositoryContext.Provider value={demoRepository}>
        <QueryClientProvider client={new QueryClient()}>
          <DashboardPage />
        </QueryClientProvider>
      </RepositoryContext.Provider>
    </MemoryRouter>,
  )

  const header = await screen.findByRole('heading', { name: profileFixture.officialName, level: 1 })
  const nav = within(screen.getByRole('navigation', { name: 'Visões da nação' }))
  expect(nav.getByRole('link', { name: 'Informações básicas' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(await screen.findByText('1.000.000 hab.')).toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'Indicadores' })).not.toBeInTheDocument()

  const indicators = nav.getByRole('link', { name: 'Indicadores' })
  expect(indicators).toHaveAttribute('href', '/nacao?aba=indicadores&origem=menu')
  fireEvent.click(indicators)
  expect(indicators).toHaveAttribute('aria-current', 'page')
  expect(header).toBeInTheDocument()
  expect(screen.getByText('TST 310 mi')).toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'Informações básicas' })).not.toBeInTheDocument()

  const overview = nav.getByRole('link', { name: 'Visão geral' })
  expect(overview).toHaveAttribute('href', '/nacao?origem=menu')
  fireEvent.click(overview)
  expect(screen.getByRole('region', { name: 'Território nacional' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Retrato ideológico' })).toBeInTheDocument()
})

it.each([
  ['urgente', 'Urgente'],
  ['atencao', 'Atenção'],
] as const)('identifica a severidade %s por texto', (severidade, label) => {
  route(
    <AlertCard
      severidade={severidade}
      area="Economia"
      titulo="Ver contas"
      motivo="Registro de teste"
      href="/economia"
    />,
  )
  expect(screen.getByText(label)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ver contas' })).toHaveAttribute('href', '/economia')
})

it('mostra os esqueletos e permite repetir uma consulta GET que falhou', async () => {
  invoke
    .mockReset()
    .mockResolvedValueOnce({ data: null, error: new Error('Indisponível') })
    .mockResolvedValueOnce({ data: profileFixture, error: null })
  route(
    <QueryClientProvider client={new QueryClient()}>
      <DashboardPage />
    </QueryClientProvider>,
  )
  expect(screen.getByRole('status', { name: 'Carregando sua nação' })).toBeInTheDocument()
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar sua nação')
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(
    await screen.findByRole('heading', { name: profileFixture.officialName, level: 1 }),
  ).toBeInTheDocument()
  expect(invoke).toHaveBeenCalledTimes(2)
  expect(invoke).toHaveBeenCalledWith(
    'my-nation-profile',
    expect.objectContaining({ method: 'GET' }),
  )
})
