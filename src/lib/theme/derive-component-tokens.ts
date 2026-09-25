import type { BrandColors, ThemeMode } from '@/lib/theme/brand'
import {
  findPaintSwatch,
  type PaintSwatch,
} from '@/lib/theme/paint-palette'
import { normalizeBrandColors, normalizeHex } from '@/lib/theme/derive-tokens'

export type ThemedComponentType = 'llm' | 'toolServer'

function parseHex(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex) ?? '#000000'
  const value = normalized.slice(1)
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

function toHex(r: number, g: number, b: number): string {
  const channel = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a)
  const [br, bg, bb] = parseHex(b)
  return toHex(
    ar + (br - ar) * t,
    ag + (bg - ag) * t,
    ab + (bb - ab) * t,
  )
}

function lighten(hex: string, amount: number): string {
  return mixHex(hex, '#ffffff', amount)
}

function alpha(hex: string, opacity: number): string {
  const a = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${normalizeHex(hex) ?? hex}${a}`
}

function prefixTokens(
  prefix: string,
  tokens: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--${prefix}-${key}`, value]),
  )
}

function applyPaintSwatch(
  tokens: Record<string, string>,
  swatch: PaintSwatch,
  mode: ThemeMode,
): Record<string, string> {
  const accent = swatch.to
  const borderMuted = alpha(accent, mode === 'dark' ? 0.35 : 0.3)

  return {
    ...tokens,
    border: accent,
    'border-muted': borderMuted,
    'icon-from': swatch.from,
    'icon-to': swatch.to,
    label: accent,
    ring: alpha(accent, mode === 'dark' ? 0.28 : 0.25),
  }
}

export function deriveComponentTokens(
  colors: BrandColors,
  mode: ThemeMode,
  component: ThemedComponentType,
  gradientId?: string,
): Record<string, string> {
  const { deep, mid, accent, sand } = normalizeBrandColors(colors)
  const prefix = component === 'llm' ? 'llm' : 'tool-server'
  const connector = mode === 'dark' ? lighten(accent, 0.22) : accent
  const interactive = mode === 'dark' ? accent : mid

  if (mode === 'light') {
    const base = {
      surface: '#ffffff',
      'surface-hover': lighten(sand, 0.04),
      foreground: deep,
      muted: mixHex(sand, accent, 0.45),
      border: connector,
      'border-muted': alpha(connector, 0.3),
      'icon-from': alpha(connector, 0.9),
      'icon-to': interactive,
      'icon-fg': sand,
      label: connector,
      ring: alpha(connector, 0.25),
    }

    let tokens: Record<string, string>

    if (component === 'toolServer') {
      tokens = {
        ...base,
        shell: alpha(connector, 0.25),
        'shell-selected': alpha(connector, 0.7),
        'icon-from': alpha(interactive, 0.9),
        'icon-to': connector,
      }
    } else {
      tokens = base
    }

    const swatch = findPaintSwatch(gradientId)
    if (swatch) {
      tokens = applyPaintSwatch(tokens, swatch, mode)
    }

    return prefixTokens(prefix, tokens)
  }

  const base = {
    surface: mid,
    'surface-hover': deep,
    foreground: sand,
    muted: mixHex(sand, accent, 0.35),
    border: connector,
    'border-muted': alpha(connector, 0.35),
    'icon-from': alpha(connector, 0.9),
    'icon-to': interactive,
    'icon-fg': sand,
    label: connector,
    ring: alpha(connector, 0.28),
  }

  let tokens: Record<string, string>

  if (component === 'toolServer') {
    tokens = {
      ...base,
      shell: alpha(connector, 0.25),
      'shell-selected': alpha(connector, 0.7),
      'icon-from': alpha(interactive, 0.9),
      'icon-to': connector,
    }
  } else {
    tokens = base
  }

  const swatch = findPaintSwatch(gradientId)
  if (swatch) {
    tokens = applyPaintSwatch(tokens, swatch, mode)
  }

  return prefixTokens(prefix, tokens)
}

function toCssBlock(tokens: Record<string, string>): string {
  return Object.entries(tokens)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
}

export function buildComponentThemeCss(
  llmColors: BrandColors,
  toolServerColors: BrandColors,
  llmGradientId?: string,
  toolServerGradientId?: string,
): string {
  const light = {
    ...deriveComponentTokens(llmColors, 'light', 'llm', llmGradientId),
    ...deriveComponentTokens(toolServerColors, 'light', 'toolServer', toolServerGradientId),
  }
  const dark = {
    ...deriveComponentTokens(llmColors, 'dark', 'llm', llmGradientId),
    ...deriveComponentTokens(toolServerColors, 'dark', 'toolServer', toolServerGradientId),
  }

  return `:root {\n${toCssBlock(light)}\n}\n.dark {\n${toCssBlock(dark)}\n}`
}

export const COMPONENT_THEME_CSS_KEY = 'valence-component-theme-css'

export function applyComponentThemeCss(
  llmColors: BrandColors,
  toolServerColors: BrandColors,
  llmGradientId?: string,
  toolServerGradientId?: string,
) {
  const css = buildComponentThemeCss(
    llmColors,
    toolServerColors,
    llmGradientId,
    toolServerGradientId,
  )
  let style = document.getElementById('valence-component-theme')

  if (!style) {
    style = document.createElement('style')
    style.id = 'valence-component-theme'
    document.head.appendChild(style)
  }

  style.textContent = css
  localStorage.setItem(COMPONENT_THEME_CSS_KEY, css)
}
