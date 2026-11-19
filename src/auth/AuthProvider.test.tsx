import type { SupabaseClient } from '@supabase/supabase-js'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './AuthContext'

function makeClient(options: {
  session: unknown
  invoke?: ReturnType<typeof vi.fn>
  role?: string
}) {
  const invoke = options.invoke ?? vi.fn(async () => ({ data: { status: 'ok' }, error: null }))
  const signInWithOAuth = vi.fn(async () => ({}))
  const signOut = vi.fn(async () => ({}))
  const client = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: options.session } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithOAuth,
      signOut,
    },
    functions: { invoke },
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: { role: options.role ?? 'PLAYER' } }) }),
      }),
    })),
  } as unknown as SupabaseClient
  return { client, invoke, signInWithOAuth, signOut }
}

const session = (extra: Record<string, unknown> = {}) => ({
  provider_token: 'token-do-discord',
  user: {
    id: 'u1',
    identities: [
      { provider: 'discord', identity_data: { custom_claims: { global_name: 'Fulano' } } },
    ],
  },
  ...extra,
})

function Probe() {
  const { auth, guild, player, role, signIn, signOut, recheck } = useAuth()
  return (
    <div>
      <p data-testid="estado">{`${auth}/${guild.status}/${player?.name ?? '-'}`}</p>
      <p data-testid="papel">{role ?? 'sem-papel'}</p>
      <button onClick={() => void signIn()}>entrar</button>
      <button onClick={() => void signOut()}>sair</button>
      <button onClick={recheck}>rechecar</button>
    </div>
  )
}

const renderWith = (client: SupabaseClient | null) =>
  render(
    <StrictMode>
      <AuthProvider client={client}>
        <Probe />
      </AuthProvider>
    </StrictMode>,
  )

describe('AuthProvider', () => {
  it('sem cliente Supabase fica "unconfigured" (bloqueado)', () => {
    renderWith(null)
    expect(screen.getByTestId('estado')).toHaveTextContent('unconfigured')
  })

  it('sem sessão fica "anon" e não chama a função', async () => {
    const { client, invoke } = makeClient({ session: null })
    renderWith(client)
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('anon/idle'))
    expect(invoke).not.toHaveBeenCalled()
  })

  it('com sessão, confere o servidor enviando o token do Discord', async () => {
    const { client, invoke } = makeClient({ session: session() })
    renderWith(client)
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('signed/ok/Fulano'))
    expect(invoke).toHaveBeenCalledWith('discord-guild', {
      body: { provider_token: 'token-do-discord' },
    })
  })

  it('o StrictMode (efeito duplo) não perde o token antes do "ok"', async () => {
    const { client, invoke } = makeClient({ session: session() })
    renderWith(client)
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('/ok/'))
    for (const call of invoke.mock.calls) {
      expect(call[1]).toEqual({ body: { provider_token: 'token-do-discord' } })
    }
  })

  it('erro da função vira "error", nunca "ok"', async () => {
    const invoke = vi.fn(async () => ({ data: null, error: new Error('falhou') }))
    const { client } = makeClient({ session: session(), invoke })
    renderWith(client)
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('signed/error'))
  })

  it('resposta desconhecida da função vira "error"', async () => {
    const invoke = vi.fn(async () => ({ data: { status: 'liberado' }, error: null }))
    const { client } = makeClient({ session: session(), invoke })
    renderWith(client)
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('signed/error'))
  })

  it('"rechecar" repete a conferência e depois do ok não reenvia o token', async () => {
    const { client, invoke } = makeClient({ session: session() })
    renderWith(client)
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('/ok/'))
    await userEvent.click(screen.getByText('rechecar'))
    await waitFor(() =>
      expect(invoke.mock.calls.at(-1)?.[1]).toEqual({ body: { provider_token: null } }),
    )
  })

  it('entrar pede os escopos identify e guilds.join', async () => {
    const { client, signInWithOAuth } = makeClient({ session: null })
    renderWith(client)
    await userEvent.click(screen.getByText('entrar'))
    expect(signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'discord',
        options: expect.objectContaining({ scopes: 'identify guilds.join' }),
      }),
    )
  })

  it('lê o papel ADMIN do próprio perfil; sem sessão não há papel', async () => {
    const admin = makeClient({ session: session(), role: 'ADMIN' })
    const { unmount } = renderWith(admin.client)
    await waitFor(() => expect(screen.getByTestId('papel')).toHaveTextContent('ADMIN'))
    unmount()
    const guest = makeClient({ session: null })
    renderWith(guest.client)
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('anon'))
    expect(screen.getByTestId('papel')).toHaveTextContent('sem-papel')
  })

  it('sair encerra a sessão', async () => {
    const { client, signOut } = makeClient({ session: session() })
    renderWith(client)
    await userEvent.click(screen.getByText('sair'))
    expect(signOut).toHaveBeenCalledOnce()
  })
})
