import { Loader2, MessagesSquare, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { InspectorPanel } from '@/components/layout/inspector-panel'
import { CreateThreadConfigForm } from '@/features/thread-config/create-thread-config-form'
import {
  useDeleteThreadConfig,
  useThreadConfig,
  useThreadConfigs,
} from '@/lib/api/thread-config'
import type {
  ThreadConfig,
  ThreadConfigListItem,
} from '@/lib/types/thread-config'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

type PanelMode = 'pick' | 'create' | 'edit'

function ConfigCard({
  config,
  selected,
  isDeleting,
  onSelect,
  onEdit,
  onDelete,
}: {
  config: ThreadConfigListItem
  selected: boolean
  isDeleting: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group/card relative aspect-square w-full">
      <div
        className={cn(
          'absolute -top-1 -right-1 z-20 flex gap-0.5 transition-opacity duration-150',
          'pointer-events-none opacity-0 group-hover/card:pointer-events-auto group-hover/card:opacity-100',
        )}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onEdit()
          }}
          className="flex size-7 items-center justify-center rounded-md border border-border bg-background text-panel-inspector-fg shadow-sm hover:border-connector hover:bg-node-header"
          aria-label={`Edit ${config.name}`}
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          disabled={isDeleting}
          className="flex size-7 items-center justify-center rounded-md border border-border bg-background text-destructive shadow-sm hover:border-destructive hover:bg-destructive hover:text-white disabled:opacity-50"
          aria-label={`Delete ${config.name}`}
        >
          {isDeleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onSelect}
        title={config.name}
        className={cn(
          'flex size-full flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all @md/inspector:gap-2.5 @md/inspector:p-4',
          selected
            ? 'border-connector bg-node-header ring-2 ring-connector/25'
            : 'border-panel-border bg-node hover:border-connector/50 hover:shadow-sm',
        )}
      >
        <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-interactive/90 to-connector text-node-icon-fg shadow-sm @md/inspector:size-14">
          <MessagesSquare className="size-5 @md/inspector:size-6" />
        </div>
        <p className="w-full truncate px-1 text-xs font-semibold leading-tight text-node-fg @md/inspector:text-sm">
          {config.name}
        </p>
        <p className="w-full truncate px-1 text-[11px] leading-tight text-panel-muted @md/inspector:text-xs">
          Thread config
        </p>
      </button>
    </div>
  )
}

function AddConfigCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-connector/50 bg-node-header/40 p-3 text-panel-muted transition-colors hover:border-connector hover:bg-node-header hover:text-panel-inspector-fg @md/inspector:gap-2.5 @md/inspector:p-4"
    >
      <div className="flex size-11 items-center justify-center rounded-xl border border-connector/30 bg-node @md/inspector:size-14">
        <Plus className="size-5 text-connector @md/inspector:size-6" />
      </div>
      <span className="text-xs font-medium leading-tight @md/inspector:text-sm">
        Add new
      </span>
    </button>
  )
}

