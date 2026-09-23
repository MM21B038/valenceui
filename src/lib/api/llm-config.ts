import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type {
  LlmChatRequest,
  LlmChatResponse,
  LlmConfig,
  LlmConfigCreatePayload,
  LlmProviderOptionsResponse,
  PaginatedResponse,
} from '@/lib/types/llm-config'

export const llmConfigKeys = {
  all: ['llm-config'] as const,
  detail: (uuid: string) => ['llm-config', uuid] as const,
  providers: ['llm-provider'] as const,
}

export function useLlmProviders() {
  return useQuery({
    queryKey: llmConfigKeys.providers,
    queryFn: async () => {
      const { data } = await apiClient.get<LlmProviderOptionsResponse>(
        '/llm-provider/',
      )
      return data.providers
    },
    staleTime: 5 * 60_000,
  })
}

export function useLlmConfigs() {
  return useQuery({
    queryKey: llmConfigKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<LlmConfig> | LlmConfig[]>(
        '/llm-config/',
      )
      return Array.isArray(data) ? data : data.results
    },
  })
}

export function useLlmConfig(uuid: string) {
  return useQuery({
    queryKey: llmConfigKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<LlmConfig>(`/llm-config/${uuid}/`)
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateLlmConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: LlmConfigCreatePayload) => {
      const { data } = await apiClient.post<LlmConfig>('/llm-config/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: llmConfigKeys.all })
    },
  })
}

export function useUpdateLlmConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: Partial<LlmConfigCreatePayload>
    }) => {
      const { data } = await apiClient.patch<LlmConfig>(
        `/llm-config/${uuid}/`,
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: llmConfigKeys.all })
      queryClient.setQueryData(llmConfigKeys.detail(data.uuid), data)
    },
  })
}

export function useLlmChat() {
  return useMutation({
    mutationFn: async ({
      configId,
      message,
      servers = [],
    }: {
      configId: string
      message: string
      servers?: string[]
    }) => {
      const payload: LlmChatRequest = { message, servers }
      const { data } = await apiClient.post<LlmChatResponse>(
        `/llm-chat/${configId}/`,
        payload,
      )
      return data
    },
  })
}

export function useDeleteLlmConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/llm-config/${uuid}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: llmConfigKeys.all })
    },
  })
}
