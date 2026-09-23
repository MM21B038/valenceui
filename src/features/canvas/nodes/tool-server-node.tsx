import { type NodeProps } from '@xyflow/react'
import { Server } from 'lucide-react'

import { NodeHoverActions } from '@/features/canvas/nodes/node-hover-actions'
import { NodePorts } from '@/features/canvas/nodes/node-ports'
import { formatTransportLabel, type ToolServerNodeData } from '@/lib/types/mcp-server-config'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

export function ToolServerNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ToolServerNodeData
  const openToolServerModal = useWorkflowStore((state) => state.openToolServerModal)
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const removeNode = useWorkflowStore((state) => state.removeNode)

  const hasConfig = Boolean(nodeData.configId && nodeData.name)

  const handleOpenConfig = () => {
    openToolServerModal(id)
  }

  const handleDuplicate = (event: React.MouseEvent) => {
    event.stopPropagation()
    duplicateNode(id)
  }

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation()
    removeNode(id)
  }

  return (
    <div className="group/node relative h-[112px] w-[132px]">
      <div className="absolute -inset-8 z-0" aria-hidden />

      <NodePorts nodeId={id} />

      <NodeHoverActions
        onDuplicate={handleDuplicate}
        onRemove={handleRemove}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenConfig}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleOpenConfig()
          }
        }}
        className="relative z-10 flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 p-2 text-center transition-all duration-150"
      >
        <div
          className={cn(
            'absolute inset-0 node-shape-hex transition-all duration-150',
            selected ? 'bg-connector/70' : 'bg-connector/25',
          )}
          aria-hidden
        />
        <div
          className={cn(
            'absolute inset-[2px] node-shape-hex bg-node shadow-md transition-all duration-150',
            selected &&
              'shadow-[0_0_0_3px_color-mix(in_oklch,var(--connector)_28%,transparent),0_8px_20px_color-mix(in_oklch,var(--connector)_16%,transparent)]',
          )}
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center gap-1.5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-interactive/90 to-connector text-node-icon-fg shadow-sm">
            <Server className="size-[18px]" />
          </div>

          <div className="w-full min-w-0 px-3">
            {hasConfig ? (
              <>
                <p className="truncate text-[11px] font-semibold leading-tight text-node-fg">
                  {nodeData.name}
                </p>
                <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                  {formatTransportLabel(nodeData.transport ?? '')}
                </p>
              </>
            ) : (
              <>
                <p className="truncate text-[9px] font-bold uppercase tracking-widest text-connector">
                  Tool Server
                </p>
                <p className="mt-0.5 text-[8px] leading-tight text-muted-foreground">
                  Tap to configure
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
