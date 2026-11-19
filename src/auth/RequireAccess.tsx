import { Navigate, Outlet } from 'react-router'
import { resolveAccess } from '@/domain/access'
import { AccessScreen } from '@/pages/AccessScreen'
import { useAuth } from './AuthContext'

/** Guarda 1: login no Discord + presença no servidor oficial. */
export function RequireAccess() {
  const { auth, guild } = useAuth()
  const decision = resolveAccess(auth, guild)
  if (decision === 'allowed') return <Outlet />
  if (decision === 'login') return <Navigate to="/login" replace />
  return <AccessScreen decision={decision} />
}
