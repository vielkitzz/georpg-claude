import type { ReactNode } from 'react'

export function Panel({
  title,
  children,
  className = '',
  action,
}: {
  title: string
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`min-w-0 rounded-lg bg-panel p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="title-semi min-w-0 text-xl wrap-break-word">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function PageTitle({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="mb-6">
      <h1 className="title text-4xl md:text-5xl">{children}</h1>
      {note && <p className="mt-2 max-w-prose text-muted">{note}</p>}
    </div>
  )
}
