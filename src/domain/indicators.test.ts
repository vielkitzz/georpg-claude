import { deltaMood } from './indicators'

describe('deltaMood', () => {
  it('subir é bom quando mais é melhor', () => {
    expect(deltaMood({ delta: 1 })).toBe('good')
    expect(deltaMood({ delta: -1 })).toBe('bad')
  })

  it('inverte quando menos é melhor (inflação, desemprego)', () => {
    expect(deltaMood({ delta: 0.3, lowerIsBetter: true })).toBe('bad')
    expect(deltaMood({ delta: -0.2, lowerIsBetter: true })).toBe('good')
  })

  it('sem variação é estável', () => {
    expect(deltaMood({ delta: 0 })).toBe('flat')
  })
})
