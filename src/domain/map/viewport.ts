/** Zoom e pan do mapa. Coordenadas em unidades do mapa (pixels do export). */
export interface Viewport {
  k: number
  x: number
  y: number
}

export interface MapSize {
  width: number
  height: number
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 14
export const INITIAL_VIEWPORT: Viewport = { k: 1, x: 0, y: 0 }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

/** Mantém o mapa cobrindo todo o quadro: sem bordas vazias ao arrastar. */
export function clampViewport(viewport: Viewport, { width, height }: MapSize): Viewport {
  const k = clamp(viewport.k, MIN_ZOOM, MAX_ZOOM)
  return {
    k,
    x: clamp(viewport.x, width - width * k, 0),
    y: clamp(viewport.y, height - height * k, 0),
  }
}

/** Zoom multiplicativo mantendo o ponto (cx, cy) fixo na tela. */
export function zoomAt(
  viewport: Viewport,
  factor: number,
  cx: number,
  cy: number,
  size: MapSize,
): Viewport {
  const k = clamp(viewport.k * factor, MIN_ZOOM, MAX_ZOOM)
  const ratio = k / viewport.k
  return clampViewport(
    { k, x: cx - (cx - viewport.x) * ratio, y: cy - (cy - viewport.y) * ratio },
    size,
  )
}

export function panBy(viewport: Viewport, dx: number, dy: number, size: MapSize): Viewport {
  return clampViewport({ ...viewport, x: viewport.x + dx, y: viewport.y + dy }, size)
}

/**
 * Converte um ponto da tela (relativo ao retângulo do SVG) para unidades do mapa,
 * considerando o encaixe "meet" do viewBox (barras laterais quando a proporção difere).
 * Devolve também a escala (pixels de tela por unidade).
 */
export function screenToMap(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
  { width, height }: MapSize,
) {
  const scale = Math.min(rect.width / width, rect.height / height)
  const offsetX = (rect.width - width * scale) / 2
  const offsetY = (rect.height - height * scale) / 2
  return {
    x: (clientX - rect.left - offsetX) / scale,
    y: (clientY - rect.top - offsetY) / scale,
    scale,
  }
}

/** Ponto do mapa (sem zoom) correspondente a um ponto já na escala do viewport. */
export function toWorld(viewport: Viewport, x: number, y: number) {
  return { x: (x - viewport.x) / viewport.k, y: (y - viewport.y) / viewport.k }
}
