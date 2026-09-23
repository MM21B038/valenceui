import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type {
  McpServerConfig,
  McpServerConfigCreatePayload,
  McpServerConfigListItem,
  McpTransportOptionsResponse,
} from '@/lib/types/mcp-server-config'
import type { PaginatedResponse } from '@/lib/types/llm-config'

export const mcpServerConfigKeys = {
  all: ['mcp-server-config'] as const,
  detail: (uuid: string) => ['mcp-server-config', uuid] as const,
  transports: ['mcp-serve-transport-option'] as const,
}

export function useMcpTransports() {
  return useQuery({
    queryKey: mcpServerConfigKeys.transports,
    queryFn: async () => {
      const { data } = await apiClient.get<McpTransportOptionsResponse>(
        '/mcp-serve-transport-option/',
      )
      return data.providers
    },
    staleTime: 5 * 60_000,
  })
}

export function useMcpServerConfigs() {
  return useQuery({
    queryKey: mcpServerConfigKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<McpServerConfigListItem> | McpServerConfigListItem[]
      >('/mcp-server-config/')
      return Array.isArray(data) ? data : data.results
    },
  })
}

export function useMcpServerConfig(uuid: string) {
  return useQuery({
    queryKey: mcpServerConfigKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<McpServerConfig>(
        `/mcp-server-config/${uuid}/`,
      )
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateMcpServerConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: McpServerConfigCreatePayload) => {
      const { data } = await apiClient.post<McpServerConfig>(
        '/mcp-server-config/',
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpServerConfigKeys.all })
    },
  })
}

export function useUpdateMcpServerConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: Partial<McpServerConfigCreatePayload>
    }) => {
      const { data } = await apiClient.patch<McpServerConfig>(
        `/mcp-server-config/${uuid}/`,
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mcpServerConfigKeys.all })
      queryClient.setQueryData(mcpServerConfigKeys.detail(data.uuid), data)
    },
  })
}

export function useDeleteMcpServerConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/mcp-server-config/${uuid}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpServerConfigKeys.all })
    },
  })
}
