import {
  boundaryRings,
  dropCollinear,
  labelPoint,
  makeProjection,
  ringsToPath,
  signedArea,
} from './geometry'
import type { Ring } from './geometry'

const square = (x: number, y: number): Ring => [
  [x, y],
  [x + 1, y],
  [x + 1, y + 1],
  [x, y + 1],
  [x, y],
]

describe('makeProjection', () => {
  const project = makeProjection({ minLon: -10, maxLon: 10, minLat: -5, maxLat: 5 }, 200, 100)

  it('leva os cantos do quadro aos cantos em pixels', () => {
    expect(project([-10, 5])).toEqual([0, 0])
    expect(project([10, -5])).toEqual([200, 100])
  })

  it('inverte a latitude (norte em cima)', () => {
    expect(project([0, 5])[1]).toBeLessThan(project([0, -5])[1])
  })
})

describe('boundaryRings', () => {
  it('une dois quadrados vizinhos em um único contorno sem a aresta comum', () => {
    const rings = boundaryRings([square(0, 0), square(1, 0)])
    expect(rings).toHaveLength(1)
    expect(Math.abs(signedArea(rings[0]))).toBe(2)
    expect(dropCollinear(rings[0])).toHaveLength(5)
  })

  it('mantém dois quadrados separados como dois contornos', () => {
    expect(boundaryRings([square(0, 0), square(5, 5)])).toHaveLength(2)
  })

  it('gera um buraco quando as células cercam um vazio', () => {
    const ring: Ring[] = []
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) if (!(x === 1 && y === 1)) ring.push(square(x, y))
    }
    const rings = boundaryRings(ring)
    expect(rings).toHaveLength(2)
    const areas = rings.map((r) => Math.abs(signedArea(r))).sort((a, b) => a - b)
    expect(areas).toEqual([1, 9])
  })

  it('aceita polígonos com orientações diferentes', () => {
    const reversed = [...square(1, 0)].reverse()
    expect(boundaryRings([square(0, 0), reversed])).toHaveLength(1)
  })
})

describe('ringsToPath', () => {
  it('escreve M…L…Z por anel', () => {
    expect(ringsToPath([square(0, 0)])).toBe('M0 0L1 0L1 1L0 1Z')
  })
})

describe('labelPoint', () => {
  it('fica no centro de um quadrado', () => {
    const big: Ring = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ]
    const { point, radius } = labelPoint([big])
    expect(point[0]).toBeCloseTo(5, 0)
    expect(point[1]).toBeCloseTo(5, 0)
    expect(radius).toBeCloseTo(5, 0)
  })

  it('evita o buraco central', () => {
    const outer: Ring = [
      [0, 0],
      [30, 0],
      [30, 10],
      [0, 10],
      [0, 0],
    ]
    const hole: Ring = [
      [13, 3],
      [17, 3],
      [17, 7],
      [13, 7],
      [13, 3],
    ]
    const { point } = labelPoint([outer, hole])
    expect(point[0] < 13 || point[0] > 17).toBe(true)
  })
})
