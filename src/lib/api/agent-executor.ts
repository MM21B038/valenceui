import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type {
  AgentExecutor,
  AgentExecutorCreatePayload,
  AgentExecutorListItem,
} from '@/lib/types/agent-executor'
import type { PaginatedResponse } from '@/lib/types/llm-config'

export const agentExecutorKeys = {
  all: ['agent-executor'] as const,
  detail: (uuid: string) => ['agent-executor', uuid] as const,
}

function normalizeList<T>(data: PaginatedResponse<T> | T[]) {
  return Array.isArray(data) ? data : data.results
}

export function useAgentExecutors() {
  return useQuery({
    queryKey: agentExecutorKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<AgentExecutorListItem> | AgentExecutorListItem[]
      >('/agent-executor/')
      return normalizeList(data)
    },
  })
}

export function useAgentExecutor(uuid: string) {
  return useQuery({
    queryKey: agentExecutorKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentExecutor>(
        `/agent-executor/${uuid}/`,
      )
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateAgentExecutor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AgentExecutorCreatePayload) => {
      const { data } = await apiClient.post<AgentExecutor>(
        '/agent-executor/',
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentExecutorKeys.all })
    },
  })
}

export function useUpdateAgentExecutor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: Partial<AgentExecutorCreatePayload>
    }) => {
      const { data } = await apiClient.patch<AgentExecutor>(
        `/agent-executor/${uuid}/`,
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentExecutorKeys.all })
      queryClient.setQueryData(agentExecutorKeys.detail(data.uuid), data)
    },
  })
}

export function useDeleteAgentExecutor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/agent-executor/${uuid}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentExecutorKeys.all })
    },
  })
}
