import {
  INITIAL_VIEWPORT,
  MAX_ZOOM,
  clampViewport,
  panBy,
  screenToMap,
  toWorld,
  zoomAt,
} from './viewport'

const size = { width: 1000, height: 500 }

describe('clampViewport', () => {
  it('não deixa o zoom sair dos limites', () => {
    expect(clampViewport({ k: 0.2, x: 0, y: 0 }, size).k).toBe(1)
    expect(clampViewport({ k: 99, x: 0, y: 0 }, size).k).toBe(MAX_ZOOM)
  })

  it('não deixa arrastar além das bordas do mapa', () => {
    const v = clampViewport({ k: 2, x: 500, y: -9999 }, size)
    expect(v.x).toBe(0)
    expect(v.y).toBe(-500)
  })
})

describe('zoomAt', () => {
  it('mantém o ponto sob o cursor no mesmo lugar', () => {
    const before = INITIAL_VIEWPORT
    const cx = 600
    const cy = 200
    const world = toWorld(before, cx, cy)
    const after = zoomAt(before, 2, cx, cy, size)
    const again = toWorld(after, cx, cy)
    expect(after.k).toBe(2)
    expect(again.x).toBeCloseTo(world.x)
    expect(again.y).toBeCloseTo(world.y)
  })

  it('ao reduzir de volta a 1 o mapa volta ao enquadramento original', () => {
    const zoomed = zoomAt(INITIAL_VIEWPORT, 4, 300, 100, size)
    expect(zoomAt(zoomed, 0.25, 300, 100, size)).toEqual(INITIAL_VIEWPORT)
  })
})

describe('panBy', () => {
  it('desloca dentro dos limites', () => {
    const zoomed = { k: 2, x: -100, y: -50 }
    expect(panBy(zoomed, 30, 20, size)).toEqual({ k: 2, x: -70, y: -30 })
  })
})

describe('screenToMap', () => {
  it('sem barras laterais, escala por proporção direta', () => {
    const p = screenToMap({ left: 0, top: 0, width: 500, height: 250 }, 250, 125, size)
    expect(p).toEqual({ x: 500, y: 250, scale: 0.5 })
  })

  it('compensa as barras quando a caixa é mais alta que o mapa', () => {
    const p = screenToMap({ left: 0, top: 0, width: 500, height: 500 }, 250, 250, size)
    expect(p.x).toBeCloseTo(500)
    expect(p.y).toBeCloseTo(250)
  })
})
