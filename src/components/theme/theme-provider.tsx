import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import {
  applyComponentThemeCss,
  COMPONENT_THEME_CSS_KEY,
} from '@/lib/theme/derive-component-tokens'
import {
  applyCustomThemeCss,
  clearCustomThemeCss,
  normalizeBrandColors,
} from '@/lib/theme/derive-tokens'
import {
  DEFAULT_CUSTOM_COLORS,
  parseStoredTheme,
  resolveComponentBrandColors,
  THEME_STORAGE_KEY,
  type BrandColors,
  type ComponentColorTarget,
  type ComponentColorsMap,
  type ComponentGradientsMap,
  type ThemeMode,
  type ThemePalette,
  type ThemeSettings,
} from '@/lib/theme/brand'
import type { AppTheme } from '@/lib/types/app-theme'

interface ThemeContextValue {
  mode: ThemeMode
  palette: ThemePalette
  customColors: BrandColors
  activeThemeUuid: string | null
  componentColors: ComponentColorsMap
  componentGradients: ComponentGradientsMap
  setMode: (mode: ThemeMode) => void
  setPalette: (palette: ThemePalette) => void
  setCustomColors: (colors: BrandColors) => void
  applyAppTheme: (theme: AppTheme) => void
  clearActiveTheme: () => void
  setComponentColors: (target: ComponentColorTarget, colors: BrandColors) => void
  clearComponentColors: (target: ComponentColorTarget) => void
  setComponentGradient: (target: ComponentColorTarget, gradientId: string) => void
  clearComponentGradient: (target: ComponentColorTarget) => void
  getComponentColors: (target: ComponentColorTarget) => BrandColors
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function colorsFromAppTheme(theme: AppTheme): BrandColors {
  return normalizeBrandColors({
    deep: theme.deep,
    mid: theme.mid,
    accent: theme.accent,
    sand: theme.sand,
  })
}

function applyTheme(settings: ThemeSettings) {
  document.documentElement.classList.toggle('dark', settings.mode === 'dark')
  document.documentElement.dataset.theme = settings.mode

  if (settings.palette === 'default') {
    delete document.documentElement.dataset.palette
    clearCustomThemeCss()
  } else if (settings.palette === 'custom') {
    document.documentElement.dataset.palette = 'custom'
    applyCustomThemeCss(settings.customColors ?? DEFAULT_CUSTOM_COLORS)
  } else {
    document.documentElement.dataset.palette = settings.palette
    clearCustomThemeCss()
  }

  const llmColors = resolveComponentBrandColors(settings, 'llm')
  const toolServerColors = resolveComponentBrandColors(settings, 'toolServer')
  applyComponentThemeCss(
    llmColors,
    toolServerColors,
    settings.componentGradients?.llm,
    settings.componentGradients?.toolServer,
  )
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultMode?: ThemeMode
  defaultPalette?: ThemePalette
  defaultCustomColors?: BrandColors
}

export function ThemeProvider({
  children,
  defaultMode = 'dark',
  defaultPalette = 'default',
  defaultCustomColors = DEFAULT_CUSTOM_COLORS,
}: ThemeProviderProps) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    const parsed = parseStoredTheme(stored, {
      mode: defaultMode,
      palette: defaultPalette,
      customColors: defaultCustomColors,
    })

    if (parsed.palette === 'custom' && !parsed.customColors) {
      parsed.customColors = defaultCustomColors
    }

    return parsed
  })

  useEffect(() => {
    applyTheme(settings)
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const setMode = (mode: ThemeMode) => {
    setSettings((current) => ({ ...current, mode }))
  }

  const setPalette = (palette: ThemePalette) => {
    setSettings((current) => ({
      ...current,
      palette,
      activeThemeUuid: null,
      customColors: current.customColors ?? defaultCustomColors,
    }))
  }

  const setCustomColors = (customColors: BrandColors) => {
    setSettings((current) => ({
      ...current,
      palette: 'custom',
      customColors,
      activeThemeUuid: null,
    }))
  }

  const applyAppTheme = useCallback((theme: AppTheme) => {
    const colors = colorsFromAppTheme(theme)
    setSettings((current) => {
      if (
        current.activeThemeUuid === theme.uuid &&
        current.palette === 'custom' &&
        current.customColors?.deep === colors.deep &&
        current.customColors?.mid === colors.mid &&
        current.customColors?.accent === colors.accent &&
        current.customColors?.sand === colors.sand
      ) {
        return current
      }

      return {
        ...current,
        palette: 'custom',
        customColors: colors,
        activeThemeUuid: theme.uuid,
      }
    })
  }, [])

  const clearActiveTheme = useCallback(() => {
    setSettings((current) => ({
      ...current,
      activeThemeUuid: null,
      palette: 'default',
    }))
  }, [])

  const setComponentColors = (
    target: ComponentColorTarget,
    colors: BrandColors,
  ) => {
    setSettings((current) => ({
      ...current,
      componentColors: {
        ...current.componentColors,
        [target]: colors,
      },
    }))
  }

  const clearComponentColors = (target: ComponentColorTarget) => {
    setSettings((current) => {
      if (!current.componentColors?.[target]) return current
      const next = { ...current.componentColors }
      delete next[target]
      return {
        ...current,
        componentColors: Object.keys(next).length > 0 ? next : undefined,
      }
    })
  }

  const setComponentGradient = (
    target: ComponentColorTarget,
    gradientId: string,
  ) => {
    setSettings((current) => ({
      ...current,
      componentGradients: {
        ...current.componentGradients,
        [target]: gradientId,
      },
    }))
  }

  const clearComponentGradient = (target: ComponentColorTarget) => {
    setSettings((current) => {
      if (!current.componentGradients?.[target]) return current
      const next = { ...current.componentGradients }
      delete next[target]
      return {
        ...current,
        componentGradients: Object.keys(next).length > 0 ? next : undefined,
      }
    })
  }

  const getComponentColors = useCallback(
    (target: ComponentColorTarget): BrandColors => {
      return resolveComponentBrandColors(settings, target)
    },
    [settings],
  )

  const toggleMode = () => {
    setSettings((current) => ({
      ...current,
      mode: current.mode === 'dark' ? 'light' : 'dark',
    }))
  }

  return (
    <ThemeContext.Provider
      value={{
        mode: settings.mode,
        palette: settings.palette,
        customColors: settings.customColors ?? defaultCustomColors,
        activeThemeUuid: settings.activeThemeUuid ?? null,
        componentColors: settings.componentColors ?? {},
        componentGradients: settings.componentGradients ?? {},
        setMode,
        setPalette,
        setCustomColors,
        applyAppTheme,
        clearActiveTheme,
        setComponentColors,
        clearComponentColors,
        setComponentGradient,
        clearComponentGradient,
        getComponentColors,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export { COMPONENT_THEME_CSS_KEY }
