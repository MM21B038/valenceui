import { Loader2, Network, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { InspectorPanel } from '@/components/layout/inspector-panel'
import { CreateAgentInterfaceForm } from '@/features/agent-interface/create-agent-interface-form'
import {
  useAgentInterfaces,
  useDeleteAgentInterface,
} from '@/lib/api/agent-interface'
import {
  formatAgentInterfaceEndpoint,
  formatProtocolBindingLabel,
  type AgentInterface,
} from '@/lib/types/agent-interface'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

type PanelMode = 'pick' | 'create' | 'edit'

export function AgentInterfaceConfigPanel() {
  const modalNodeId = useWorkflowStore(
    (state) => state.agentInterfaceModalNodeId,
  )
  const expandedStackId = useWorkflowStore((state) => state.expandedStackId)
  const closeModal = useWorkflowStore((state) => state.closeAgentInterfaceModal)
  const updateNode = useWorkflowStore((state) => state.updateAgentInterfaceNode)
  const nodes = useWorkflowStore((state) => state.nodes)

  const [mode, setMode] = useState<PanelMode>('pick')
  const [editingConfig, setEditingConfig] = useState<AgentInterface | null>(
    null,
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: configs = [], isLoading, isError } = useAgentInterfaces()
  const deleteConfig = useDeleteAgentInterface()

  const isOpen = Boolean(modalNodeId)
  const activeNode = nodes.find((node) => node.id === modalNodeId)
  const selectedId =
    activeNode?.type === 'agentInterface' ? activeNode.data.configId : undefined

  useEffect(() => {
    if (!isOpen) {
      setMode('pick')
      setEditingConfig(null)
    }
  }, [isOpen])

  const handleSelect = (config: AgentInterface) => {
    if (!modalNodeId) return
    const endpoint = formatAgentInterfaceEndpoint(config.host, config.port)
    updateNode(modalNodeId, {
      configId: config.uuid,
      host: config.host,
      port: config.port,
      protocol_binding: config.protocol_binding,
      label:
        endpoint ?? formatProtocolBindingLabel(config.protocol_binding),
    })
    closeModal()
  }

  const syncNodesWithConfig = (config: AgentInterface) => {
    for (const node of nodes) {
      if (
        node.type === 'agentInterface' &&
        node.data.configId === config.uuid
      ) {
        const endpoint = formatAgentInterfaceEndpoint(config.host, config.port)
        updateNode(node.id, {
          host: config.host,
          port: config.port,
          protocol_binding: config.protocol_binding,
          label:
            endpoint ?? formatProtocolBindingLabel(config.protocol_binding),
        })
      }
    }
  }

  const handleDelete = async (config: AgentInterface) => {
    if (!window.confirm('Delete this interface?')) return
    setDeletingId(config.uuid)
    try {
      await deleteConfig.mutateAsync(config.uuid)
      for (const node of nodes) {
        if (
          node.type === 'agentInterface' &&
          node.data.configId === config.uuid
        ) {
          updateNode(node.id, {
            configId: undefined,
            host: undefined,
            port: undefined,
            protocol_binding: undefined,
            label: 'Agent Interface',
          })
        }
      }
      if (editingConfig?.uuid === config.uuid) {
        setEditingConfig(null)
        setMode('pick')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <InspectorPanel
      isOpen={isOpen}
      onClose={closeModal}
      title={
        mode === 'create'
          ? 'New Interface'
          : mode === 'edit'
            ? 'Edit Interface'
            : 'Agent Interface'
      }
      subtitle={mode === 'pick' ? 'Select interface' : 'A2A transport'}
      bodyClassName="overflow-y-auto"
      showBackdrop={!expandedStackId}
    >
      {mode === 'create' ? (
        <CreateAgentInterfaceForm
          onSaved={handleSelect}
          onCancel={() => setMode('pick')}
        />
      ) : mode === 'edit' && editingConfig ? (
        <CreateAgentInterfaceForm
          initialConfig={editingConfig}
          onSaved={(config) => {
            syncNodesWithConfig(config)
            setEditingConfig(null)
            setMode('pick')
          }}
          onCancel={() => {
            setEditingConfig(null)
            setMode('pick')
          }}
        />
      ) : isLoading ? (
        <div className="flex justify-center py-10 text-panel-muted">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-xs text-destructive">API unreachable.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('create')}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-panel-border text-panel-muted"
          >
            <Plus className="size-5" />
            <span className="text-xs">Add new</span>
          </button>
          {configs.map((config) => (
            <div key={config.uuid} className="group/card relative aspect-square">
              <div className="absolute -top-1 -right-1 z-20 flex gap-0.5 opacity-0 transition-opacity group-hover/card:opacity-100">
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-md border bg-background"
                  onClick={(event) => {
                    event.stopPropagation()
                    setEditingConfig(config)
                    setMode('edit')
                  }}
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-md border bg-background text-destructive"
                  disabled={deletingId === config.uuid}
                  onClick={(event) => {
                    event.stopPropagation()
                    void handleDelete(config)
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleSelect(config)}
                className={cn(
                  'flex size-full flex-col items-center justify-center gap-2 rounded-2xl border p-3',
                  selectedId === config.uuid
                    ? 'border-connector bg-connector/10'
                    : 'border-panel-border bg-node/40',
                )}
              >
                <Network className="size-5 text-connector" />
                <p className="w-full truncate text-xs font-semibold">
                  {formatAgentInterfaceEndpoint(config.host, config.port) ??
                    formatProtocolBindingLabel(config.protocol_binding)}
                </p>
                <p className="text-[10px] text-panel-muted">
                  {formatProtocolBindingLabel(config.protocol_binding)}
                </p>
              </button>
            </div>
          ))}
        </div>
      )}
    </InspectorPanel>
  )
}
