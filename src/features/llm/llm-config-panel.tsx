import { BrainCircuit, Loader2, MessageSquare, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { InspectorPanel } from '@/components/layout/inspector-panel'
import { CreateLlmConfigForm } from '@/features/llm/create-llm-config-form'
import { LlmChat } from '@/features/llm/llm-chat'
import { useDeleteLlmConfig, useLlmConfigs } from '@/lib/api/llm-config'
import { formatProviderLabel, type LlmConfig } from '@/lib/types/llm-config'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

const PANEL_WIDTH = 260

type PanelMode = 'pick' | 'create' | 'edit'
type PanelTab = 'chat' | 'model'

function PanelTabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors',
        active
          ? 'bg-node text-panel-inspector-fg shadow-sm'
          : 'text-panel-muted hover:bg-node/60 hover:text-panel-inspector-fg',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
      )}
    >
      {children}
    </button>
  )
}

function ConfigCard({
  config,
  selected,
  isDeleting,
  onSelect,
  onEdit,
  onDelete,
}: {
  config: LlmConfig
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
          className="flex size-5 items-center justify-center rounded-md border border-border bg-background text-panel-inspector-fg shadow-sm hover:border-connector hover:bg-node-header"
          aria-label={`Edit ${config.model}`}
        >
          <Pencil className="size-2.5" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          disabled={isDeleting}
          className="flex size-5 items-center justify-center rounded-md border border-border bg-background text-destructive shadow-sm hover:border-destructive hover:bg-destructive hover:text-white disabled:opacity-50"
          aria-label={`Delete ${config.model}`}
        >
          {isDeleting ? (
            <Loader2 className="size-2.5 animate-spin" />
          ) : (
            <Trash2 className="size-2.5" />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onSelect}
        title={config.base_url ?? formatProviderLabel(config.provider)}
        className={cn(
          'flex size-full flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-center transition-all',
          selected
            ? 'border-connector bg-node-header ring-2 ring-connector/25'
            : 'border-panel-border bg-node hover:border-connector/50 hover:shadow-sm',
        )}
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-connector/90 to-interactive text-node-icon-fg shadow-sm">
          <BrainCircuit className="size-3.5" />
        </div>
        <p className="w-full truncate px-0.5 text-[10px] font-semibold leading-tight text-node-fg">
          {config.model}
        </p>
        <p className="w-full truncate px-0.5 text-[9px] leading-tight text-panel-muted">
          {formatProviderLabel(config.provider)}
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
      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-connector/50 bg-node-header/40 p-2 text-panel-muted transition-colors hover:border-connector hover:bg-node-header hover:text-panel-inspector-fg"
    >
      <div className="flex size-8 items-center justify-center rounded-xl border border-connector/30 bg-node">
        <Plus className="size-4 text-connector" />
      </div>
      <span className="text-[10px] font-medium leading-tight">Add new</span>
    </button>
  )
}

export function LlmConfigPanel() {
  const llmModalNodeId = useWorkflowStore((state) => state.llmModalNodeId)
  const closeLlmModal = useWorkflowStore((state) => state.closeLlmModal)
  const updateLlmNode = useWorkflowStore((state) => state.updateLlmNode)
  const nodes = useWorkflowStore((state) => state.nodes)

  const [mode, setMode] = useState<PanelMode>('pick')
  const [tab, setTab] = useState<PanelTab>('model')
  const [editingConfig, setEditingConfig] = useState<LlmConfig | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: configs = [], isLoading, isError } = useLlmConfigs()
  const deleteConfig = useDeleteLlmConfig()

  const isOpen = Boolean(llmModalNodeId)
  const activeNode = nodes.find((node) => node.id === llmModalNodeId)
  const nodeData = activeNode?.type === 'llm' ? activeNode.data : undefined
  const selectedId = nodeData?.configId
  const hasConfig = Boolean(selectedId && nodeData?.model)
  const showTabs = hasConfig && mode === 'pick'

  useEffect(() => {
    if (!isOpen) {
      setMode('pick')
      setTab('model')
      setEditingConfig(null)
      return
    }

    setTab(hasConfig ? 'chat' : 'model')
  }, [isOpen, hasConfig, llmModalNodeId])

  const syncNodesWithConfig = (config: LlmConfig) => {
    for (const node of nodes) {
      if (node.type === 'llm' && node.data.configId === config.uuid) {
        updateLlmNode(node.id, {
          provider: config.provider,
          model: config.model,
          baseUrl: config.base_url,
          label: config.model,
        })
      }
    }
  }

  const clearNodesUsingConfig = (configId: string) => {
    for (const node of nodes) {
      if (node.type === 'llm' && node.data.configId === configId) {
        updateLlmNode(node.id, {
          configId: undefined,
          provider: undefined,
          model: undefined,
          baseUrl: undefined,
          label: 'LLM',
        })
      }
    }
  }

  const handleSelect = (config: LlmConfig) => {
    if (!llmModalNodeId) return

    updateLlmNode(llmModalNodeId, {
      configId: config.uuid,
      provider: config.provider,
      model: config.model,
      baseUrl: config.base_url,
      label: config.model,
    })
    setMode('pick')
    setTab('chat')
  }

  const handleDelete = async (config: LlmConfig) => {
    const confirmed = window.confirm(
      `Delete "${config.model}"? Nodes using it will be cleared.`,
    )
    if (!confirmed) return

    setDeletingId(config.uuid)

    try {
      await deleteConfig.mutateAsync(config.uuid)
      clearNodesUsingConfig(config.uuid)

      if (selectedId === config.uuid) {
        setTab('model')
      }

      if (editingConfig?.uuid === config.uuid) {
        setEditingConfig(null)
        setMode('pick')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const panelTitle =
    tab === 'chat' && hasConfig && mode === 'pick'
      ? 'Valence Chat'
      : mode === 'create'
        ? 'New LLM'
        : mode === 'edit'
          ? 'Edit LLM'
          : 'LLM'
  const panelSubtitle =
    tab === 'chat' && hasConfig && mode === 'pick'
      ? nodeData?.model ?? 'Chat with your model'
      : mode === 'create'
        ? 'Add endpoint'
        : mode === 'edit'
          ? 'Update endpoint'
          : hasConfig
            ? 'Chat or change model'
            : 'Select a model'

  return (
    <InspectorPanel
      isOpen={isOpen}
      onClose={closeLlmModal}
      title={panelTitle}
      subtitle={panelSubtitle}
      width={PANEL_WIDTH}
      bodyClassName={cn(
        tab === 'chat' && hasConfig && mode === 'pick'
          ? 'flex flex-col overflow-hidden'
          : 'overflow-y-auto',
      )}
      headerExtra={
        showTabs ? (
          <div className="mt-2 flex gap-1 rounded-xl bg-panel-border/30 p-1">
            <PanelTabButton active={tab === 'chat'} onClick={() => setTab('chat')}>
              <MessageSquare className="size-3" />
              Chat
            </PanelTabButton>
            <PanelTabButton active={tab === 'model'} onClick={() => setTab('model')}>
              <Settings2 className="size-3" />
              Model
            </PanelTabButton>
          </div>
        ) : null
      }
    >
          {tab === 'chat' && hasConfig && mode === 'pick' && selectedId ? (
            <LlmChat
              nodeId={llmModalNodeId!}
              configId={selectedId}
              modelName={nodeData?.model}
            />
          ) : mode === 'create' ? (
            <CreateLlmConfigForm
              compact
              onSaved={(config) => handleSelect(config)}
              onCancel={() => setMode('pick')}
            />
          ) : mode === 'edit' && editingConfig ? (
            <CreateLlmConfigForm
              compact
              initialConfig={editingConfig}
              onSaved={(config) => {
                syncNodesWithConfig(config)
                setEditingConfig(null)
                setMode('pick')
                setTab('chat')
              }}
              onCancel={() => {
                setEditingConfig(null)
                setMode('pick')
              }}
            />
          ) : isLoading ? (
            <div className="flex items-center justify-center py-10 text-panel-muted">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : isError ? (
            <p className="px-1 py-2 text-[10px] leading-snug text-destructive">
              API unreachable. Is Django running on port 8000?
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <AddConfigCard onClick={() => setMode('create')} />
              {configs.map((config) => (
                <ConfigCard
                  key={config.uuid}
                  config={config}
                  selected={selectedId === config.uuid}
                  isDeleting={deletingId === config.uuid}
                  onSelect={() => handleSelect(config)}
                  onEdit={() => {
                    setEditingConfig(config)
                    setMode('edit')
                  }}
                  onDelete={() => handleDelete(config)}
                />
              ))}
            </div>
          )}

      {mode === 'pick' && tab === 'model' && configs.length === 0 && !isLoading && !isError && (
        <p className="mt-2 px-1 text-center text-[10px] text-panel-muted">
          Tap + to add your first model.
        </p>
      )}
    </InspectorPanel>
  )
}
