/**
 * Valence brand palettes — four colors mapped to UI roles in index.css.
 */

export interface BrandColors {
  deep: string
  mid: string
  accent: string
  sand: string
}

export const palettes = {
  default: {
    id: 'default',
    name: 'Valence',
    colors: {
      deep: '#1B3C53',
      mid: '#234C6A',
      accent: '#456882',
      sand: '#D2C1B6',
    },
  },
  dune: {
    id: 'dune',
    name: 'Dune',
    colors: {
      deep: '#202121',
      mid: '#3D4242',
      accent: '#8A8D8D',
      sand: '#B5AF99',
    },
  },
} as const

export const DEFAULT_CUSTOM_COLORS: BrandColors = {
  deep: '#202121',
  mid: '#3D4242',
  accent: '#8A8D8D',
  sand: '#B5AF99',
}

/** @deprecated Use `palettes.default.colors` or `resolvePalette()` */
export const brand = palettes.default.colors

export const colorRoles = {
  chrome: 'Top bar — navigation & actions',
  panel: 'Side panels — palette & inspector',
  workspace: 'Canvas work area',
  node: 'Node & palette card surfaces',
  connector: 'Handles, edges, focus rings',
} as const

export const BRAND_COLOR_LABELS: Record<keyof BrandColors, string> = {
  deep: 'Deep',
  mid: 'Mid',
  accent: 'Accent',
  sand: 'Sand',
}

export type BuiltInPalette = keyof typeof palettes
export type ThemePalette = BuiltInPalette | 'custom'
export type ThemeMode = 'light' | 'dark'
export type ComponentColorTarget = 'llm' | 'toolServer'

export type ComponentColorsMap = Partial<
  Record<ComponentColorTarget, BrandColors>
>

export type ComponentGradientsMap = Partial<
  Record<ComponentColorTarget, string>
>

export interface ThemeSettings {
  mode: ThemeMode
  palette: ThemePalette
  customColors?: BrandColors
  /** UUID of the active AppTheme from the API, when using a saved palette */
  activeThemeUuid?: string | null
  componentColors?: ComponentColorsMap
  componentGradients?: ComponentGradientsMap
}

export const THEME_STORAGE_KEY = 'valence-theme'

export function getBuiltInPalette(id: BuiltInPalette) {
  return palettes[id]
}

export function resolvePalette(settings: ThemeSettings) {
  if (settings.palette === 'custom') {
    return {
      id: 'custom' as const,
      name: 'Custom',
      colors: settings.customColors ?? DEFAULT_CUSTOM_COLORS,
    }
  }

  return palettes[settings.palette]
}

export function resolveGlobalBrandColors(settings: ThemeSettings): BrandColors {
  return resolvePalette(settings).colors
}

export function resolveComponentBrandColors(
  settings: ThemeSettings,
  target: ComponentColorTarget,
): BrandColors {
  return settings.componentColors?.[target] ?? resolveGlobalBrandColors(settings)
}

/** @deprecated Use `resolvePalette()` */
export function getPalette(id: BuiltInPalette) {
  return palettes[id]
}

function isBuiltInPalette(value: unknown): value is BuiltInPalette {
  return value === 'default' || value === 'dune'
}

function isBrandColors(value: unknown): value is BrandColors {
  if (!value || typeof value !== 'object') return false
  const colors = value as Partial<BrandColors>
  return (
    typeof colors.deep === 'string' &&
    typeof colors.mid === 'string' &&
    typeof colors.accent === 'string' &&
    typeof colors.sand === 'string'
  )
}

export function parseStoredTheme(
  stored: string | null,
  defaultSettings: ThemeSettings,
): ThemeSettings {
  if (!stored) return defaultSettings
  if (stored === 'light' || stored === 'dark') {
    return { mode: stored, palette: 'default' }
  }

  try {
    const parsed = JSON.parse(stored) as Partial<ThemeSettings>
    const mode =
      parsed.mode === 'light' || parsed.mode === 'dark'
        ? parsed.mode
        : defaultSettings.mode
    const rawPalette =
      (parsed.palette as string | undefined) === 'nocturne'
        ? 'dune'
        : parsed.palette
    const palette =
      isBuiltInPalette(rawPalette) || rawPalette === 'custom'
        ? rawPalette
        : defaultSettings.palette

    const settings: ThemeSettings = { mode, palette }

    if (typeof parsed.activeThemeUuid === 'string') {
      settings.activeThemeUuid = parsed.activeThemeUuid
    }

    if (palette === 'custom' && isBrandColors(parsed.customColors)) {
      settings.customColors = parsed.customColors
    } else if (palette === 'custom') {
      settings.customColors = defaultSettings.customColors ?? DEFAULT_CUSTOM_COLORS
    }

    if (parsed.componentColors && typeof parsed.componentColors === 'object') {
      const componentColors: ComponentColorsMap = {}
      if (isBrandColors(parsed.componentColors.llm)) {
        componentColors.llm = parsed.componentColors.llm
      }
      if (isBrandColors(parsed.componentColors.toolServer)) {
        componentColors.toolServer = parsed.componentColors.toolServer
      }
      if (Object.keys(componentColors).length > 0) {
        settings.componentColors = componentColors
      }
    }

    if (parsed.componentGradients && typeof parsed.componentGradients === 'object') {
      const componentGradients: ComponentGradientsMap = {}
      if (typeof parsed.componentGradients.llm === 'string') {
        componentGradients.llm = parsed.componentGradients.llm
      }
      if (typeof parsed.componentGradients.toolServer === 'string') {
        componentGradients.toolServer = parsed.componentGradients.toolServer
      }
      if (Object.keys(componentGradients).length > 0) {
        settings.componentGradients = componentGradients
      }
    }

    return settings
  } catch {
    return defaultSettings
  }
}
