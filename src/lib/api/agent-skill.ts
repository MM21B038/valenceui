import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type {
  AgentSkill,
  AgentSkillCreatePayload,
  AgentSkillListItem,
} from '@/lib/types/agent-skill'
import type { PaginatedResponse } from '@/lib/types/llm-config'

export const agentSkillKeys = {
  all: ['agent-skill'] as const,
  detail: (uuid: string) => ['agent-skill', uuid] as const,
}

function normalizeList<T>(data: PaginatedResponse<T> | T[]) {
  return Array.isArray(data) ? data : data.results
}

export function useAgentSkills() {
  return useQuery({
    queryKey: agentSkillKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<AgentSkillListItem> | AgentSkillListItem[]
      >('/agent-skill/')
      return normalizeList(data)
    },
  })
}

export function useAgentSkill(uuid: string) {
  return useQuery({
    queryKey: agentSkillKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentSkill>(`/agent-skill/${uuid}/`)
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateAgentSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AgentSkillCreatePayload) => {
      const { data } = await apiClient.post<AgentSkill>(
        '/agent-skill/',
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentSkillKeys.all })
    },
  })
}

export function useUpdateAgentSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: Partial<AgentSkillCreatePayload>
    }) => {
      const { data } = await apiClient.patch<AgentSkill>(
        `/agent-skill/${uuid}/`,
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentSkillKeys.all })
      queryClient.setQueryData(agentSkillKeys.detail(data.uuid), data)
    },
  })
}

export function useDeleteAgentSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/agent-skill/${uuid}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentSkillKeys.all })
    },
  })
}
