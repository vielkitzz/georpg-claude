import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  parseGuildStatus,
  playerFromIdentities,
  type AuthStatus,
  type GuildCheck,
  type GuildStatus,
} from '@/domain/access'
import { AuthContext, type AuthValue, type UserRole } from './AuthContext'
import { getSupabase } from './supabase'

const DISCORD_SCOPES = 'identify guilds.join'

export function AuthProvider({
  children,
  client = getSupabase(),
}: {
  children: ReactNode
  client?: SupabaseClient | null
}) {
  // undefined = ainda lendo a sessão; null = sem sessão.
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; status: GuildStatus } | null>(null)
  // O Supabase só entrega o token OAuth do Discord logo após o login: guardamos
  // em memória até a conferência dar certo (necessário para `guilds.join`).
  const providerToken = useRef<string | null>(null)
  const [roleResult, setRoleResult] = useState<{ userId: string; role: UserRole } | null>(null)

  useEffect(() => {
    if (!client) return
    const take = (next: Session | null) => {
      if (next?.provider_token) providerToken.current = next.provider_token
      setSession(next)
    }
    client.auth.getSession().then(({ data }) => take(data.session))
    const { data } = client.auth.onAuthStateChange((_event, next) => take(next))
    return () => data.subscription.unsubscribe()
  }, [client])

  const userId = session?.user.id
  const key = `${userId}:${attempt}`

  useEffect(() => {
    if (!client || !userId) return
    let active = true
    client.functions
      .invoke('discord-guild', { body: { provider_token: providerToken.current } })
      .then(({ data, error }) => {
        const status = error ? 'error' : parseGuildStatus(data)
        if (status === 'ok') providerToken.current = null
        if (active) setResult({ key, status })
      })
    return () => {
      active = false
    }
  }, [client, userId, key])

  // Papel do jogador: o RLS só deixa ler a própria linha. Falha → PLAYER (sem poderes extras).
  useEffect(() => {
    if (!client || !userId) return
    let active = true
    client
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (active) setRoleResult({ userId, role: data?.role === 'ADMIN' ? 'ADMIN' : 'PLAYER' })
        },
        () => {
          if (active) setRoleResult({ userId, role: 'PLAYER' })
        },
      )
    return () => {
      active = false
    }
  }, [client, userId])

  const signIn = useCallback(async () => {
    await client?.auth.signInWithOAuth({
      provider: 'discord',
      options: { scopes: DISCORD_SCOPES, redirectTo: `${window.location.origin}/` },
    })
  }, [client])

  const signOut = useCallback(async () => {
    providerToken.current = null
    await client?.auth.signOut()
  }, [client])

  const recheck = useCallback(() => setAttempt((n) => n + 1), [])

  const value = useMemo<AuthValue>(() => {
    const auth: AuthStatus = !client
      ? 'unconfigured'
      : session === undefined
        ? 'loading'
        : session
          ? 'signed'
          : 'anon'
    const guild: GuildCheck = !userId
      ? { status: 'idle' }
      : result?.key === key
        ? { status: result.status }
        : { status: 'checking' }
    return {
      auth,
      userId,
      guild,
      player: session ? playerFromIdentities(session.user.identities) : null,
      role: userId && roleResult?.userId === userId ? roleResult.role : null,
      signIn,
      signOut,
      recheck,
    }
  }, [client, session, userId, result, roleResult, key, signIn, signOut, recheck])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
