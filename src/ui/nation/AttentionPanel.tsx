import { Clock, TriangleAlert, Info } from 'lucide-react'
import type { NationAlert } from '@/domain/types'
import { NationCard } from './NationCard'

/** "Exige atenção": alertas da nação, ou o aviso de que eles só começam com o tick diário. */
export function AttentionPanel({
  alerts,
  tickIndex,
}: {
  alerts: NationAlert[]
  /** Quantos ticks já rodaram; zero significa que o primeiro ainda não aconteceu. */
  tickIndex: number | null
}) {
  return (
    <NationCard title="Exige atenção" divider className="h-full">
      {alerts.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {alerts.map((alert) => {
            const Icon = alert.level === 'warning' ? TriangleAlert : Info
            return (
              <li
                key={alert.id}
                className="flex items-start gap-3 rounded-[4px] bg-nation-raised px-4 py-3 text-sm text-nation-text"
              >
                <Icon
                  size={18}
                  aria-hidden
                  className={`mt-0.5 shrink-0 ${alert.level === 'warning' ? 'text-warning' : 'text-nation-muted'}`}
                />
                {alert.text}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-nation-icon text-nation-muted">
            <Clock size={24} aria-hidden />
          </span>
          <p className="mt-2 text-[15px] font-medium text-nation-text">
            {tickIndex === 0 ? 'Aguardando o primeiro tick' : 'Nada exige atenção agora'}
          </p>
          <p className="max-w-[240px] text-[13px] leading-5 text-nation-muted">
            {tickIndex === 0
              ? 'Os alertas do seu país aparecerão aqui quando o tick diário estiver ativo.'
              : 'Os alertas do seu país aparecem aqui assim que surgir algo que peça uma decisão.'}
          </p>
        </div>
      )}
    </NationCard>
  )
}
