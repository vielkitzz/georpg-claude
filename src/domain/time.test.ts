import {
  TICK_UTC_HOUR,
  TIME_SCALE,
  formatCountdown,
  formatSimulationDate,
  nextTickAt,
  simulationDateAt,
} from './time'

describe('escala de tempo', () => {
  it('é de 1 mês de jogo por dia real', () => {
    expect(TIME_SCALE.gameMonthsPerRealDay).toBe(1)
  })

  it('o tick das 8h de Brasília cai às 11:00 UTC', () => {
    expect(TICK_UTC_HOUR).toBe(11)
  })
})

describe('simulationDateAt', () => {
  it('começa em janeiro de 1920', () => {
    expect(simulationDateAt(0)).toEqual({ year: 1920, month: 1 })
  })

  it('avança um mês por tick', () => {
    expect(simulationDateAt(1)).toEqual({ year: 1920, month: 2 })
    expect(simulationDateAt(11)).toEqual({ year: 1920, month: 12 })
  })

  it('vira o ano após 12 ticks', () => {
    expect(simulationDateAt(12)).toEqual({ year: 1921, month: 1 })
    expect(simulationDateAt(30)).toEqual({ year: 1922, month: 7 })
  })
})

describe('formatSimulationDate', () => {
  it('escreve mês por extenso em português', () => {
    expect(formatSimulationDate({ year: 1920, month: 3 })).toBe('Março de 1920')
  })
})

describe('nextTickAt', () => {
  it('antes das 11:00 UTC, o tick é no mesmo dia', () => {
    const next = nextTickAt(new Date('2026-11-18T10:59:59Z'))
    expect(next.toISOString()).toBe('2026-11-18T11:00:00.000Z')
  })

  it('às 11:00 UTC em ponto, o próximo é o do dia seguinte', () => {
    const next = nextTickAt(new Date('2026-11-18T11:00:00Z'))
    expect(next.toISOString()).toBe('2026-11-19T11:00:00.000Z')
  })

  it('depois das 11:00 UTC, o tick é amanhã', () => {
    const next = nextTickAt(new Date('2026-11-18T23:30:00Z'))
    expect(next.toISOString()).toBe('2026-11-19T11:00:00.000Z')
  })

  it('atravessa a virada do mês', () => {
    const next = nextTickAt(new Date('2026-11-30T15:00:00Z'))
    expect(next.toISOString()).toBe('2026-12-01T11:00:00.000Z')
  })

  it('não altera a data recebida', () => {
    const now = new Date('2026-11-18T12:00:00Z')
    nextTickAt(now)
    expect(now.toISOString()).toBe('2026-11-18T12:00:00.000Z')
  })
})

describe('formatCountdown', () => {
  it('formata HH:MM:SS', () => {
    expect(formatCountdown(3_661_000)).toBe('01:01:01')
  })

  it('não mostra valores negativos', () => {
    expect(formatCountdown(-5000)).toBe('00:00:00')
  })
})
