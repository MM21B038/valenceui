import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type { PaginatedResponse } from '@/lib/types/llm-config'
import type {
  ThreadConfig,
  ThreadConfigCreatePayload,
  ThreadConfigListItem,
} from '@/lib/types/thread-config'

export const threadConfigKeys = {
  all: ['thread-config'] as const,
  detail: (uuid: string) => ['thread-config', uuid] as const,
}

function normalizeList<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results
}

export function useThreadConfigs() {
  return useQuery({
    queryKey: threadConfigKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<ThreadConfigListItem> | ThreadConfigListItem[]
      >('/thread-config/')
      return normalizeList(data)
    },
  })
}

export function useThreadConfig(uuid: string) {
  return useQuery({
    queryKey: threadConfigKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<ThreadConfig>(
        `/thread-config/${uuid}`,
      )
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateThreadConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ThreadConfigCreatePayload) => {
      const { data } = await apiClient.post<ThreadConfig>(
        '/thread-config/',
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadConfigKeys.all })
    },
  })
}

export function useUpdateThreadConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: Partial<ThreadConfigCreatePayload>
    }) => {
      const { data } = await apiClient.patch<ThreadConfig>(
        `/thread-config/${uuid}`,
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: threadConfigKeys.all })
      queryClient.setQueryData(threadConfigKeys.detail(data.uuid), data)
    },
  })
}

export function useDeleteThreadConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/thread-config/${uuid}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadConfigKeys.all })
    },
  })
}
