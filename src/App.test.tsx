import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, useLocation } from 'react-router'

// Route integration tests use demo data; nation authorization is tested separately.
vi.mock('./auth/RequireNation', () => ({ RequireNation: () => <Outlet /> }))
vi.mock('./data/get-my-nation-profile', async (load) => {
  const actual = await load<typeof import('./data/get-my-nation-profile')>()
  const { profileFixture } = await import('./test/nation-profile')
  return {
    ...actual,
    myNationProfileQuery: { ...actual.myNationProfileQuery, queryFn: async () => profileFixture },
  }
})
import { App } from './App'
import type { AuthValue } from './auth/AuthContext'
import { RepositoryProvider } from './data/RepositoryProvider'
import { DEMO_NATION, demoRepository } from './data/demo'
import type { GameRepository } from './data/repository'
import { NAV_ITEMS } from './domain/nav'
import { FakeAuth } from './test/auth'

function CurrentAddress() {
  const { pathname, search, hash } = useLocation()
  return (
    <output data-testid="address">
      {pathname}
      {search}
      {hash}
    </output>
  )
}

const renderAt = (
  path: string,
  auth: Partial<AuthValue> = {},
  repository: GameRepository = demoRepository,
) =>
  render(
    <FakeAuth value={auth}>
      <RepositoryProvider repository={repository}>
        <MemoryRouter initialEntries={[path]}>
          <CurrentAddress />
          <App />
        </MemoryRouter>
      </RepositoryProvider>
    </FakeAuth>,
  )

