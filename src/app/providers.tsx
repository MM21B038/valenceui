import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { AppThemeSync } from '@/components/theme/app-theme-sync'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { queryClient } from '@/lib/api/query-client'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultMode="dark">
        <AppThemeSync />
        {children}
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
