import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type {
  SkillTag,
  SkillTagCreatePayload,
} from '@/lib/types/agent-skill'
import type { PaginatedResponse } from '@/lib/types/llm-config'

export const skillTagKeys = {
  all: ['skill-tag'] as const,
  search: (term: string) => ['skill-tag', 'search', term] as const,
}

function normalizeList<T>(data: PaginatedResponse<T> | T[]) {
  return Array.isArray(data) ? data : data.results
}

export function useSkillTags(search = '') {
  return useQuery({
    queryKey: skillTagKeys.search(search),
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<SkillTag> | SkillTag[]
      >('/skill-tag/', {
        params: search ? { search } : undefined,
      })
      return normalizeList(data)
    },
  })
}

export function useCreateSkillTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SkillTagCreatePayload) => {
      const { data } = await apiClient.post<SkillTag>('/skill-tag/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillTagKeys.all })
    },
  })
}

export function useDeleteSkillTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/skill-tag/${uuid}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillTagKeys.all })
    },
  })
}
