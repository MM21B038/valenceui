import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type {
  AppTheme,
  AppThemeCreatePayload,
  AppThemeUpdatePayload,
} from '@/lib/types/app-theme'

export const appThemeKeys = {
  all: ['app-theme'] as const,
}

export function useAppThemes() {
  return useQuery({
    queryKey: appThemeKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<AppTheme[]>('/app-theme/')
      return Array.isArray(data) ? data : []
    },
    staleTime: 30_000,
  })
}

export function useCreateAppTheme() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AppThemeCreatePayload) => {
      const { data } = await apiClient.post<AppTheme>('/app-theme/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appThemeKeys.all })
    },
  })
}

export function useSelectAppTheme() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await apiClient.patch<AppTheme>(`/app-theme/${uuid}/`, {})
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appThemeKeys.all })
    },
  })
}

export function useUpdateAppTheme() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: AppThemeUpdatePayload
    }) => {
      const { data } = await apiClient.patch<AppTheme>(
        `/app-theme/${uuid}/`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appThemeKeys.all })
    },
  })
}

export function useDeleteAppTheme() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/app-theme/${uuid}/`)
      return uuid
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appThemeKeys.all })
    },
  })
}
