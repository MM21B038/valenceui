import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type {
  CompressionPrompt,
  CompressionPromptCreatePayload,
  CompressionPromptListItem,
  PaginatedResponse,
  Prompt,
  PromptCreatePayload,
  PromptListItem,
  Skill,
  SkillCreatePayload,
  SkillListItem,
  SystemPrompt,
  SystemPromptCreatePayload,
  SystemPromptListItem,
} from '@/lib/types/prompt-entities'

function normalizeList<T>(data: PaginatedResponse<T> | T[]) {
  return Array.isArray(data) ? data : data.results
}

export const promptEntityKeys = {
  prompts: {
    all: ['prompt'] as const,
    detail: (uuid: string) => ['prompt', uuid] as const,
  },
  skills: {
    all: ['skill'] as const,
    detail: (uuid: string) => ['skill', uuid] as const,
  },
  systemPrompts: {
    all: ['system-prompt'] as const,
    detail: (uuid: string) => ['system-prompt', uuid] as const,
  },
  compressionPrompts: {
    all: ['compression-prompt'] as const,
    detail: (uuid: string) => ['compression-prompt', uuid] as const,
  },
}

export function usePrompts() {
  return useQuery({
    queryKey: promptEntityKeys.prompts.all,
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<PromptListItem> | PromptListItem[]
      >('/prompt/')
      return normalizeList(data)
    },
  })
}

export function usePrompt(uuid: string) {
  return useQuery({
    queryKey: promptEntityKeys.prompts.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<Prompt>(`/prompt/${uuid}/`)
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreatePrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PromptCreatePayload) => {
      const { data } = await apiClient.post<Prompt>('/prompt/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptEntityKeys.prompts.all })
    },
  })
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: Partial<PromptCreatePayload>
    }) => {
      const { data } = await apiClient.patch<Prompt>(`/prompt/${uuid}/`, payload)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: promptEntityKeys.prompts.all })
      queryClient.setQueryData(promptEntityKeys.prompts.detail(data.uuid), data)
    },
  })
}

export function useDeletePrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/prompt/${uuid}/`)
      return uuid
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptEntityKeys.prompts.all })
    },
  })
}

export function useSkills() {
  return useQuery({
    queryKey: promptEntityKeys.skills.all,
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<SkillListItem> | SkillListItem[]
      >('/skill/')
      return normalizeList(data)
    },
  })
}

export function useSkill(uuid: string) {
  return useQuery({
    queryKey: promptEntityKeys.skills.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<Skill>(`/skill/${uuid}/`)
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SkillCreatePayload) => {
      const { data } = await apiClient.post<Skill>('/skill/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptEntityKeys.skills.all })
    },
  })
}

export function useUpdateSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: Partial<SkillCreatePayload>
    }) => {
      const { data } = await apiClient.patch<Skill>(`/skill/${uuid}/`, payload)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: promptEntityKeys.skills.all })
      queryClient.setQueryData(promptEntityKeys.skills.detail(data.uuid), data)
    },
  })
}

export function useDeleteSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/skill/${uuid}/`)
      return uuid
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptEntityKeys.skills.all })
    },
  })
}

export function useSystemPrompts() {
  return useQuery({
    queryKey: promptEntityKeys.systemPrompts.all,
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<SystemPromptListItem> | SystemPromptListItem[]
      >('/system-prompt/')
      return normalizeList(data)
    },
  })
}

export function useSystemPrompt(uuid: string) {
  return useQuery({
    queryKey: promptEntityKeys.systemPrompts.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<SystemPrompt>(
        `/system-prompt/${uuid}/`,
      )
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateSystemPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SystemPromptCreatePayload) => {
      const { data } = await apiClient.post<SystemPrompt>(
        '/system-prompt/',
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promptEntityKeys.systemPrompts.all,
      })
    },
  })
}

export function useUpdateSystemPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: Partial<SystemPromptCreatePayload>
    }) => {
      const { data } = await apiClient.patch<SystemPrompt>(
        `/system-prompt/${uuid}/`,
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: promptEntityKeys.systemPrompts.all,
      })
      queryClient.setQueryData(
        promptEntityKeys.systemPrompts.detail(data.uuid),
        data,
      )
    },
  })
}

export function useDeleteSystemPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/system-prompt/${uuid}/`)
      return uuid
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promptEntityKeys.systemPrompts.all,
      })
    },
  })
}

export function useCompressionPrompts() {
  return useQuery({
    queryKey: promptEntityKeys.compressionPrompts.all,
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<CompressionPromptListItem> | CompressionPromptListItem[]
      >('/compression-prompt/')
      return normalizeList(data)
    },
  })
}

export function useCompressionPrompt(uuid: string) {
  return useQuery({
    queryKey: promptEntityKeys.compressionPrompts.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<CompressionPrompt>(
        `/compression-prompt/${uuid}/`,
      )
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateCompressionPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CompressionPromptCreatePayload) => {
      const { data } = await apiClient.post<CompressionPrompt>(
        '/compression-prompt/',
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promptEntityKeys.compressionPrompts.all,
      })
    },
  })
}

export function useUpdateCompressionPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: Partial<CompressionPromptCreatePayload>
    }) => {
      const { data } = await apiClient.patch<CompressionPrompt>(
        `/compression-prompt/${uuid}/`,
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: promptEntityKeys.compressionPrompts.all,
      })
      queryClient.setQueryData(
        promptEntityKeys.compressionPrompts.detail(data.uuid),
        data,
      )
    },
  })
}

export function useDeleteCompressionPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/compression-prompt/${uuid}/`)
      return uuid
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promptEntityKeys.compressionPrompts.all,
      })
    },
  })
}
