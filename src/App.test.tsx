import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet } from 'react-router'

// Route integration tests use demo data; nation authorization is tested separately.
vi.mock('./auth/RequireNation', () => ({ RequireNation: () => <Outlet /> }))
import { App } from './App'
import type { AuthValue } from './auth/AuthContext'
import { RepositoryProvider } from './data/RepositoryProvider'
import { FakeAuth } from './test/auth'

const renderAt = (path: string, auth: Partial<AuthValue> = {}) =>
  render(
    <FakeAuth value={auth}>
      <RepositoryProvider>
        <MemoryRouter initialEntries={[path]}>
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
    expect(await screen.findByRole('heading', { name: 'Instituições' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Gabinete' })).toBeInTheDocument()
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
  })
})

describe('guarda de acesso', () => {
  it('sem sessão, qualquer página protegida cai no login', () => {
    renderAt('/governo', { auth: 'anon', guild: { status: 'idle' }, player: null })
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
