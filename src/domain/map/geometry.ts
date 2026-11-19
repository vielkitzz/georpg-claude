/**
 * Geometria pura do mapa: projeção lon/lat → pixels, reconstrução de fronteiras
 * pelas arestas compartilhadas, caminhos SVG e ponto de rótulo.
 */
export type Point = [number, number]
export type Ring = Point[]

export interface Bounds {
  minLon: number
  maxLon: number
  minLat: number
  maxLat: number
}

/** Projeção linear (como a do Azgaar): lon → x, lat → y invertido. */
export function makeProjection(bounds: Bounds, width: number, height: number) {
  const spanLon = bounds.maxLon - bounds.minLon
  const spanLat = bounds.maxLat - bounds.minLat
  return ([lon, lat]: Point): Point => [
    round1(((lon - bounds.minLon) / spanLon) * width),
    round1(((bounds.maxLat - lat) / spanLat) * height),
  ]
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** Área com sinal (positiva em sentido anti-horário, com y para cima). */
export function signedArea(ring: Ring): number {
  let sum = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    sum += x1 * y2 - x2 * y1
  }
  return sum / 2
}

const pointKey = ([x, y]: Point) => `${x},${y}`
const edgeKey = (a: Point, b: Point) => {
  const ka = pointKey(a)
  const kb = pointKey(b)
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
}

/**
 * Recebe polígonos fechados (primeiro ponto = último) e devolve os anéis do
 * contorno da união deles: arestas usadas por um único polígono.
 */
export function boundaryRings(polygons: Ring[]): Ring[] {
  const normalized = polygons.map((ring) => (signedArea(ring) < 0 ? [...ring].reverse() : ring))

  const usage = new Map<string, number>()
  for (const ring of normalized) {
    for (let i = 0; i < ring.length - 1; i++) {
      const key = edgeKey(ring[i], ring[i + 1])
      usage.set(key, (usage.get(key) ?? 0) + 1)
    }
  }

  const outgoing = new Map<string, { from: Point; to: Point; used: boolean }[]>()
  for (const ring of normalized) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [from, to] = [ring[i], ring[i + 1]]
      if (usage.get(edgeKey(from, to)) !== 1) continue
      const edge = { from, to, used: false }
      const list = outgoing.get(pointKey(from))
      if (list) list.push(edge)
      else outgoing.set(pointKey(from), [edge])
    }
  }

  const rings: Ring[] = []
  for (const edges of outgoing.values()) {
    for (const start of edges) {
      if (start.used) continue
      const ring: Ring = [start.from]
      let current = start
      for (;;) {
        current.used = true
        ring.push(current.to)
        if (pointKey(current.to) === pointKey(start.from)) break
        const next = outgoing.get(pointKey(current.to))?.find((edge) => !edge.used)
        if (!next) break
        current = next
      }
      if (ring.length > 3) rings.push(ring)
    }
  }
  return rings
}

/** Remove pontos intermediários exatamente colineares (não altera a forma). */
export function dropCollinear(ring: Ring): Ring {
  const open = ring.slice(0, -1)
  const kept = open.filter((point, i) => {
    const prev = open[(i - 1 + open.length) % open.length]
    const next = open[(i + 1) % open.length]
    const cross =
      (point[0] - prev[0]) * (next[1] - point[1]) - (point[1] - prev[1]) * (next[0] - point[0])
    return Math.abs(cross) > 1e-9
  })
  return kept.length >= 3 ? [...kept, kept[0]] : ring
}

/** Caminho SVG (M/L/Z) com todos os anéis; use fill-rule evenodd. */
export function ringsToPath(rings: Ring[]): string {
  return rings
    .map((ring) => {
      const open = ring.slice(0, -1)
      return `M${open.map(([x, y]) => `${x} ${y}`).join('L')}Z`
    })
    .join('')
}

function pointInRing(point: Point, ring: Ring): boolean {
  const [px, py] = point
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function distanceToSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax
  const dy = by - ay
  const lengthSq = dx * dx + dy * dy
  const t =
    lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** Distância ao contorno, positiva dentro do anel externo e fora dos buracos. */
function signedDistance(point: Point, rings: Ring[]): number {
  let inside = false
  let min = Infinity
  for (const ring of rings) {
    if (pointInRing(point, ring)) inside = !inside
    for (let i = 0; i < ring.length - 1; i++) {
      min = Math.min(min, distanceToSegment(point, ring[i], ring[i + 1]))
    }
  }
  return inside ? min : -min
}

/**
 * Ponto de rótulo: ponto interno mais distante da borda, por busca em grade
 * refinada. Considera os anéis do território (buracos incluídos).
 */
export function labelPoint(rings: Ring[]): { point: Point; radius: number } {
  const outer = rings.reduce((a, b) => (Math.abs(signedArea(b)) > Math.abs(signedArea(a)) ? b : a))
  const xs = outer.map((p) => p[0])
  const ys = outer.map((p) => p[1])
  const [minX, maxX, minY, maxY] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ]
  let step = Math.max(maxX - minX, maxY - minY) / 24 || 1
  let best: Point = [(minX + maxX) / 2, (minY + maxY) / 2]
  let bestDistance = signedDistance(best, rings)
  for (let x = minX; x <= maxX; x += step) {
    for (let y = minY; y <= maxY; y += step) {
      const distance = signedDistance([x, y], rings)
      if (distance > bestDistance) [best, bestDistance] = [[x, y], distance]
    }
  }
  for (let i = 0; i < 12; i++) {
    step /= 2
    const center = best
    for (const dx of [-step, 0, step]) {
      for (const dy of [-step, 0, step]) {
        const candidate: Point = [center[0] + dx, center[1] + dy]
        const distance = signedDistance(candidate, rings)
        if (distance > bestDistance) [best, bestDistance] = [candidate, distance]
      }
    }
  }
  return { point: [round1(best[0]), round1(best[1])], radius: round1(Math.max(bestDistance, 0)) }
}
