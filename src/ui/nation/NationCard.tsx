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
      className={`@container flex min-w-0 flex-col rounded-md bg-nation-panel p-6 ${className}`}
    >
      <div
        className={`flex items-start justify-between gap-4 ${
          divider ? 'mb-5 border-b border-nation-divider pb-3' : 'mb-5'
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
