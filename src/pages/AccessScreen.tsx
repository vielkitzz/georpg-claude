import type { AccessDecision } from '@/domain/access'
import { useAuth } from '@/auth/AuthContext'
import { CenteredScreen, primaryButton, secondaryButton } from '@/ui/CenteredScreen'

type Blocked = Exclude<AccessDecision, 'allowed' | 'login'>

/** Telas de bloqueio da guarda 1: verificando, fora do servidor, não configurado, suspensa e erro. */
export function AccessScreen({ decision }: { decision: Blocked }) {
  const { auth, signIn, signOut, recheck } = useAuth()
  const signedIn = auth === 'signed'
  const leave = signedIn && (
    <button type="button" onClick={() => void signOut()} className={secondaryButton}>
      Sair
    </button>
  )

  switch (decision) {
    case 'checking':
      return (
        <CenteredScreen title="Verificando">
          <p role="status">Conferindo sua entrada no servidor do Discord…</p>
        </CenteredScreen>
      )
    case 'not_in_guild':
      return (
        <CenteredScreen
          title="Entre no servidor"
          actions={
            <>
              <button type="button" onClick={() => void signIn()} className={primaryButton}>
                Entrar de novo
              </button>
              <button type="button" onClick={recheck} className={secondaryButton}>
                Já entrei
              </button>
              {leave}
            </>
          }
        >
          <p>
            Para jogar, você precisa estar no servidor oficial do GeoRPG no Discord. Use “Entrar de
            novo” para que o jogo tente adicionar você, ou entre pelo convite e toque em “Já
            entrei”.
          </p>
        </CenteredScreen>
      )
    case 'not_configured':
      return (
        <CenteredScreen
          title="Acesso indisponível"
          actions={
            <>
              <button type="button" onClick={recheck} className={primaryButton}>
                Tentar de novo
              </button>
              {leave}
            </>
          }
        >
          <p>
            O jogo ainda não está configurado para liberar o acesso. Por segurança, ninguém entra
            até que isso seja resolvido. Avise a administração.
          </p>
        </CenteredScreen>
      )
    case 'banned':
      return (
        <CenteredScreen title="Conta suspensa" actions={leave}>
          <p>
            Esta conta está suspensa e não pode acessar o GeoRPG. Fale com a administração no
            Discord.
          </p>
        </CenteredScreen>
      )
    case 'error':
      return (
        <CenteredScreen
          title="Algo deu errado"
          actions={
            <>
              <button type="button" onClick={recheck} className={primaryButton}>
                Tentar de novo
              </button>
              {leave}
            </>
          }
        >
          <p role="alert">
            Não foi possível verificar sua entrada no servidor. Tente de novo em instantes.
          </p>
        </CenteredScreen>
      )
  }
}
