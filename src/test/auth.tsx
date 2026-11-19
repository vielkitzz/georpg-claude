import type { ReactNode } from 'react'
import { vi } from 'vitest'
import { AuthContext, type AuthValue } from '@/auth/AuthContext'

/** Provedor de autenticação falso para os testes de tela. */
export function FakeAuth({
  value = {},
  children,
}: {
  value?: Partial<AuthValue>
  children: ReactNode
}) {
  const base: AuthValue = {
    auth: 'signed',
    guild: { status: 'ok' },
    player: { name: 'Fulano', avatarUrl: null },
    role: 'PLAYER',
    signIn: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    recheck: vi.fn(),
  }
  return <AuthContext.Provider value={{ ...base, ...value }}>{children}</AuthContext.Provider>
}
