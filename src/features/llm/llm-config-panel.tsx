import { BrainCircuit, Loader2, MessageSquare, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { InspectorPanel } from '@/components/layout/inspector-panel'
import { useTheme } from '@/components/theme/theme-provider'
import { CreateLlmConfigForm } from '@/features/llm/create-llm-config-form'
import { LlmChat } from '@/features/llm/llm-chat'
import { useDeleteLlmConfig, useLlmConfigs } from '@/lib/api/llm-config'
import { formatProviderLabel, type LlmConfig } from '@/lib/types/llm-config'
import { useWorkflowStore } from '@/stores/workflow-store'
import {
  componentBorderMutedStyle,
  componentPaintBorderStyle,
  componentIconGradientStyle,
  componentSurfaceHoverStyle,
  componentSurfaceStyle,
  componentVar,
} from '@/lib/theme/component-block-styles'
import { cn } from '@/lib/utils'

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
        'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors @md/inspector:text-sm',
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
  const { componentGradients } = useTheme()
  const hasPaint = Boolean(componentGradients.llm)

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
          aria-label={`Edit ${config.model}`}
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
          aria-label={`Delete ${config.model}`}
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
        title={config.base_url ?? formatProviderLabel(config.provider)}
        className={cn(
          'flex size-full flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center transition-all hover:shadow-sm @md/inspector:gap-2.5 @md/inspector:p-4',
          !hasPaint && 'border',
        )}
        style={{
          ...(selected ? componentSurfaceHoverStyle('llm') : componentSurfaceStyle('llm')),
          ...(selected || hasPaint
            ? componentPaintBorderStyle('llm')
            : componentBorderMutedStyle('llm')),
          ...(selected
            ? { boxShadow: `0 0 0 2px color-mix(in oklch, ${componentVar('llm', 'ring')} 100%, transparent)` }
            : {}),
        }}
      >
        <div
          className="flex size-11 items-center justify-center rounded-full shadow-sm @md/inspector:size-14"
          style={componentIconGradientStyle('llm')}
        >
          <BrainCircuit className="size-5 @md/inspector:size-6" />
        </div>
        <p
          className="w-full truncate px-1 text-xs font-semibold leading-tight @md/inspector:text-sm"
          style={{ color: componentVar('llm', 'foreground') }}
        >
          {config.model}
        </p>
        <p
          className="w-full truncate px-1 text-[11px] leading-tight @md/inspector:text-xs"
          style={{ color: componentVar('llm', 'muted') }}
        >
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
      className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-3 transition-colors @md/inspector:gap-2.5 @md/inspector:p-4"
      style={{
        ...componentSurfaceHoverStyle('llm'),
        ...componentBorderMutedStyle('llm'),
        color: componentVar('llm', 'muted'),
        opacity: 0.8,
      }}
    >
      <div
        className="flex size-11 items-center justify-center rounded-xl border @md/inspector:size-14"
        style={{
          ...componentSurfaceStyle('llm'),
          ...componentBorderMutedStyle('llm'),
        }}
      >
        <Plus
          className="size-5 @md/inspector:size-6"
          style={{ color: componentVar('llm', 'label') }}
        />
      </div>
      <span className="text-xs font-medium leading-tight @md/inspector:text-sm">Add new</span>
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
      bodyClassName={cn(
        tab === 'chat' && hasConfig && mode === 'pick'
          ? 'flex flex-col overflow-hidden'
          : 'overflow-y-auto',
      )}
      headerExtra={
        showTabs ? (
          <div className="mt-2 flex gap-1 rounded-xl bg-panel-border/30 p-1">
            <PanelTabButton active={tab === 'chat'} onClick={() => setTab('chat')}>
              <MessageSquare className="size-3.5 @md/inspector:size-4" />
              Chat
            </PanelTabButton>
            <PanelTabButton active={tab === 'model'} onClick={() => setTab('model')}>
              <Settings2 className="size-3.5 @md/inspector:size-4" />
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
              onSaved={(config) => handleSelect(config)}
              onCancel={() => setMode('pick')}
            />
          ) : mode === 'edit' && editingConfig ? (
            <CreateLlmConfigForm
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
                    setEditingConfig(config)
                    setMode('edit')
                  }}
                  onDelete={() => handleDelete(config)}
                />
              ))}
            </div>
          )}

      {mode === 'pick' && tab === 'model' && configs.length === 0 && !isLoading && !isError && (
        <p className="mt-3 px-1 text-center text-xs text-panel-muted @md/inspector:text-sm">
          Tap + to add your first model.
        </p>
      )}
    </InspectorPanel>
  )
}