export function ThreadConfigPanel() {
  const threadConfigModalNodeId = useWorkflowStore(
    (state) => state.threadConfigModalNodeId,
  )
  const closeThreadConfigModal = useWorkflowStore(
    (state) => state.closeThreadConfigModal,
  )
  const updateThreadConfigNode = useWorkflowStore(
    (state) => state.updateThreadConfigNode,
  )
  const nodes = useWorkflowStore((state) => state.nodes)

  const [mode, setMode] = useState<PanelMode>('pick')
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: configs = [], isLoading, isError } = useThreadConfigs()
  const { data: editingConfig, isLoading: isLoadingEditConfig } =
    useThreadConfig(editingConfigId ?? '')
  const deleteConfig = useDeleteThreadConfig()

  const isOpen = Boolean(threadConfigModalNodeId)
  const activeNode = nodes.find((node) => node.id === threadConfigModalNodeId)
  const selectedId =
    activeNode?.type === 'threadConfig' ? activeNode.data.configId : undefined

  useEffect(() => {
    if (!isOpen) {
      setMode('pick')
      setEditingConfigId(null)
    }
  }, [isOpen])

  const syncNodesWithConfig = (config: ThreadConfig) => {
    for (const node of nodes) {
      if (node.type === 'threadConfig' && node.data.configId === config.uuid) {
        updateThreadConfigNode(node.id, {
          name: config.name,
          label: config.name,
        })
      }
    }
  }

  const clearNodesUsingConfig = (configId: string) => {
    for (const node of nodes) {
      if (node.type === 'threadConfig' && node.data.configId === configId) {
        updateThreadConfigNode(node.id, {
          configId: undefined,
          name: undefined,
          label: 'Thread Config',
        })
      }
    }
  }

  const handleSelect = (config: ThreadConfigListItem | ThreadConfig) => {
    if (!threadConfigModalNodeId) return

    updateThreadConfigNode(threadConfigModalNodeId, {
      configId: config.uuid,
      name: config.name,
      label: config.name,
    })
    closeThreadConfigModal()
  }

  const handleDelete = async (config: ThreadConfigListItem) => {
    const confirmed = window.confirm(
      `Delete "${config.name}"? Nodes using it will be cleared.`,
    )
    if (!confirmed) return

    setDeletingId(config.uuid)
    try {
      await deleteConfig.mutateAsync(config.uuid)
      clearNodesUsingConfig(config.uuid)

      if (editingConfigId === config.uuid) {
        setEditingConfigId(null)
        setMode('pick')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const panelTitle =
    mode === 'create'
      ? 'New Thread Config'
      : mode === 'edit'
        ? 'Edit Thread Config'
        : 'Thread Config'
  const panelSubtitle =
    mode === 'create'
      ? 'Prompts, limits & hide rules'
      : mode === 'edit'
        ? 'Update thread settings'
        : 'Select a configuration'

  return (
    <InspectorPanel
      isOpen={isOpen}
      onClose={closeThreadConfigModal}
      title={panelTitle}
      subtitle={panelSubtitle}
      bodyClassName="overflow-y-auto"
    >
      {mode === 'create' ? (
        <CreateThreadConfigForm
          onSaved={(config) => handleSelect(config)}
          onCancel={() => setMode('pick')}
        />
      ) : mode === 'edit' && editingConfigId ? (
        isLoadingEditConfig || !editingConfig ? (
          <div className="flex items-center justify-center py-10 text-panel-muted">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : (
          <CreateThreadConfigForm
            initialConfig={editingConfig}
            onSaved={(config) => {
              syncNodesWithConfig(config)
              setEditingConfigId(null)
              setMode('pick')
            }}
            onCancel={() => {
              setEditingConfigId(null)
              setMode('pick')
            }}
          />
        )
      ) : isLoading ? (
        <div className="flex items-center justify-center py-10 text-panel-muted">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : isError ? (
        <p className="px-1 py-2 text-xs leading-snug text-destructive @md/inspector:text-sm">
          API unreachable. Is Django running on port 8000?
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 @md/inspector:gap-4">
          <AddConfigCard onClick={() => setMode('create')} />
          {configs.map((config) => (
            <ConfigCard
              key={config.uuid}
              config={config}
              selected={selectedId === config.uuid}
              isDeleting={deletingId === config.uuid}
              onSelect={() => handleSelect(config)}
              onEdit={() => {
                setEditingConfigId(config.uuid)
                setMode('edit')
              }}
              onDelete={() => handleDelete(config)}
            />
          ))}
        </div>
      )}

      {mode === 'pick' && configs.length === 0 && !isLoading && !isError && (
        <p className="mt-3 px-1 text-center text-xs text-panel-muted @md/inspector:text-sm">
          Tap + to add your first thread config.
        </p>
      )}
    </InspectorPanel>
  )
}
