import type { ReactNode } from 'react'

/** Seção da visão geral: fundo escuro, título em Imbue e, se pedido, linha divisória sob o título. */
export function NationCard({
  title,
  subtitle,
  action,
  divider = false,
  className = '',
  children,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  divider?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={`@container flex min-w-0 flex-col gap-5 rounded-md bg-nation-panel p-6 ${className}`}
    >
      <div
        className={`relative flex items-start justify-between gap-4 ${
          divider
            ? 'after:absolute after:inset-x-0 after:-bottom-2.5 after:border-b after:border-nation-divider'
            : ''
        }`}
      >
        <div className="min-w-0">
          <h2 className="font-title text-[28px] leading-8 font-bold text-nation-text">{title}</h2>
          {subtitle && <p className="mt-1 text-[13px] text-nation-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
