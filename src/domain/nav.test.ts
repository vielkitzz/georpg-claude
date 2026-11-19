import { NAV_ITEMS } from './nav'

describe('NAV_ITEMS', () => {
  it('tem as dez seções da Sidebar', () => {
    expect(NAV_ITEMS).toHaveLength(10)
  })

  it('não tem numeração nos rótulos', () => {
    for (const item of NAV_ITEMS) expect(item.label).not.toMatch(/^\d/)
  })

  it('só Visão geral, Mapa e Governo existem por enquanto', () => {
    const enabled = NAV_ITEMS.filter((item) => item.path).map((item) => item.path)
    expect(enabled).toEqual(['/', '/mapa', '/governo'])
  })

  it('não oferece "Fundar nação" na Sidebar', () => {
    expect(NAV_ITEMS.some((item) => /fundar|criar/i.test(item.label))).toBe(false)
  })
})
