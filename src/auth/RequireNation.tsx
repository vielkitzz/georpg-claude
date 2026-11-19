import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthContext'
import { getSupabase } from './supabase'
import { CenteredScreen, primaryButton } from '@/ui/CenteredScreen'

type NationStatus = 'checking' | 'exists' | 'missing' | 'error'

/** Guard 2: do not enter the game before founding; fail closed on lookup errors. */
export function RequireNation({ mode }: { mode: 'game' | 'founding' }) {
  const { auth, guild } = useAuth()
  const [result, setResult] = useState<{ userId: string; status: NationStatus } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (auth !== 'signed' || guild.status !== 'ok') return
    const client = getSupabase()
    if (!client) return
    let active = true
    client.auth.getUser().then(({ data, error }) => {
      if (active) setUserId(error ? null : data.user?.id ?? null)
    }).catch(() => { if (active) setUserId(null) })
    return () => { active = false }
  }, [auth, guild.status, attempt])

  useEffect(() => {
    if (!userId) return
    const client = getSupabase()
    if (!client) return
    let active = true
    void (async () => {
      try {
        const { data, error } = await client.from('nations').select('id').eq('owner_id', userId).limit(1)
        if (active) setResult({ userId, status: error ? 'error' : data?.length ? 'exists' : 'missing' })
      } catch {
        if (active) setResult({ userId, status: 'error' })
      }
    })()
    return () => { active = false }
  }, [userId, attempt])

  const status: NationStatus = !userId ? 'checking' : result?.userId === userId ? result.status : 'checking'
  if (status === 'checking') return <CenteredScreen title="Verificando nação"><p role="status">Consultando sua nação…</p></CenteredScreen>
  if (status === 'error') return <CenteredScreen title="Não foi possível verificar sua nação" actions={
    <button type="button" className={primaryButton} onClick={() => { setResult(null); setAttempt(n => n + 1) }}>Tentar novamente</button>
  }><p role="alert">O acesso permanece bloqueado até a verificação funcionar.</p></CenteredScreen>
  if (mode === 'game' && status === 'missing') return <Navigate to="/criar-pais" replace />
  if (mode === 'founding' && status === 'exists') return <Navigate to="/" replace />
  return <Outlet />
}
