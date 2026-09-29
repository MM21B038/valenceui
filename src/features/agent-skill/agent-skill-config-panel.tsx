import { Loader2, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { InspectorPanel } from '@/components/layout/inspector-panel'
import { CreateAgentSkillForm } from '@/features/agent-skill/create-agent-skill-form'
import {
  useAgentSkill,
  useAgentSkills,
  useDeleteAgentSkill,
} from '@/lib/api/agent-skill'
import type { AgentSkillListItem } from '@/lib/types/agent-skill'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

type PanelMode = 'pick' | 'create' | 'edit'

export function AgentSkillConfigPanel() {
  const modalNodeId = useWorkflowStore((state) => state.agentSkillModalNodeId)
  const expandedStackId = useWorkflowStore((state) => state.expandedStackId)
  const closeModal = useWorkflowStore((state) => state.closeAgentSkillModal)
  const updateNode = useWorkflowStore((state) => state.updateAgentSkillNode)
  const nodes = useWorkflowStore((state) => state.nodes)

  const [mode, setMode] = useState<PanelMode>('pick')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: configs = [], isLoading, isError } = useAgentSkills()
  const {
    data: editingConfig,
    isLoading: isLoadingEdit,
    isError: isEditError,
  } = useAgentSkill(editingId ?? '')
  const deleteConfig = useDeleteAgentSkill()

  const isOpen = Boolean(modalNodeId)
  const activeNode = nodes.find((node) => node.id === modalNodeId)
  const selectedId =
    activeNode?.type === 'agentSkill' ? activeNode.data.configId : undefined

  useEffect(() => {
    if (!isOpen) {
      setMode('pick')
      setEditingId(null)
    }
  }, [isOpen])

  const handleSelect = (config: AgentSkillListItem | { uuid: string; name: string }) => {
    if (!modalNodeId) return
    updateNode(modalNodeId, {
      configId: config.uuid,
      name: config.name,
      label: config.name,
    })
    closeModal()
  }

  const handleDelete = async (config: AgentSkillListItem) => {
    if (!window.confirm(`Delete "${config.name}"?`)) return
    setDeletingId(config.uuid)
    try {
      await deleteConfig.mutateAsync(config.uuid)
      for (const node of nodes) {
        if (node.type === 'agentSkill' && node.data.configId === config.uuid) {
          updateNode(node.id, {
            configId: undefined,
            name: undefined,
            label: 'Agent Skill',
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
          ? 'New Agent Skill'
          : mode === 'edit'
            ? 'Edit Agent Skill'
            : 'Agent Skill'
      }
      subtitle={mode === 'pick' ? 'Select skill' : 'A2A discovery skill'}
      bodyClassName="overflow-y-auto"
      showBackdrop={!expandedStackId}
    >
      {mode === 'create' ? (
        <CreateAgentSkillForm
          onSaved={(config) => handleSelect(config)}
          onCancel={() => setMode('pick')}
        />
      ) : mode === 'edit' && editingId ? (
        isLoadingEdit ? (
          <div className="flex justify-center py-10 text-panel-muted">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : isEditError || !editingConfig ? (
          <p className="text-xs text-destructive">Could not load skill.</p>
        ) : (
          <CreateAgentSkillForm
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
                onClick={() => handleSelect(config)}
                className={cn(
                  'flex size-full flex-col items-center justify-center gap-2 rounded-2xl border p-3',
                  selectedId === config.uuid
                    ? 'border-connector bg-connector/10'
                    : 'border-panel-border bg-node/40',
                )}
              >
                <Sparkles className="size-5 text-connector" />
                <p className="w-full truncate text-xs font-semibold">
                  {config.name}
                </p>
              </button>
            </div>
          ))}
        </div>
      )}
    </InspectorPanel>
  )
}
