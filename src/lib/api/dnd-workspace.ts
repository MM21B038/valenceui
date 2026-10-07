import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type {
  AgentInterfaceStackEntity,
  AgentSkillStackEntity,
  DndComponent,
  DndComponentCreatePayload,
  DndConnection,
  DndConnectionCreatePayload,
  ServerStackEntity,
  WorkspaceContainerResult,
  WorkspaceCreatePayload,
  WorkspaceDetail,
  WorkspaceListItem,
  WorkspaceType,
  WorkspaceUpdatePayload,
} from '@/lib/types/dnd-workspace'

export const workspaceKeys = {
  all: ['workspace'] as const,
  list: (type?: WorkspaceType) => ['workspace', 'list', type ?? 'all'] as const,
  detail: (uuid: string) => ['workspace', uuid] as const,
}

export function useWorkspaces(type?: WorkspaceType) {
  return useQuery({
    queryKey: workspaceKeys.list(type),
    queryFn: async () => {
      const { data } = await apiClient.get<WorkspaceListItem[]>('/workspace/', {
        params: type ? { type } : undefined,
      })
      return data
    },
  })
}

export function useWorkspace(uuid: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await apiClient.get<WorkspaceDetail>(
        `/workspace/${uuid}/`,
      )
      return data
    },
    enabled: Boolean(uuid),
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: WorkspaceCreatePayload) => {
      const { data } = await apiClient.post<WorkspaceDetail>('/workspace/', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all })
    },
  })
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: WorkspaceUpdatePayload
    }) => {
      const { data } = await apiClient.patch<WorkspaceDetail>(
        `/workspace/${uuid}/`,
        payload,
      )
      return data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all })
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(vars.uuid),
      })
    },
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/workspace/${uuid}/`)
    },
    onSuccess: (_data, uuid) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all })
      queryClient.removeQueries({ queryKey: workspaceKeys.detail(uuid) })
    },
  })
}

/** POST /workspace/<uuid>/run/ */
export function useRunWorkspace() {
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await apiClient.post<WorkspaceContainerResult>(
        `/workspace/${uuid}/run/`,
      )
      return data
    },
  })
}

/** POST /workspace/<uuid>/stop/ */
export function useStopWorkspace() {
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await apiClient.post<WorkspaceContainerResult>(
        `/workspace/${uuid}/stop/`,
      )
      return data
    },
  })
}

/** POST /workspace/<uuid>/stop-remove/ */
export function useStopRemoveWorkspace() {
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await apiClient.post<WorkspaceContainerResult>(
        `/workspace/${uuid}/stop-remove/`,
      )
      return data
    },
  })
}

export async function createDndComponent(payload: DndComponentCreatePayload) {
  const { data } = await apiClient.post<DndComponent>('/component/', payload)
  return data
}

export async function patchDndComponent(
  uuid: string,
  payload: Partial<DndComponentCreatePayload>,
) {
  const { data } = await apiClient.patch<DndComponent>(
    `/component/${uuid}/`,
    payload,
  )
  return data
}

export async function deleteDndComponent(uuid: string) {
  await apiClient.delete(`/component/${uuid}/`)
}

export async function createDndConnection(payload: DndConnectionCreatePayload) {
  const { data } = await apiClient.post<DndConnection>('/connection/', payload)
  return data
}

export async function deleteDndConnection(uuid: string) {
  await apiClient.delete(`/connection/${uuid}/`)
}

export async function createServerStack(servers: string[]) {
  const { data } = await apiClient.post<ServerStackEntity>('/server-stack/', {
    servers,
  })
  return data
}

export async function getServerStack(uuid: string) {
  const { data } = await apiClient.get<ServerStackEntity>(
    `/server-stack/${uuid}/`,
  )
  return data
}

export async function createAgentSkillStack(agent_skills: string[]) {
  const { data } = await apiClient.post<AgentSkillStackEntity>(
    '/agent-skill-stack/',
    { agent_skills },
  )
  return data
}

export async function getAgentSkillStack(uuid: string) {
  const { data } = await apiClient.get<AgentSkillStackEntity>(
    `/agent-skill-stack/${uuid}/`,
  )
  return data
}

export async function createAgentInterfaceStack(agent_interfaces: string[]) {
  const { data } = await apiClient.post<AgentInterfaceStackEntity>(
    '/agent-interface-stack/',
    { agent_interfaces },
  )
  return data
}

export async function getAgentInterfaceStack(uuid: string) {
  const { data } = await apiClient.get<AgentInterfaceStackEntity>(
    `/agent-interface-stack/${uuid}/`,
  )
  return data
}
