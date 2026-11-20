import type { ReactNode } from 'react'
import { Brand } from './Brand'

/** Tela cheia centralizada (login, bloqueios e páginas "em breve"). */
export function CenteredScreen({
  title,
  children,
  actions,
}: {
  title: string
  children?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-6">
      <div className="flex w-full max-w-md flex-col items-start gap-5">
        <div className="rounded-md bg-[var(--navy)] p-2">
          <Brand />
        </div>
        <h1 className="title text-4xl">{title}</h1>
        <div className="flex flex-col gap-3 text-muted" aria-live="polite">
          {children}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  )
}

const buttonBase =
  'rounded-md px-4 py-2.5 font-semibold transition-transform hover:-translate-y-px active:translate-y-0'

export const primaryButton = `${buttonBase} bg-primary text-on-primary`
export const secondaryButton = `${buttonBase} border border-line text-fg hover:bg-raised`
