import type { BrandColors, ThemeMode } from '@/lib/theme/brand'

export function normalizeHex(hex: string): string | null {
  const cleaned = hex.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toLowerCase()}`
  }
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return `#${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`.toLowerCase()
  }
  return null
}

export function isValidBrandColors(colors: BrandColors): boolean {
  return (
    normalizeHex(colors.deep) !== null &&
    normalizeHex(colors.mid) !== null &&
    normalizeHex(colors.accent) !== null &&
    normalizeHex(colors.sand) !== null
  )
}

export function normalizeBrandColors(colors: BrandColors): BrandColors {
  return {
    deep: normalizeHex(colors.deep) ?? colors.deep,
    mid: normalizeHex(colors.mid) ?? colors.mid,
    accent: normalizeHex(colors.accent) ?? colors.accent,
    sand: normalizeHex(colors.sand) ?? colors.sand,
  }
}

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

function darken(hex: string, amount: number): string {
  return mixHex(hex, '#000000', amount)
}

function alpha(hex: string, opacity: number): string {
  const a = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${normalizeHex(hex) ?? hex}${a}`
}

export function deriveThemeTokens(
  colors: BrandColors,
  mode: ThemeMode,
): Record<string, string> {
  const { deep, mid, accent, sand } = normalizeBrandColors(colors)

  if (mode === 'light') {
    const workspace = lighten(sand, 0.12)

    return {
      '--brand-1': deep,
      '--brand-2': mid,
      '--brand-3': accent,
      '--brand-4': sand,
      '--chrome': deep,
      '--chrome-fg': sand,
      '--chrome-muted': alpha(sand, 0.6),
      '--panel': deep,
      '--panel-fg': sand,
      '--panel-muted': mixHex(sand, accent, 0.45),
      '--panel-border': alpha(accent, 0.4),
      '--panel-inspector': mid,
      '--panel-inspector-fg': sand,
      '--workspace': workspace,
      '--workspace-dot': alpha(accent, 0.22),
      '--node': '#ffffff',
      '--node-fg': deep,
      '--node-header': lighten(sand, 0.04),
      '--node-icon': accent,
      '--node-icon-fg': sand,
      '--connector': accent,
      '--interactive': mid,
      '--interactive-fg': sand,
      '--background': workspace,
      '--foreground': deep,
      '--card': '#ffffff',
      '--card-foreground': deep,
      '--popover': '#ffffff',
      '--popover-foreground': deep,
      '--primary': mid,
      '--primary-foreground': sand,
      '--secondary': sand,
      '--secondary-foreground': deep,
      '--muted': lighten(sand, 0.08),
      '--muted-foreground': accent,
      '--accent': accent,
      '--accent-foreground': sand,
      '--destructive': '#c44536',
      '--border': alpha(accent, 0.25),
      '--input': alpha(accent, 0.19),
      '--ring': accent,
    }
  }

  const chrome = darken(deep, 0.35)
  const workspace = mixHex(deep, mid, 0.45)

  return {
    '--brand-1': deep,
    '--brand-2': mid,
    '--brand-3': accent,
    '--brand-4': sand,
    '--chrome': chrome,
    '--chrome-fg': sand,
    '--chrome-muted': alpha(sand, 0.47),
    '--panel': deep,
    '--panel-fg': sand,
    '--panel-muted': mixHex(sand, accent, 0.35),
    '--panel-border': alpha(accent, 0.33),
    '--panel-inspector': mid,
    '--panel-inspector-fg': sand,
    '--workspace': workspace,
    '--workspace-dot': alpha(accent, 0.31),
    '--node': mid,
    '--node-fg': sand,
    '--node-header': deep,
    '--node-icon': accent,
    '--node-icon-fg': sand,
    '--connector': lighten(accent, 0.22),
    '--interactive': accent,
    '--interactive-fg': sand,
    '--background': workspace,
    '--foreground': sand,
    '--card': mid,
    '--card-foreground': sand,
    '--popover': mid,
    '--popover-foreground': sand,
    '--primary': accent,
    '--primary-foreground': sand,
    '--secondary': deep,
    '--secondary-foreground': sand,
    '--muted': deep,
    '--muted-foreground': mixHex(sand, accent, 0.35),
    '--accent': accent,
    '--accent-foreground': sand,
    '--destructive': '#e07066',
    '--border': alpha(accent, 0.33),
    '--input': alpha(accent, 0.27),
    '--ring': sand,
  }
}

function toCssBlock(tokens: Record<string, string>): string {
  return Object.entries(tokens)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
}

export function buildCustomThemeCss(colors: BrandColors): string {
  const light = deriveThemeTokens(colors, 'light')
  const dark = deriveThemeTokens(colors, 'dark')

  return `[data-palette="custom"] {\n${toCssBlock(light)}\n}\n[data-palette="custom"].dark {\n${toCssBlock(dark)}\n}`
}

export const CUSTOM_THEME_CSS_KEY = 'valence-custom-theme-css'

export function applyCustomThemeCss(colors: BrandColors) {
  const css = buildCustomThemeCss(colors)
  let style = document.getElementById('valence-custom-theme')

  if (!style) {
    style = document.createElement('style')
    style.id = 'valence-custom-theme'
    document.head.appendChild(style)
  }

  style.textContent = css
  localStorage.setItem(CUSTOM_THEME_CSS_KEY, css)
}

export function clearCustomThemeCss() {
  document.getElementById('valence-custom-theme')?.remove()
  localStorage.removeItem(CUSTOM_THEME_CSS_KEY)
}
