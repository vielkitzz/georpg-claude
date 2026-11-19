import { createContext, useContext } from 'react'
import type { AuthStatus, GuildCheck, Player } from '@/domain/access'

export type UserRole = 'ADMIN' | 'PLAYER'

export interface AuthValue {
  auth: AuthStatus
  guild: GuildCheck
  player: Player | null
  /** Papel do perfil (lido do banco, só do próprio usuário); null até carregar. */
  role: UserRole | null
  /** Abre o login do Discord (escopos identify guilds.join). */
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  /** Repete a conferência do servidor ("já entrei" / "tentar de novo"). */
  recheck: () => void
}

/** Valor padrão: sem provedor, tudo bloqueado. */
const blocked: AuthValue = {
  auth: 'unconfigured',
  guild: { status: 'idle' },
  player: null,
  role: null,
  signIn: async () => {},
  signOut: async () => {},
  recheck: () => {},
}

export const AuthContext = createContext<AuthValue>(blocked)

export const useAuth = () => useContext(AuthContext)
