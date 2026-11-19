import { between, createRng, hashSeed, pick } from './rng'

describe('rng', () => {
  it('a mesma semente repete a mesma sequência', () => {
    const a = createRng('gauzoland')
    const b = createRng('gauzoland')
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('sementes diferentes dão sequências diferentes', () => {
    expect(createRng('a')()).not.toBe(createRng('b')())
  })

  it('fica em [0, 1)', () => {
    const rng = createRng(42)
    for (let i = 0; i < 1000; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('between respeita os limites inclusivos', () => {
    const rng = createRng('x')
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(between(rng, 3, 6))
    expect([...seen].sort()).toEqual([3, 4, 5, 6])
  })

  it('pick sempre devolve um item da lista', () => {
    const rng = createRng('p')
    for (let i = 0; i < 50; i++) expect(['a', 'b', 'c']).toContain(pick(rng, ['a', 'b', 'c']))
  })

  it('hashSeed é estável', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'))
  })
})
