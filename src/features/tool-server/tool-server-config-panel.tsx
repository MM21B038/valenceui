import { Loader2, Pencil, Plus, Server, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { InspectorPanel } from '@/components/layout/inspector-panel'
import { useTheme } from '@/components/theme/theme-provider'
import { CreateToolServerConfigForm } from '@/features/tool-server/create-tool-server-config-form'
import {
  useDeleteMcpServerConfig,
  useMcpServerConfig,
  useMcpServerConfigs,
} from '@/lib/api/mcp-server-config'
import {
  formatTransportLabel,
  type McpServerConfigListItem,
} from '@/lib/types/mcp-server-config'
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

function ConfigCard({
  config,
  selected,
  isDeleting,
  onSelect,
  onEdit,
  onDelete,
}: {
  config: McpServerConfigListItem
  selected: boolean
  isDeleting: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { componentGradients } = useTheme()
  const hasPaint = Boolean(componentGradients.toolServer)

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
          'flex size-full flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center transition-all hover:shadow-sm @md/inspector:gap-2.5 @md/inspector:p-4',
          !hasPaint && 'border',
        )}
        style={{
          ...(selected
            ? componentSurfaceHoverStyle('toolServer')
            : componentSurfaceStyle('toolServer')),
          ...(selected || hasPaint
            ? componentPaintBorderStyle('toolServer')
            : componentBorderMutedStyle('toolServer')),
          ...(selected
            ? {
                boxShadow: `0 0 0 2px color-mix(in oklch, ${componentVar('toolServer', 'ring')} 100%, transparent)`,
              }
            : {}),
        }}
      >
        <div
          className="flex size-11 items-center justify-center rounded-2xl shadow-sm @md/inspector:size-14"
          style={componentIconGradientStyle('toolServer')}
        >
          <Server className="size-5 @md/inspector:size-6" />
        </div>
        <p
          className="w-full truncate px-1 text-xs font-semibold leading-tight @md/inspector:text-sm"
          style={{ color: componentVar('toolServer', 'foreground') }}
        >
          {config.name}
        </p>
        <p
          className="w-full truncate px-1 text-[11px] leading-tight @md/inspector:text-xs"
          style={{ color: componentVar('toolServer', 'muted') }}
        >
          {formatTransportLabel(config.transport)}
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
        ...componentSurfaceHoverStyle('toolServer'),
        ...componentBorderMutedStyle('toolServer'),
        color: componentVar('toolServer', 'muted'),
        opacity: 0.8,
      }}
    >
      <div
        className="flex size-11 items-center justify-center rounded-xl border @md/inspector:size-14"
        style={{
          ...componentSurfaceStyle('toolServer'),
          ...componentBorderMutedStyle('toolServer'),
        }}
      >
        <Plus
          className="size-5 @md/inspector:size-6"
          style={{ color: componentVar('toolServer', 'label') }}
        />
      </div>
      <span className="text-xs font-medium leading-tight @md/inspector:text-sm">Add new</span>
    </button>
  )
}

export function ToolServerConfigPanel() {
  const toolServerModalNodeId = useWorkflowStore(
    (state) => state.toolServerModalNodeId,
  )
  const expandedStackId = useWorkflowStore((state) => state.expandedStackId)
  const closeToolServerModal = useWorkflowStore((state) => state.closeToolServerModal)
  const updateToolServerNode = useWorkflowStore((state) => state.updateToolServerNode)
  const nodes = useWorkflowStore((state) => state.nodes)

  const [mode, setMode] = useState<PanelMode>('pick')
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: configs = [], isLoading, isError } = useMcpServerConfigs()
  const { data: editingConfig, isLoading: isLoadingEditConfig } =
    useMcpServerConfig(editingConfigId ?? '')
  const deleteConfig = useDeleteMcpServerConfig()

  const isOpen = Boolean(toolServerModalNodeId)
  const activeNode = nodes.find((node) => node.id === toolServerModalNodeId)
  const selectedId =
    activeNode?.type === 'toolServer' ? activeNode.data.configId : undefined

  useEffect(() => {
    if (!isOpen) {
      setMode('pick')
      setEditingConfigId(null)
    }
  }, [isOpen])

  const syncNodesWithConfig = (config: {
    uuid: string
    name: string
    transport: string
  }) => {
    for (const node of nodes) {
      if (node.type === 'toolServer' && node.data.configId === config.uuid) {
        updateToolServerNode(node.id, {
          name: config.name,
          transport: config.transport,
          label: config.name,
        })
      }
    }
  }

  const clearNodesUsingConfig = (configId: string) => {
    for (const node of nodes) {
      if (node.type === 'toolServer' && node.data.configId === configId) {
        updateToolServerNode(node.id, {
          configId: undefined,
          name: undefined,
          transport: undefined,
          label: 'Tool Server',
        })
      }
    }
  }

  const handleSelect = (config: McpServerConfigListItem) => {
    if (!toolServerModalNodeId) return

    updateToolServerNode(toolServerModalNodeId, {
      configId: config.uuid,
      name: config.name,
      transport: config.transport,
      label: config.name,
    })
    closeToolServerModal()
  }

  const handleDelete = async (config: McpServerConfigListItem) => {
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
      ? 'New Tool Server'
      : mode === 'edit'
        ? 'Edit Tool Server'
        : 'Tool Server'
  const panelSubtitle =
    mode === 'create'
      ? 'Add MCP server'
      : mode === 'edit'
        ? 'Update MCP server'
        : 'Select server'

  return (
    <InspectorPanel
      isOpen={isOpen}
      onClose={closeToolServerModal}
      title={panelTitle}
      subtitle={panelSubtitle}
      bodyClassName="overflow-y-auto"
      showBackdrop={!expandedStackId}
    >
          {mode === 'create' ? (
            <CreateToolServerConfigForm
              onSaved={(config) => handleSelect(config)}
              onCancel={() => setMode('pick')}
            />
          ) : mode === 'edit' && editingConfigId ? (
            isLoadingEditConfig || !editingConfig ? (
              <div className="flex items-center justify-center py-10 text-panel-muted">
                <Loader2 className="size-4 animate-spin" />
              </div>
            ) : (
              <CreateToolServerConfigForm
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
          Tap + to add your first MCP server.
        </p>
      )}
    </InspectorPanel>
  )
}
