import { Link } from 'react-router'
import { CenteredScreen, primaryButton } from '@/ui/CenteredScreen'

export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <CenteredScreen
      title={title}
      actions={
        <Link to="/" className={primaryButton}>
          Voltar à visão geral
        </Link>
      }
    >
      <p>{text}</p>
    </CenteredScreen>
  )
}
