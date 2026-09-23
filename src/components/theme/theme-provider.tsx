import { createContext, useContext, useEffect, useState } from 'react'

import { THEME_MODE_STORAGE_KEY, type ThemeMode } from '@/lib/theme/brand'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.dataset.theme = mode
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultMode?: ThemeMode
}

export function ThemeProvider({
  children,
  defaultMode = 'dark',
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode | null
    return stored ?? defaultMode
  })

  useEffect(() => {
    applyTheme(mode)
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode)
  }, [mode])

  const toggleMode = () => {
    setMode((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode }}>
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
