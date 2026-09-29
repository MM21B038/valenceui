import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type {
  AgentCard,
  AgentCardCreatePayload,
  AgentCardListItem,
} from '@/lib/types/agent-card'
import type { PaginatedResponse } from '@/lib/types/llm-config'

export const agentCardKeys = {
  all: ['agent-card'] as const,
  detail: (uuid: string) => ['agent-card', uuid] as const,
}

function normalizeList<T>(data: PaginatedResponse<T> | T[]) {
  return Array.isArray(data) ? data : data.results
}

export function useAgentCards() {
  return useQuery({
    queryKey: agentCardKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<AgentCardListItem> | AgentCardListItem[]
      >('/agent-card/')
      return normalizeList(data)
    },
  })
}

export function useAgentCard(uuid: string) {
  return useQuery({
    queryKey: agentCardKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentCard>(`/agent-card/${uuid}/`)
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateAgentCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AgentCardCreatePayload) => {
      const { data } = await apiClient.post<AgentCard>('/agent-card/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentCardKeys.all })
    },
  })
}

export function useUpdateAgentCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: Partial<AgentCardCreatePayload>
    }) => {
      const { data } = await apiClient.patch<AgentCard>(
        `/agent-card/${uuid}/`,
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentCardKeys.all })
      queryClient.setQueryData(agentCardKeys.detail(data.uuid), data)
    },
  })
}

export function useDeleteAgentCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/agent-card/${uuid}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentCardKeys.all })
    },
  })
}
