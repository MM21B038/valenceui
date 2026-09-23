import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/client'
import type { WorkflowGraph } from '@/lib/types/workflow'

export const workflowKeys = {
  all: ['workflows'] as const,
  detail: (id: string) => ['workflows', id] as const,
}

export function useWorkflows() {
  return useQuery({
    queryKey: workflowKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<WorkflowGraph[]>('/workflows/')
      return data
    },
    enabled: false,
  })
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<WorkflowGraph>(`/workflows/${id}/`)
      return data
    },
    enabled: Boolean(id),
  })
}

export function useSaveWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workflow: WorkflowGraph) => {
      const { data } = await apiClient.put<WorkflowGraph>(
        `/workflows/${workflow.id}/`,
        workflow,
      )
      return data
    },
    onSuccess: (workflow) => {
      queryClient.setQueryData(workflowKeys.detail(workflow.id), workflow)
      queryClient.invalidateQueries({ queryKey: workflowKeys.all })
    },
  })
}
