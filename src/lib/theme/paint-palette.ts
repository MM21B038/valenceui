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

function pushSolid(
  swatches: PaintSwatch[],
  id: string,
  h: number,
  s: number,
  l: number,
) {
  const hex = hslToHex(((h % 360) + 360) % 360, s, l)
  swatches.push({ id, from: hex, to: hex, border: hex })
}

function pushGrad(
  swatches: PaintSwatch[],
  id: string,
  from: string,
  to: string,
) {
  swatches.push({ id, from, to, border: to })
}

export interface PaintRing {
  id: string
  radius: number
  swatchSize: number
  swatches: PaintSwatch[]
}

function buildPaintPalette(): PaintSwatch[] {
  const swatches: PaintSwatch[] = []

  // Neutrals — black → white
  for (let i = 0; i < 16; i++) {
    const hex = hslToHex(0, 0, Math.round(4 + i * (92 / 15)))
    swatches.push({ id: `gray-${i}`, from: hex, to: hex, border: hex })
  }

  // Warm / cool tinted neutrals
  for (let i = 0; i < 12; i++) {
    const l = 18 + i * 6
    pushSolid(swatches, `warm-gray-${i}`, 28, 12, l)
    pushSolid(swatches, `cool-gray-${i}`, 210, 12, l)
  }

  // Solid hue rings — dense hue steps across several value/chroma bands
  const solidBands: Array<[number, number, number]> = [
    [0, 32, 92], // deep vivid
    [1, 42, 88],
    [2, 52, 80],
    [3, 62, 72],
    [4, 72, 62], // soft pastel
    [5, 82, 48], // pale
  ]

  for (const [ring, lightness, saturation] of solidBands) {
    for (let h = 0; h < 360; h += 10) {
      pushSolid(swatches, `solid-${ring}-${h}`, h, saturation, lightness)
    }
  }

  // Soft desaturated solids
  for (let h = 0; h < 360; h += 15) {
    pushSolid(swatches, `soft-${h}`, h, 42, 58)
    pushSolid(swatches, `muted-${h}`, h, 28, 46)
  }

  // Adjacent hue gradients (smooth spectrum)
  for (let h = 0; h < 360; h += 10) {
    const from = hslToHex(h, 88, 46)
    const to = hslToHex((h + 20) % 360, 88, 48)
    pushGrad(swatches, `grad-adj-${h}`, from, to)
  }

  // Same-hue light → deep
  for (let h = 0; h < 360; h += 12) {
    const from = hslToHex(h, 70, 78)
    const to = hslToHex(h, 88, 38)
    pushGrad(swatches, `grad-depth-${h}`, from, to)
  }

  // Complementary pairs
  for (let h = 0; h < 360; h += 15) {
    const from = hslToHex(h, 86, 48)
    const to = hslToHex((h + 180) % 360, 86, 48)
    pushGrad(swatches, `grad-c${h}`, from, to)
  }

  // Analogous 40° spreads
  for (let h = 0; h < 360; h += 15) {
    const from = hslToHex(h, 82, 50)
    const to = hslToHex((h + 40) % 360, 82, 48)
    pushGrad(swatches, `grad-ana-${h}`, from, to)
  }

  // Triadic accents
  for (let h = 0; h < 360; h += 30) {
    const from = hslToHex(h, 84, 46)
    const to = hslToHex((h + 120) % 360, 84, 50)
    pushGrad(swatches, `grad-tri-${h}`, from, to)
  }

  // Soft pastel blends
  for (let h = 0; h < 360; h += 15) {
    const from = hslToHex(h, 55, 78)
    const to = hslToHex((h + 50) % 360, 50, 72)
    pushGrad(swatches, `grad-pastel-${h}`, from, to)
  }

  // Neon / punchy
  for (let h = 0; h < 360; h += 20) {
    const from = hslToHex(h, 100, 52)
    const to = hslToHex((h + 25) % 360, 100, 58)
    pushGrad(swatches, `grad-neon-${h}`, from, to)
  }

  // Dark metallic-ish
  for (let h = 0; h < 360; h += 30) {
    const from = hslToHex(h, 35, 22)
    const to = hslToHex((h + 25) % 360, 45, 38)
    pushGrad(swatches, `grad-dark-${h}`, from, to)
  }

  const classics = [
    ['#000000', '#434343'],
    ['#1a1a1a', '#6b6b6b'],
    ['#ffffff', '#bdbdbd'],
    ['#f8fafc', '#94a3b8'],
    ['#ff0000', '#ff6d01'],
    ['#ff1744', '#f50057'],
    ['#ff9a00', '#ffd600'],
    ['#00c853', '#00e676'],
    ['#00b0ff', '#2979ff'],
    ['#1565c0', '#42a5f5'],
    ['#6200ea', '#d500f9'],
    ['#7c4dff', '#e040fb'],
    ['#00695c', '#26a69a'],
    ['#bf360c', '#ff7043'],
    ['#4e342e', '#a1887f'],
    ['#263238', '#78909c'],
    ['#880e4f', '#ec407a'],
    ['#1a237e', '#5c6bc0'],
    ['#33691e', '#9ccc65'],
    ['#e65100', '#ffb74d'],
  ] as const

  classics.forEach(([from, to], index) => {
    pushGrad(swatches, `classic-${index}`, from, to)
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

/** Disc geometry for a denser multi-ring palette (~440px wheel). */
export function getPaintRings(filter: PaintSwatchFilter = 'all'): PaintRing[] {
  const all = PAINT_SWATCHES

  const rings: PaintRing[] = [
    {
      id: 'gray',
      radius: 24,
      swatchSize: 11,
      swatches: all.filter((swatch) => swatch.id.startsWith('gray-')),
    },
    {
      id: 'warm-gray',
      radius: 42,
      swatchSize: 11,
      swatches: all.filter((swatch) => swatch.id.startsWith('warm-gray-')),
    },
    {
      id: 'cool-gray',
      radius: 58,
      swatchSize: 11,
      swatches: all.filter((swatch) => swatch.id.startsWith('cool-gray-')),
    },
    {
      id: 'deep',
      radius: 76,
      swatchSize: 12,
      swatches: all.filter((swatch) => swatch.id.startsWith('solid-0-')),
    },
    {
      id: 'vivid',
      radius: 94,
      swatchSize: 12,
      swatches: all.filter((swatch) => swatch.id.startsWith('solid-1-')),
    },
    {
      id: 'medium',
      radius: 112,
      swatchSize: 12,
      swatches: all.filter((swatch) => swatch.id.startsWith('solid-2-')),
    },
    {
      id: 'bright',
      radius: 128,
      swatchSize: 12,
      swatches: all.filter((swatch) => swatch.id.startsWith('solid-3-')),
    },
    {
      id: 'pastel',
      radius: 144,
      swatchSize: 11,
      swatches: all.filter((swatch) => swatch.id.startsWith('solid-4-')),
    },
    {
      id: 'pale',
      radius: 158,
      swatchSize: 11,
      swatches: all.filter((swatch) => swatch.id.startsWith('solid-5-')),
    },
    {
      id: 'soft',
      radius: 170,
      swatchSize: 10,
      swatches: all.filter((swatch) => swatch.id.startsWith('soft-')),
    },
    {
      id: 'muted',
      radius: 180,
      swatchSize: 10,
      swatches: all.filter((swatch) => swatch.id.startsWith('muted-')),
    },
    {
      id: 'gradients',
      radius: 190,
      swatchSize: 11,
      swatches: all.filter((swatch) => swatch.id.startsWith('grad-adj-')),
    },
    {
      id: 'depth',
      radius: 200,
      swatchSize: 10,
      swatches: all.filter((swatch) => swatch.id.startsWith('grad-depth-')),
    },
    {
      id: 'complements',
      radius: 208,
      swatchSize: 10,
      swatches: all.filter((swatch) => /^grad-c\d/.test(swatch.id)),
    },
    {
      id: 'analogous',
      radius: 216,
      swatchSize: 10,
      swatches: all.filter((swatch) => swatch.id.startsWith('grad-ana-')),
    },
    {
      id: 'classics',
      radius: 224,
      swatchSize: 11,
      swatches: all.filter((swatch) => swatch.id.startsWith('classic-')),
    },
  ]

  // Extra rings only when filtering to gradients (keeps “all” readable)
  const extraGradientRings: PaintRing[] = [
    {
      id: 'triadic',
      radius: 168,
      swatchSize: 11,
      swatches: all.filter((swatch) => swatch.id.startsWith('grad-tri-')),
    },
    {
      id: 'pastel-grad',
      radius: 186,
      swatchSize: 11,
      swatches: all.filter((swatch) => swatch.id.startsWith('grad-pastel-')),
    },
    {
      id: 'neon',
      radius: 204,
      swatchSize: 11,
      swatches: all.filter((swatch) => swatch.id.startsWith('grad-neon-')),
    },
    {
      id: 'dark-grad',
      radius: 220,
      swatchSize: 11,
      swatches: all.filter((swatch) => swatch.id.startsWith('grad-dark-')),
    },
  ]

  if (filter === 'all') return rings

  if (filter === 'gradient') {
    return [
      ...rings.filter((ring) =>
        ring.swatches.some((swatch) => !isSolidSwatch(swatch)),
      ),
      ...extraGradientRings,
    ]
      .map((ring) => ({
        ...ring,
        swatches: filterPaintSwatches(ring.swatches, 'gradient'),
      }))
      .filter((ring) => ring.swatches.length > 0)
  }

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
