import { useEffect, useRef } from 'react'

import { useTheme } from '@/components/theme/theme-provider'
import { useAppThemes } from '@/lib/api/app-theme'

/**
 * Hydrates the active AppTheme from the API once on load.
 * Prefers the locally stored uuid, then the server `default` theme.
 */
export function AppThemeSync() {
  const { data: themes } = useAppThemes()
  const { applyAppTheme, activeThemeUuid } = useTheme()
  const hydratedRef = useRef(false)

  useEffect(() => {
    if (hydratedRef.current || !themes || themes.length === 0) return

    if (activeThemeUuid) {
      const match = themes.find((theme) => theme.uuid === activeThemeUuid)
      if (match) {
        applyAppTheme(match)
        hydratedRef.current = true
        return
      }
    }

    const serverDefault = themes.find((theme) => theme.default)
    if (serverDefault) {
      applyAppTheme(serverDefault)
    }

    hydratedRef.current = true
  }, [themes, activeThemeUuid, applyAppTheme])

  return null
}
