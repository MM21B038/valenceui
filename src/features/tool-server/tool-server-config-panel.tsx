import { Loader2, Pencil, Plus, Server, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { InspectorPanel } from '@/components/layout/inspector-panel'
import { CreateToolServerConfigForm } from '@/features/tool-server/create-tool-server-config-form'
import {
  useDeleteMcpServerConfig,
  useMcpServerConfig,
  useMcpServerConfigs,
} from '@/lib/api/mcp-server-config'
import { TOOL_SERVER_PANEL_WIDTH } from '@/lib/layout/inspector-layout'
import {
  formatTransportLabel,
  type McpServerConfigListItem,
} from '@/lib/types/mcp-server-config'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

const PANEL_WIDTH = TOOL_SERVER_PANEL_WIDTH

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
          aria-label={`Edit ${config.name}`}
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
          aria-label={`Delete ${config.name}`}
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
        title={config.name}
        className={cn(
          'flex size-full flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-center transition-all',
          selected
            ? 'border-connector bg-node-header ring-2 ring-connector/25'
            : 'border-panel-border bg-node hover:border-connector/50 hover:shadow-sm',
        )}
      >
        <div className="flex size-8 items-center justify-center rounded-2xl bg-gradient-to-br from-interactive/90 to-connector text-node-icon-fg shadow-sm">
          <Server className="size-3.5" />
        </div>
        <p className="w-full truncate px-0.5 text-[10px] font-semibold leading-tight text-node-fg">
          {config.name}
        </p>
        <p className="w-full truncate px-0.5 text-[9px] leading-tight text-panel-muted">
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
      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-connector/50 bg-node-header/40 p-2 text-panel-muted transition-colors hover:border-connector hover:bg-node-header hover:text-panel-inspector-fg"
    >
      <div className="flex size-8 items-center justify-center rounded-xl border border-connector/30 bg-node">
        <Plus className="size-4 text-connector" />
      </div>
      <span className="text-[10px] font-medium leading-tight">Add new</span>
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
      width={PANEL_WIDTH}
      bodyClassName="overflow-y-auto"
      showBackdrop={!expandedStackId}
    >
          {mode === 'create' ? (
            <CreateToolServerConfigForm
              compact
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
                compact
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
                    setEditingConfigId(config.uuid)
                    setMode('edit')
                  }}
                  onDelete={() => handleDelete(config)}
                />
              ))}
            </div>
          )}

      {mode === 'pick' && configs.length === 0 && !isLoading && !isError && (
        <p className="mt-2 px-1 text-center text-[10px] text-panel-muted">
          Tap + to add your first MCP server.
        </p>
      )}
    </InspectorPanel>
  )
}
