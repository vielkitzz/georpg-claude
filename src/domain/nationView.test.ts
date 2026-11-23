import {
  areaRank,
  fitViewBox,
  formatCurrency,
  formatFounded,
  formatMagnitude,
  formatSpaced,
  ideologyView,
  pathBounds,
  splitOfficialName,
} from './nationView'
import { buildIndicators } from './nationIndicators'
import { cardMood } from './indicators'

describe('nome e fundação', () => {
  it('destaca só o nome do país', () => {
    expect(splitOfficialName('Reino da Lieltuânia', 'Lieltuânia')).toEqual({
      prefix: 'Reino da ',
      core: 'Lieltuânia',
    })
    expect(splitOfficialName('Algo', 'Outro')).toEqual({ prefix: '', core: 'Algo' })
  })

  it('descarta as partes da data que não se conhecem', () => {
    expect(formatFounded(1920, 3, 12)).toBe('Fundada em 12 de março de 1920')
    expect(formatFounded(1920, 3)).toBe('Fundada em março de 1920')
    expect(formatFounded(1920)).toBe('Fundada em 1920')
  })
})

describe('formatação', () => {
  it('abrevia grandezas', () => {
    expect(formatMagnitude(1_240_000_000_000)).toBe('1,24 tri')
    expect(formatMagnitude(310_000_000)).toBe('310 mi')
    expect(formatMagnitude(0)).toBe('0')
  })

  it('separa milhares com espaço fixo', () => {
    expect(formatSpaced(4_850_000)).toBe('4\u00A0850\u00A0000')
  })

  it('monta a moeda com e sem símbolo', () => {
    expect(formatCurrency({ code: 'LCR', name: 'Coroa', symbol: '£' })).toBe('Coroa (£)(LCR)')
    expect(formatCurrency({ code: 'TST', name: 'Teste' })).toBe('Teste(TST)')
  })
})

describe('ideologia', () => {
  it('sem ideologia nem pontuações não há retrato', () => {
    expect(ideologyView(undefined, undefined)).toBeNull()
  })

  it('usa o perfil da ideologia quando faltam as pontuações, com barras em ordem', () => {
    const view = ideologyView('liberal_classico', undefined)
    expect(view?.name).toBe('Liberalismo clássico')
    const values = view?.bars.map((bar) => bar.value) ?? []
    expect(values).toEqual([...values].sort((a, b) => b - a))
    expect(view?.bars.map((bar) => bar.label).sort()).toEqual(
      ['Descentralização', 'Liberdades civis', 'Mercado', 'Tradição'].sort(),
    )
  })
})

describe('território', () => {
  it('posiciona pelo número de células', () => {
    const list = [
      { id: 1, cells: 10 },
      { id: 2, cells: 30 },
      { id: 3, cells: 20 },
    ]
    expect(areaRank(2, list)).toBe(1)
    expect(areaRank(1, list)).toBe(3)
    expect(areaRank(9, list)).toBeNull()
  })

  it('enquadra o território na proporção da moldura', () => {
    const bounds = pathBounds('M10 10L110 10L110 60L10 60Z')
    expect(bounds).toEqual({ minX: 10, minY: 10, maxX: 110, maxY: 60 })
    const box = fitViewBox(bounds, 2)
    expect(box.width / box.height).toBeCloseTo(2)
    expect(box.x).toBeLessThan(10)
    expect(box.x + box.width).toBeGreaterThan(110)
  })
})

describe('indicadores', () => {
  const indicators = buildIndicators({
    currencyPrefix: 'TST',
    legitimacy: 62,
    approval: 58,
    stability: 60,
    gdp: 310_000_000,
    inflation: 3.1,
    unemployment: 7.4,
    hdi: 0.612,
  })

  it('traz os sete, na ordem da tela', () => {
    expect(indicators.map((i) => i.key)).toEqual([
      'legitimacy',
      'approval',
      'stability',
      'gdp',
      'inflation',
      'unemployment',
      'hdi',
    ])
    expect(indicators[3].value).toBe('TST 310 mi')
    expect(indicators[6].value).toBe('0,612')
  })

  it('sem variação, o cartão fica verde', () => {
    expect(cardMood({ delta: 0 })).toBe('good')
    expect(cardMood({ delta: 0, lowerIsBetter: true })).toBe('good')
    expect(cardMood({ delta: 0.3, lowerIsBetter: true })).toBe('bad')
    expect(cardMood({ delta: -1 })).toBe('bad')
  })
})
