import { formatDelta, formatInteger, formatPercent } from './format'

describe('format', () => {
  it('separa milhares no padrão brasileiro', () => {
    expect(formatInteger(1_000_000)).toBe('1.000.000')
  })

  it('formata porcentagem', () => {
    expect(formatPercent(58)).toBe('58%')
  })

  it('formata variações com sinal', () => {
    expect(formatDelta(3.2)).toBe('+3,2')
    expect(formatDelta(-1)).toBe('\u22121,0')
    expect(formatDelta(0)).toBe('0,0')
  })
})
