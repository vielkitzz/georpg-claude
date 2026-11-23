import { useEffect, useState } from 'react'
import { formatCountdown, nextTickAt } from '@/domain/time'

export function NextTick() {
  const [remaining, setRemaining] = useState<string | null>(null)
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setRemaining(formatCountdown(nextTickAt(now).getTime() - now.getTime()))
    }
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <p className="whitespace-nowrap text-xs text-muted">
      Próximo tick em {remaining ?? '--:--:--'}
    </p>
  )
}
