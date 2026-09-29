import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type {
  AgentInterface,
  AgentInterfaceCreatePayload,
} from '@/lib/types/agent-interface'
import type { PaginatedResponse } from '@/lib/types/llm-config'

export const agentInterfaceKeys = {
  all: ['agent-interface'] as const,
  detail: (uuid: string) => ['agent-interface', uuid] as const,
}

function normalizeList<T>(data: PaginatedResponse<T> | T[]) {
  return Array.isArray(data) ? data : data.results
}

export function useAgentInterfaces() {
  return useQuery({
    queryKey: agentInterfaceKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<AgentInterface> | AgentInterface[]
      >('/agent-interface/')
      return normalizeList(data)
    },
  })
}

export function useAgentInterface(uuid: string) {
  return useQuery({
    queryKey: agentInterfaceKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentInterface>(
        `/agent-interface/${uuid}/`,
      )
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateAgentInterface() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AgentInterfaceCreatePayload) => {
      const { data } = await apiClient.post<AgentInterface>(
        '/agent-interface/',
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentInterfaceKeys.all })
    },
  })
}

export function useUpdateAgentInterface() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: Partial<AgentInterfaceCreatePayload>
    }) => {
      const { data } = await apiClient.patch<AgentInterface>(
        `/agent-interface/${uuid}/`,
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentInterfaceKeys.all })
      queryClient.setQueryData(agentInterfaceKeys.detail(data.uuid), data)
    },
  })
}

export function useDeleteAgentInterface() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/agent-interface/${uuid}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentInterfaceKeys.all })
    },
  })
}
