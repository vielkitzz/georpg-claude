/**
 * Gera src/data/gauzoland.json (somente geografia) a partir do GeoJSON de células
 * exportado do Azgaar's Fantasy Map Generator.
 *
 *   npm run build-map [-- caminho/das/celulas.geojson]
 *
 * Fronteiras reconstruídas pelas arestas compartilhadas; coordenadas lon/lat
 * convertidas linearmente para o quadro de 1662×780 pixels.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  boundaryRings,
  dropCollinear,
  labelPoint,
  makeProjection,
  ringsToPath,
  type Bounds,
  type Point,
  type Ring,
} from '../src/domain/map/geometry'

const MAP_NAME = 'Gauzoland'
const WIDTH = 1662
const HEIGHT = 780

interface Cell {
  id: number
  type: 'ocean' | 'island' | 'lake'
  state: number
  province: number
  neighbors: number[]
  ring: Ring
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'scripts', 'data')
const input =
  process.argv[2] ??
  join(dataDir, readdirSync(dataDir).find((name) => /Cells.*\.geojson$/.test(name)) ?? 'missing')

const collection = JSON.parse(readFileSync(input, 'utf8')) as {
  features: {
    geometry: { coordinates: Point[][] }
    properties: Omit<Cell, 'ring'>
  }[]
}

const bounds: Bounds = { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity }
for (const { geometry } of collection.features) {
  for (const [lon, lat] of geometry.coordinates[0]) {
    bounds.minLon = Math.min(bounds.minLon, lon)
    bounds.maxLon = Math.max(bounds.maxLon, lon)
    bounds.minLat = Math.min(bounds.minLat, lat)
    bounds.maxLat = Math.max(bounds.maxLat, lat)
  }
}
const project = makeProjection(bounds, WIDTH, HEIGHT)

const cells: Cell[] = collection.features.map(({ geometry, properties }) => ({
  ...properties,
  ring: geometry.coordinates[0].map(project),
}))
const byId = new Map(cells.map((cell) => [cell.id, cell]))

const toShape = (members: Cell[]) => {
  const rings = boundaryRings(members.map((cell) => cell.ring)).map(dropCollinear)
  return { rings, d: ringsToPath(rings), ...labelPoint(rings) }
}

const groupBy = (list: Cell[], key: (cell: Cell) => number) => {
  const groups = new Map<number, Cell[]>()
  for (const cell of list) {
    const id = key(cell)
    groups.set(id, [...(groups.get(id) ?? []), cell])
  }
  return groups
}

const land = cells.filter((cell) => cell.type === 'island' && cell.state > 0)
const states = [...groupBy(land, (cell) => cell.state)]
  .sort(([a], [b]) => a - b)
  .map(([id, members]) => {
    const shape = toShape(members)
    const neighbors = new Set<number>()
    for (const cell of members) {
      for (const neighborId of cell.neighbors) {
        const neighbor = byId.get(neighborId)
        if (neighbor && neighbor.type === 'island' && neighbor.state > 0 && neighbor.state !== id) {
          neighbors.add(neighbor.state)
        }
      }
    }
    const provinceIds = [...new Set(members.map((cell) => cell.province).filter((p) => p > 0))]
    return {
      id,
      cells: members.length,
      provinceIds: provinceIds.sort((a, b) => a - b),
      neighbors: [...neighbors].sort((a, b) => a - b),
      pole: shape.point,
      poleRadius: shape.radius,
      d: shape.d,
    }
  })

const provinces = [
  ...groupBy(
    land.filter((cell) => cell.province > 0),
    (cell) => cell.province,
  ),
]
  .sort(([a], [b]) => a - b)
  .map(([id, members]) => {
    const shape = toShape(members)
    return { id, stateId: members[0].state, pole: shape.point, d: shape.d }
  })

// Lagos: células "lake" conectadas entre si formam um único lago.
const lakeCells = cells.filter((cell) => cell.type === 'lake')
const seen = new Set<number>()
const lakes: { id: number; d: string }[] = []
for (const start of lakeCells) {
  if (seen.has(start.id)) continue
  const group: Cell[] = []
  const queue = [start]
  seen.add(start.id)
  while (queue.length) {
    const cell = queue.pop() as Cell
    group.push(cell)
    for (const neighborId of cell.neighbors) {
      const neighbor = byId.get(neighborId)
      if (neighbor?.type === 'lake' && !seen.has(neighbor.id)) {
        seen.add(neighbor.id)
        queue.push(neighbor)
      }
    }
  }
  lakes.push({ id: lakes.length + 1, d: toShape(group).d })
}

// Terra sem estado (ilhas e áreas livres): desenhada como fundo, não é território.
const neutralLand = cells.filter((cell) => cell.type === 'island' && cell.state === 0)
const neutral = neutralLand.length ? toShape(neutralLand).d : ''

const output = {
  meta: {
    name: MAP_NAME,
    width: WIDTH,
    height: HEIGHT,
    source: "Azgaar's Fantasy Map Generator (Cells GeoJSON)",
    note: 'Somente geografia. O export não traz nomes de estados/províncias nem burgos.',
  },
  states,
  provinces,
  lakes,
  neutral,
}

const target = join(root, 'src', 'data', 'gauzoland.json')
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(output))
console.log(
  `gauzoland.json: ${states.length} estados, ${provinces.length} províncias, ${lakes.length} lagos`,
)
console.log(`células de terra sem estado (fundo neutro): ${neutralLand.length}`)
