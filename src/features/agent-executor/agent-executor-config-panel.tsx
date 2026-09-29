import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { InspectorPanel } from '@/components/layout/inspector-panel'
import { ExecutorPickerList } from '@/features/a2a/executor-picker-list'
import { CreateAgentExecutorForm } from '@/features/agent-executor/create-agent-executor-form'
import {
  useAgentExecutor,
  useAgentExecutors,
} from '@/lib/api/agent-executor'
import type {
  AgentExecutor,
  AgentExecutorListItem,
} from '@/lib/types/agent-executor'
import { useWorkflowStore } from '@/stores/workflow-store'

/**
 * Agent Executor inspector:
 * - agent-executor workspace: unset → create form; set → edit form (no pick grid)
 * - a2a workspace: rebind an existing executor onto the clicked node
 */
export function AgentExecutorConfigPanel() {
  const modalNodeId = useWorkflowStore(
    (state) => state.agentExecutorModalNodeId,
  )
  const workspaceType = useWorkflowStore((state) => state.workspaceType)
  const closeModal = useWorkflowStore((state) => state.closeAgentExecutorModal)
  const updateNode = useWorkflowStore((state) => state.updateAgentExecutorNode)
  const nodes = useWorkflowStore((state) => state.nodes)

  const [search, setSearch] = useState('')

  const isOpen = Boolean(modalNodeId)
  const activeNode = nodes.find((node) => node.id === modalNodeId)
  const selectedId =
    activeNode?.type === 'agentExecutor' ? activeNode.data.configId : undefined
  const isA2a = workspaceType === 'a2a'
  const wantsEdit = Boolean(selectedId) && !isA2a

  const { data: configs = [], isLoading, isError } = useAgentExecutors()
  const { data: editingConfig, isLoading: isLoadingEdit } = useAgentExecutor(
    wantsEdit ? (selectedId ?? '') : '',
  )

  useEffect(() => {
    if (!isOpen) setSearch('')
  }, [isOpen])

  const bind = (config: AgentExecutor | AgentExecutorListItem) => {
    if (!modalNodeId) return
    updateNode(modalNodeId, {
      configId: config.uuid,
      name: config.name,
      host: config.host,
      port: config.port,
      label: config.name,
    })
    closeModal()
  }

  const title = isA2a
    ? 'Rebind Agent Executor'
    : wantsEdit
      ? 'Edit Agent Executor'
      : 'New Agent Executor'

  const subtitle = isA2a
    ? 'Pick a different executor for this node'
    : 'Compose from linked LLM, thread, MCP & card'

  return (
    <InspectorPanel
      isOpen={isOpen}
      onClose={closeModal}
      title={title}
      subtitle={subtitle}
      bodyClassName="overflow-y-auto"
    >
      {isA2a ? (
        <ExecutorPickerList
          configs={configs}
          isLoading={isLoading}
          isError={isError}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId}
          onSelect={bind}
        />
      ) : wantsEdit ? (
        isLoadingEdit || !editingConfig ? (
          <div className="flex justify-center py-10 text-panel-muted">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : modalNodeId ? (
          <CreateAgentExecutorForm
            nodeId={modalNodeId}
            initialConfig={editingConfig}
            onSaved={(config) => bind(config)}
            onCancel={closeModal}
          />
        ) : null
      ) : modalNodeId ? (
        <CreateAgentExecutorForm
          nodeId={modalNodeId}
          onSaved={bind}
          onCancel={closeModal}
        />
      ) : null}
    </InspectorPanel>
  )
}
