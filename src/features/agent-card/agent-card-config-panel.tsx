import { CreditCard, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { InspectorPanel } from '@/components/layout/inspector-panel'
import { CreateAgentCardForm } from '@/features/agent-card/create-agent-card-form'
import {
  useAgentCard,
  useAgentCards,
  useDeleteAgentCard,
} from '@/lib/api/agent-card'
import type { AgentCard, AgentCardListItem } from '@/lib/types/agent-card'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

type PanelMode = 'pick' | 'create' | 'edit'

export function AgentCardConfigPanel() {
  const modalNodeId = useWorkflowStore((state) => state.agentCardModalNodeId)
  const closeModal = useWorkflowStore((state) => state.closeAgentCardModal)
  const updateNode = useWorkflowStore((state) => state.updateAgentCardNode)
  const nodes = useWorkflowStore((state) => state.nodes)

  const [mode, setMode] = useState<PanelMode>('pick')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: configs = [], isLoading, isError } = useAgentCards()
  const {
    data: editingConfig,
    isLoading: isLoadingEdit,
    isError: isEditError,
  } = useAgentCard(editingId ?? '')
  const deleteConfig = useDeleteAgentCard()

  const isOpen = Boolean(modalNodeId)
  const activeNode = nodes.find((node) => node.id === modalNodeId)
  const selectedId =
    activeNode?.type === 'agentCard' ? activeNode.data.configId : undefined

  useEffect(() => {
    if (!isOpen) {
      setMode('pick')
      setEditingId(null)
    }
  }, [isOpen])

  const bind = (config: AgentCard | AgentCardListItem) => {
    if (!modalNodeId) return
    updateNode(modalNodeId, {
      configId: config.uuid,
      name: config.name,
      version: 'version' in config ? config.version : null,
      label: config.name,
    })
    closeModal()
  }

  const handleDelete = async (config: AgentCardListItem) => {
    if (!window.confirm(`Delete "${config.name}"?`)) return
    setDeletingId(config.uuid)
    try {
      await deleteConfig.mutateAsync(config.uuid)
      for (const node of nodes) {
        if (node.type === 'agentCard' && node.data.configId === config.uuid) {
          updateNode(node.id, {
            configId: undefined,
            name: undefined,
            version: undefined,
            label: 'Agent Card',
          })
        }
      }
      if (editingId === config.uuid) {
        setEditingId(null)
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
          ? 'New Agent Card'
          : mode === 'edit'
            ? 'Edit Agent Card'
            : 'Agent Card'
      }
      subtitle={
        mode === 'pick'
          ? 'Select card'
          : 'Uses linked skills & interfaces from canvas'
      }
      bodyClassName="overflow-y-auto"
    >
      {mode === 'create' && modalNodeId ? (
        <CreateAgentCardForm
          nodeId={modalNodeId}
          onSaved={bind}
          onCancel={() => setMode('pick')}
        />
      ) : mode === 'edit' && editingId && modalNodeId ? (
        isLoadingEdit ? (
          <div className="flex justify-center py-10 text-panel-muted">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : isEditError || !editingConfig ? (
          <p className="text-xs text-destructive">Could not load card.</p>
        ) : (
          <CreateAgentCardForm
            nodeId={modalNodeId}
            initialConfig={editingConfig}
            onSaved={() => {
              setEditingId(null)
              setMode('pick')
            }}
            onCancel={() => {
              setEditingId(null)
              setMode('pick')
            }}
          />
        )
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
                    setEditingId(config.uuid)
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
                onClick={() => bind(config)}
                className={cn(
                  'flex size-full flex-col items-center justify-center gap-2 rounded-2xl border p-3',
                  selectedId === config.uuid
                    ? 'border-connector bg-connector/10'
                    : 'border-panel-border bg-node/40',
                )}
              >
                <CreditCard className="size-5 text-connector" />
                <p className="w-full truncate text-xs font-semibold">
                  {config.name}
                </p>
                {config.version ? (
                  <p className="text-[10px] text-panel-muted">{config.version}</p>
                ) : null}
              </button>
            </div>
          ))}
        </div>
      )}
    </InspectorPanel>
  )
}
