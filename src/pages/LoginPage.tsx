import { Navigate } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { resolveAccess } from '@/domain/access'
import { CenteredScreen, primaryButton } from '@/ui/CenteredScreen'
import { AccessScreen } from './AccessScreen'

export function LoginPage() {
  const { auth, guild, signIn } = useAuth()
  const decision = resolveAccess(auth, guild)

  if (decision === 'allowed') return <Navigate to="/" replace />
  if (decision !== 'login') return <AccessScreen decision={decision} />

  return (
    <CenteredScreen
      title="Entrar no GeoRPG"
      actions={
        <button type="button" onClick={() => void signIn()} className={primaryButton}>
          Entrar com o Discord
        </button>
      }
    >
      <p>
        O acesso é feito só pelo Discord e exige estar no servidor oficial do GeoRPG. Se você ainda
        não estiver, o jogo tenta adicionar você ao entrar.
      </p>
    </CenteredScreen>
  )
}
