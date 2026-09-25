import type { CSSProperties } from 'react'

export interface PaintSwatch {
  id: string
  from: string
  to: string
  border: string
}

export type PaintSwatchFilter = 'all' | 'solid' | 'gradient'

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const light = l / 100
  const chroma = (1 - Math.abs(2 * light - 1)) * sat
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = light - chroma / 2

  let r = 0
  let g = 0
  let b = 0

  if (h < 60) [r, g, b] = [chroma, x, 0]
  else if (h < 120) [r, g, b] = [x, chroma, 0]
  else if (h < 180) [r, g, b] = [0, chroma, x]
  else if (h < 240) [r, g, b] = [0, x, chroma]
  else if (h < 300) [r, g, b] = [x, 0, chroma]
  else [r, g, b] = [chroma, 0, x]

  const channel = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, '0')

  return `#${channel(r)}${channel(g)}${channel(b)}`
}

export interface PaintRing {
  id: string
  radius: number
  swatchSize: number
  swatches: PaintSwatch[]
}

function buildPaintPalette(): PaintSwatch[] {
  const swatches: PaintSwatch[] = []

  for (let i = 0; i < 10; i++) {
    const hex = hslToHex(0, 0, 8 + i * 9)
    swatches.push({ id: `gray-${i}`, from: hex, to: hex, border: hex })
  }

  for (const [ring, lightness, saturation] of [
    [0, 38, 94],
    [1, 52, 82],
    [2, 68, 70],
  ] as const) {
    for (let h = 0; h < 360; h += 15) {
      const hex = hslToHex(h, saturation, lightness)
      swatches.push({
        id: `solid-${ring}-${h}`,
        from: hex,
        to: hex,
        border: hex,
      })
    }
  }

  for (let h = 0; h < 360; h += 15) {
    const from = hslToHex(h, 90, 45)
    const to = hslToHex((h + 15) % 360, 90, 45)
    swatches.push({ id: `grad-${h}`, from, to, border: to })
  }

  for (let h = 0; h < 360; h += 45) {
    const from = hslToHex(h, 88, 48)
    const to = hslToHex((h + 180) % 360, 88, 48)
    swatches.push({ id: `grad-c${h}`, from, to, border: to })
  }

  const classics = [
    ['#000000', '#434343'],
    ['#ff0000', '#ff6d01'],
    ['#ff9a00', '#ffd600'],
    ['#00c853', '#00e676'],
    ['#00b0ff', '#2979ff'],
    ['#6200ea', '#d500f9'],
    ['#ff1744', '#f50057'],
    ['#ffffff', '#bdbdbd'],
  ] as const

  classics.forEach(([from, to], index) => {
    swatches.push({ id: `classic-${index}`, from, to, border: to })
  })

  return swatches
}

const PAINT_SWATCHES = buildPaintPalette()

export function isSolidSwatch(swatch: PaintSwatch): boolean {
  return swatch.from === swatch.to
}

export function filterPaintSwatches(
  swatches: PaintSwatch[],
  filter: PaintSwatchFilter,
): PaintSwatch[] {
  if (filter === 'solid') {
    return swatches.filter(isSolidSwatch)
  }
  if (filter === 'gradient') {
    return swatches.filter((swatch) => !isSolidSwatch(swatch))
  }
  return swatches
}

export function getPaintSwatches(): PaintSwatch[] {
  return PAINT_SWATCHES
}

export function getPaintRings(filter: PaintSwatchFilter = 'all'): PaintRing[] {
  const all = PAINT_SWATCHES

  const rings: PaintRing[] = [
    {
      id: 'gray',
      radius: 26,
      swatchSize: 13,
      swatches: all.filter((swatch) => swatch.id.startsWith('gray-')),
    },
    {
      id: 'vivid',
      radius: 52,
      swatchSize: 15,
      swatches: all.filter((swatch) => swatch.id.startsWith('solid-0-')),
    },
    {
      id: 'medium',
      radius: 74,
      swatchSize: 15,
      swatches: all.filter((swatch) => swatch.id.startsWith('solid-1-')),
    },
    {
      id: 'pastel',
      radius: 96,
      swatchSize: 14,
      swatches: all.filter((swatch) => swatch.id.startsWith('solid-2-')),
    },
    {
      id: 'gradients',
      radius: 118,
      swatchSize: 14,
      swatches: all.filter(
        (swatch) =>
          swatch.id.startsWith('grad-') && !swatch.id.startsWith('grad-c'),
      ),
    },
    {
      id: 'complements',
      radius: 138,
      swatchSize: 13,
      swatches: all.filter((swatch) => swatch.id.startsWith('grad-c')),
    },
    {
      id: 'classics',
      radius: 156,
      swatchSize: 12,
      swatches: all.filter((swatch) => swatch.id.startsWith('classic-')),
    },
  ]

  if (filter === 'all') return rings

  return rings
    .map((ring) => ({
      ...ring,
      swatches: filterPaintSwatches(ring.swatches, filter),
    }))
    .filter((ring) => ring.swatches.length > 0)
}

export function findPaintSwatch(id: string | undefined): PaintSwatch | undefined {
  if (!id) return undefined
  return PAINT_SWATCHES.find((swatch) => swatch.id === id)
}

/** @deprecated Use findPaintSwatch */
export const findGradientPreset = findPaintSwatch

/** @deprecated Use PaintSwatch */
export type ComponentGradientPreset = PaintSwatch

export function swatchStyle(swatch: PaintSwatch): CSSProperties {
  const isSolid = isSolidSwatch(swatch)
  return {
    backgroundImage: isSolid
      ? undefined
      : `linear-gradient(135deg, ${swatch.from}, ${swatch.to})`,
    backgroundColor: isSolid ? swatch.from : undefined,
  }
}
