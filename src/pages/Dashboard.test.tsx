import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { profileFixture } from '@/test/nation-profile'
import { AlertCard, DashboardPage, DiplomaticSheet, ProfileHeader, ProfileStats } from './Dashboard'

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
  expect(screen.getByRole('button', { name: /Editar símbolos/ })).toBeDisabled()
})

it('omite a chefia de Governo ausente da ficha', () => {
  route(<DiplomaticSheet profile={profileFixture} />)
  expect(screen.getByText('Presidente: Alda')).toBeInTheDocument()
  expect(screen.queryByText('Chefe de Governo')).not.toBeInTheDocument()
})

it('renderiza dois cartões sem nota enquanto o tick diário está indisponível', () => {
  route(<ProfileStats legitimacy={60} approval={39} />)
  const section = within(screen.getByRole('region', { name: 'Como estou' }))
  expect(section.getAllByText('—')).toHaveLength(2)
  expect(section.getAllByText('Disponível quando o tick diário estiver ativo')).toHaveLength(2)
  expect(section.getByRole('link', { name: /boa.*legitimidade/i })).toHaveAttribute(
    'href',
    '/governo',
  )
  expect(section.getByRole('link', { name: /crítica.*aprovação/i })).toBeInTheDocument()
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