describe('App com acesso liberado', () => {
  it('a visão geral mostra a nação de demonstração', async () => {
    renderAt('/')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'República do Teste' }),
    ).toBeInTheDocument()
    expect(
      await within(screen.getByRole('banner')).findByText('Janeiro de 1920'),
    ).toBeInTheDocument()
  })

  it('governo mostra instituições, gabinete e parlamento', async () => {
    renderAt('/governo')
    expect(
      await screen.findByRole('heading', { name: 'Instituições políticas' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Gabinete ministerial' })).toBeInTheDocument()
    expect(screen.getByText(/O governo tem 60 de 100 cadeiras/)).toBeInTheDocument()
  })

  it('mapa renderiza a lista de 50 territórios', async () => {
    renderAt('/mapa')
    expect(await screen.findByRole('list', { name: 'Territórios' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Território \d+/ })).toHaveLength(50)
  })

  it('a Topbar mostra o jogador do Discord', async () => {
    renderAt('/')
    expect(await within(screen.getByRole('banner')).findByText('Fulano')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /avisos/i })).not.toBeInTheDocument()
  })

  it('abre todas as páginas pelo menu com o título e a seleção correspondentes', async () => {
    renderAt('/')
    const menu = within(screen.getByRole('navigation', { name: 'Seções do jogo' }))
    for (const item of NAV_ITEMS) {
      const routes = [
        { label: item.label, path: item.path },
        ...(item.children ?? []).map((child) => ({
          label: child.label,
          path: `${item.path}/${child.id}`,
        })),
      ]
      for (const route of routes) {
        const link = menu.getByRole('link', { name: route.label })
        fireEvent.click(link)
        expect(
          await screen.findByRole('heading', {
            name: route.path === '/nacao' ? 'República do Teste' : route.label,
            level: 1,
          }),
        ).toBeInTheDocument()
        expect(link).toHaveAttribute('aria-current', 'page')
        expect(screen.getByTestId('address')).toHaveTextContent(route.path)
      }
    }
  }, 20_000)

  it.each([
    ['/', '/nacao', 'República do Teste'],
    ['/mapa', '/mapa-mundial', 'Mapa Mundial'],
    ['/militar', '/defesa', 'Defesa'],
    ['/tecnologia', '/infraestrutura', 'Infraestrutura'],
    ['/imprensa', '/historico/relatorios', 'Relatórios'],
  ])('redireciona %s para %s e preserva consulta e fragmento', async (legacy, canonical, title) => {
    renderAt(`${legacy}?origem=link#consulta`)
    expect(await screen.findByRole('heading', { name: title, level: 1 })).toBeInTheDocument()
    expect(screen.getByTestId('address').textContent).toBe(`${canonical}?origem=link#consulta`)
  })

  it('abre diretamente uma subpágina e apresenta seu estado contextual', async () => {
    renderAt('/governo/eleicoes')
    expect(await screen.findByRole('heading', { level: 1, name: 'Eleições' })).toBeInTheDocument()
    expect(
      await screen.findByText(/O sistema de eleições será disponibilizado/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submenu de Governo' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('reaproveita a moeda registrada no Banco Central e o turno atual no Histórico', async () => {
    renderAt('/economia/banco-central')
    expect(await screen.findByText('TST', { exact: true })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Submenu de Histórico' }))
    fireEvent.click(screen.getByRole('link', { name: 'Turnos' }))
    expect(await screen.findByRole('heading', { name: 'Turno atual' })).toBeInTheDocument()
    expect(await screen.findByText('Turno registrado')).toBeInTheDocument()
  })

  it('apresenta estado vazio contextual quando a infraestrutura não tem registros', async () => {
    renderAt('/infraestrutura')
    expect(
      await screen.findByRole('heading', { name: 'Projetos e investimentos' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Obras e despesas de infraestrutura aparecerão/)).toBeInTheDocument()
  })

  it('trata carregamento e erro do repositório', async () => {
    const getNation = vi.fn().mockRejectedValue(new Error('Indisponível'))
    renderAt('/economia', {}, { ...demoRepository, getNation })
    expect(screen.getByText('Carregando a nação…')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a nação')
  })

  it('exibe ausência de dados nacionais quando o repositório está vazio', async () => {
    renderAt('/imprensa', {}, { ...demoRepository, getNation: async () => null })
    expect(await screen.findByText('Você ainda não fundou uma nação.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Notícias nacionais' })).not.toBeInTheDocument()
  })

  it('mostra a aprovação atual sem simular histórico de turnos', async () => {
    renderAt(
      '/',
      {},
      {
        ...demoRepository,
        getNation: async () => ({ ...DEMO_NATION, approvalHistory: [54] }),
      },
    )
    const approval = await screen.findByRole('button', { name: 'Sobre Aprovação' })
    expect(
      approval.closest('.profile-stat')?.querySelector('.profile-stat-value'),
    ).toHaveTextContent('54%')
    expect(screen.queryByRole('img', { name: 'Histórico de Aprovação' })).not.toBeInTheDocument()
    expect(screen.getByText(/Os alertas passam a aparecer quando as ordens/)).toBeInTheDocument()
  })

  it('"Sair" encerra a sessão e leva a /login', async () => {
    const signOut = vi.fn(async () => {})
    renderAt('/', { signOut, auth: 'signed' })
    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }))
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('/criar-pais existe como rota', () => {
    renderAt('/criar-pais')
    expect(screen.getByRole('heading', { name: 'Fundação de nação' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Seções do jogo' })).not.toBeInTheDocument()
  })
})

describe('guarda de acesso', () => {
  it.each(
    NAV_ITEMS.flatMap((item) => [
      item.path,
      ...(item.children ?? []).map((child) => `${item.path}/${child.id}`),
    ]),
  )('sem sessão, %s cai no login', (path) => {
    renderAt(path, { auth: 'anon', guild: { status: 'idle' }, player: null })
    expect(screen.getByRole('heading', { name: 'Entrar no GeoRPG' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar com o Discord' })).toBeInTheDocument()
  })

  it('o botão do login chama o login do Discord', async () => {
    const signIn = vi.fn(async () => {})
    renderAt('/login', { auth: 'anon', guild: { status: 'idle' }, player: null, signIn })
    await userEvent.click(screen.getByRole('button', { name: 'Entrar com o Discord' }))
    expect(signIn).toHaveBeenCalledOnce()
  })

  it('logado e dentro do servidor, /login volta para a visão geral', async () => {
    renderAt('/login')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'República do Teste' }),
    ).toBeInTheDocument()
  })

  it('enquanto confere o servidor, mostra "verificando" e não o jogo', () => {
    renderAt('/', { guild: { status: 'checking' } })
    expect(screen.getByRole('heading', { name: 'Verificando' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Seções do jogo' })).toBeNull()
  })

  it('fora do servidor, oferece entrar de novo, já entrei e sair', async () => {
    const [signIn, recheck, signOut] = [vi.fn(async () => {}), vi.fn(), vi.fn(async () => {})]
    renderAt('/', { guild: { status: 'not_in_guild' }, signIn, recheck, signOut })
    expect(screen.getByRole('heading', { name: 'Entre no servidor' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Entrar de novo' }))
    await userEvent.click(screen.getByRole('button', { name: 'Já entrei' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(signIn).toHaveBeenCalledOnce()
    expect(recheck).toHaveBeenCalledOnce()
    expect(signOut).toHaveBeenCalledOnce()
    expect(screen.queryByRole('navigation', { name: 'Seções do jogo' })).toBeNull()
  })

  it('não configurado: acesso bloqueado (falha fechada)', () => {
    renderAt('/', { guild: { status: 'not_configured' } })
    expect(screen.getByRole('heading', { name: 'Acesso indisponível' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Seções do jogo' })).toBeNull()
  })

  it('sem variáveis do Supabase no navegador, também bloqueia', () => {
    renderAt('/', { auth: 'unconfigured', guild: { status: 'idle' }, player: null })
    expect(screen.getByRole('heading', { name: 'Acesso indisponível' })).toBeInTheDocument()
  })

  it('erro: permite tentar de novo', async () => {
    const recheck = vi.fn()
    renderAt('/', { guild: { status: 'error' }, recheck })
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(recheck).toHaveBeenCalledOnce()
  })

  it('conta suspensa não entra', () => {
    renderAt('/', { guild: { status: 'banned' } })
    expect(screen.getByRole('heading', { name: 'Conta suspensa' })).toBeInTheDocument()
  })
})
