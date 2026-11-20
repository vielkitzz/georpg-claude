import { SYMBOL_IMAGE_BYTES, SYMBOL_IMAGE_SIDE } from '../../../src/domain/founding/draft.ts'

const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10]
const colorFormats: Record<number, { channels: number; depths: number[] }> = {
  0: { channels: 1, depths: [1, 2, 4, 8, 16] },
  2: { channels: 3, depths: [8, 16] },
  3: { channels: 1, depths: [1, 2, 4, 8] },
  4: { channels: 2, depths: [8, 16] },
  6: { channels: 4, depths: [8, 16] },
}
const adam7 = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2],
]

/** Limita a descompressão às linhas esperadas e verifica o filtro de cada uma. */
async function validatePixels(parts: Uint8Array<ArrayBuffer>[], rows: number[]) {
  const reader = new Blob(parts)
    .stream()
    .pipeThrough(new DecompressionStream('deflate'))
    .getReader()
  let row = 0
  let offset = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return row === rows.length && offset === 0
      let cursor = 0
      while (cursor < value.length) {
        if (row === rows.length || (offset === 0 && value[cursor] > 4)) return false
        const consumed = Math.min(rows[row] - offset, value.length - cursor)
        cursor += consumed
        offset += consumed
        if (offset === rows[row]) {
          row++
          offset = 0
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
}

export async function decodeSymbolImage(encoded: string): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    const bytes = Uint8Array.from(atob(encoded), (byte) => byte.charCodeAt(0))
    if (
      bytes.length > SYMBOL_IMAGE_BYTES ||
      bytes.length < 57 ||
      !pngSignature.every((byte, i) => bytes[i] === byte)
    )
      return null
    const view = new DataView(bytes.buffer)
    const width = view.getUint32(16)
    const height = view.getUint32(20)
    if (!width || !height || width > SYMBOL_IMAGE_SIDE || height > SYMBOL_IMAGE_SIDE) return null

    const [depth, color, compression, filter, interlace] = bytes.subarray(24, 29)
    const format = colorFormats[color]
    if (!format?.depths.includes(depth) || compression || filter || interlace > 1) return null

    const imageData: Uint8Array<ArrayBuffer>[] = []
    let palette = false
    for (let start = 8; start + 12 <= bytes.length;) {
      const length = view.getUint32(start)
      const type = String.fromCharCode(...bytes.subarray(start + 4, start + 8))
      const end = start + length + 12
      if (end > bytes.length || !/^[A-Za-z]{4}$/.test(type)) return null
      if ((start === 8) !== (type === 'IHDR') || (type === 'IHDR' && length !== 13)) return null
      let crc = 0xffffffff
      for (const byte of bytes.subarray(start + 4, end - 4)) {
        crc ^= byte
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
      }
      if (~crc >>> 0 !== view.getUint32(end - 4)) return null
      if (type === 'PLTE') {
        if (imageData.length || palette || !length || length % 3 || length > 768) return null
        palette = true
      }
      if (type === 'IDAT') imageData.push(bytes.subarray(start + 8, end - 4))
      if (type === 'IEND') {
        if (!imageData.length || length !== 0 || end !== bytes.length || (color === 3 && !palette))
          return null
        const passes = interlace ? adam7 : [[0, 0, 1, 1]]
        const rows = passes.flatMap(([x, y, dx, dy]) => {
          if (x >= width || y >= height) return []
          const columns = Math.ceil((width - x) / dx)
          const rowBytes = 1 + Math.ceil((columns * format.channels * depth) / 8)
          return Array<number>(Math.ceil((height - y) / dy)).fill(rowBytes)
        })
        return (await validatePixels(imageData, rows)) ? bytes : null
      }
      start = end
    }
  } catch {
    return null
  }
  return null
}

export async function symbolPath(owner: string, bytes: Uint8Array<ArrayBuffer>) {
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  const hex = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  )
  return `${owner}/${hex}.png`
}
