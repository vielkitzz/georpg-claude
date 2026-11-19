import { useEffect, useState } from 'react'
import { formatCountdown, nextTickAt } from '@/domain/time'

/** Contagem regressiva até o próximo tick (8h em Brasília). */
export function NextTick() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const remaining = nextTickAt(now).getTime() - now.getTime()
  return (
    <div>
      <p className="text-sm text-muted">Próximo tick, às 8h de Brasília</p>
      <p className="title text-5xl" aria-label={`Faltam ${formatCountdown(remaining)}`}>
        {formatCountdown(remaining)}
      </p>
    </div>
  )
}
