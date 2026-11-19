/**
 * Tempo da simulação. Toda a escala vive AQUI e em nenhum outro lugar.
 * Funções puras: recebem o "agora" por parâmetro, nunca leem o relógio.
 */

/** Escala de tempo: 1 dia real = 1 mês no jogo (um tick por dia). */
export const TIME_SCALE = {
  gameMonthsPerRealDay: 1,
} as const

/** A simulação começa em janeiro de 1920. */
export const SIMULATION_START = { year: 1920, month: 1 } as const

/** O tick roda às 8h de Brasília (UTC-3), ou seja, 11:00 UTC. */
export const TICK_SCHEDULE = {
  brasiliaHour: 8,
  brasiliaUtcOffsetHours: -3,
} as const

export const TICK_UTC_HOUR = TICK_SCHEDULE.brasiliaHour - TICK_SCHEDULE.brasiliaUtcOffsetHours

const MS_PER_DAY = 24 * 60 * 60 * 1000

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export interface SimulationDate {
  year: number
  /** 1 a 12 */
  month: number
}

/** Data da simulação após `tickIndex` ticks (0 = janeiro de 1920). */
export function simulationDateAt(tickIndex: number): SimulationDate {
  const monthsElapsed = Math.floor(tickIndex * TIME_SCALE.gameMonthsPerRealDay)
  const index = SIMULATION_START.month - 1 + monthsElapsed
  return {
    year: SIMULATION_START.year + Math.floor(index / 12),
    month: (index % 12) + 1,
  }
}

export function formatSimulationDate({ year, month }: SimulationDate): string {
  return `${MONTH_NAMES[month - 1]} de ${year}`
}

/** Próximo tick estritamente depois de `now` (sempre às 11:00 UTC). */
export function nextTickAt(now: Date): Date {
  const next = new Date(now)
  next.setUTCHours(TICK_UTC_HOUR, 0, 0, 0)
  if (next.getTime() <= now.getTime()) next.setTime(next.getTime() + MS_PER_DAY)
  return next
}

/** Contagem regressiva "HH:MM:SS" (horas podem passar de 24 só em dados anormais). */
export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':')
}
