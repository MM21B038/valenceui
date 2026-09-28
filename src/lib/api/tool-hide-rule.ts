import { useMutation, useQuery, useQueries, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type { PaginatedResponse } from '@/lib/types/llm-config'
import type {
  ToolHideRule,
  ToolHideRuleCreatePayload,
  ToolHideRuleUpdatePayload,
} from '@/lib/types/tool-hide-rule'

export const toolHideRuleKeys = {
  all: ['tool-hide-rule'] as const,
  byServer: (serverId: string) => ['tool-hide-rule', 'server', serverId] as const,
  detail: (uuid: string) => ['tool-hide-rule', uuid] as const,
}

function normalizeList<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results
}

async function fetchToolHideRules(serverId?: string) {
  const { data } = await apiClient.get<
    PaginatedResponse<ToolHideRule> | ToolHideRule[]
  >('/tool-hide-rule/', {
    params: serverId ? { server: serverId } : undefined,
  })
  return normalizeList(data)
}

export function useToolHideRules(serverId?: string | null) {
  return useQuery({
    queryKey: serverId
      ? toolHideRuleKeys.byServer(serverId)
      : toolHideRuleKeys.all,
    queryFn: () => fetchToolHideRules(serverId ?? undefined),
    enabled: serverId === undefined || serverId === null ? true : Boolean(serverId),
  })
}

/** Fetch hide rules for multiple MCP server config UUIDs in parallel. */
export function useToolHideRulesByServers(serverIds: string[]) {
  const queries = useQueries({
    queries: serverIds.map((serverId) => ({
      queryKey: toolHideRuleKeys.byServer(serverId),
      queryFn: () => fetchToolHideRules(serverId),
      enabled: Boolean(serverId),
    })),
  })

  const rules = queries.flatMap((query) => query.data ?? [])
  const isLoading = queries.some((query) => query.isLoading)
  const isError = queries.some((query) => query.isError)

  return { rules, isLoading, isError, queries }
}

export function useToolHideRule(uuid: string) {
  return useQuery({
    queryKey: toolHideRuleKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<ToolHideRule>(
        `/tool-hide-rule/${uuid}/`,
      )
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateToolHideRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ToolHideRuleCreatePayload) => {
      const { data } = await apiClient.post<ToolHideRule>(
        '/tool-hide-rule/',
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toolHideRuleKeys.all })
    },
  })
}

export function useUpdateToolHideRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: ToolHideRuleUpdatePayload
    }) => {
      const { data } = await apiClient.patch<ToolHideRule>(
        `/tool-hide-rule/${uuid}/`,
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: toolHideRuleKeys.all })
      queryClient.setQueryData(toolHideRuleKeys.detail(data.uuid), data)
    },
  })
}
