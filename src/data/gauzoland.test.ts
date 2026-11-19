import { geography } from './gauzoland'

describe('gauzoland.json', () => {
  const stateIds = new Set(geography.states.map((state) => state.id))

  it('tem o quadro 1662×780 do Azgaar', () => {
    expect(geography.meta.width).toBe(1662)
    expect(geography.meta.height).toBe(780)
  })

  it('tem 50 territórios com caminho desenhável', () => {
    expect(geography.states).toHaveLength(50)
    for (const state of geography.states) expect(state.d.startsWith('M')).toBe(true)
  })

  it('traz só geografia: nada de dono, nome ou cor', () => {
    for (const state of geography.states) {
      expect(state).not.toHaveProperty('owner')
      expect(state).not.toHaveProperty('name')
      expect(state).not.toHaveProperty('color')
    }
  })

  it('toda província pertence a um território existente e consta na lista dele', () => {
    for (const province of geography.provinces) {
      expect(stateIds.has(province.stateId)).toBe(true)
      const state = geography.states.find((s) => s.id === province.stateId)
      expect(state?.provinceIds).toContain(province.id)
    }
  })

  it('vizinhança é simétrica', () => {
    for (const state of geography.states) {
      for (const other of state.neighbors) {
        const neighbor = geography.states.find((s) => s.id === other)
        expect(neighbor?.neighbors).toContain(state.id)
      }
    }
  })

  it('os pontos de rótulo ficam dentro do quadro', () => {
    for (const { pole } of geography.states) {
      expect(pole[0]).toBeGreaterThanOrEqual(0)
      expect(pole[0]).toBeLessThanOrEqual(1662)
      expect(pole[1]).toBeGreaterThanOrEqual(0)
      expect(pole[1]).toBeLessThanOrEqual(780)
    }
  })
})
