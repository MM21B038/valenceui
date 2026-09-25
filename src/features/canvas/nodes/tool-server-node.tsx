import { type NodeProps } from '@xyflow/react'
import { Server } from 'lucide-react'

import { usePaintMode } from '@/components/theme/paint-mode-provider'
import { useTheme } from '@/components/theme/theme-provider'
import { NodeHoverActions } from '@/features/canvas/nodes/node-hover-actions'
import { NodePorts } from '@/features/canvas/nodes/node-ports'
import { formatTransportLabel, type ToolServerNodeData } from '@/lib/types/mcp-server-config'
import {
  componentHexRingStyle,
  componentIconGradientStyle,
  componentSurfaceStyle,
  componentVar,
} from '@/lib/theme/component-block-styles'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

export function ToolServerNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ToolServerNodeData
  const openToolServerModal = useWorkflowStore((state) => state.openToolServerModal)
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const removeNode = useWorkflowStore((state) => state.removeNode)

  const { componentGradients } = useTheme()
  const { isPaintMode, hoverTarget, applyToComponent } = usePaintMode()
  const hasPaint = Boolean(componentGradients.toolServer)
  const hasConfig = Boolean(nodeData.configId && nodeData.name)

  const handleOpenConfig = () => {
    if (isPaintMode) {
      applyToComponent('toolServer')
      return
    }
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
        data-paint-target="toolServer"
        onClick={handleOpenConfig}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleOpenConfig()
          }
        }}
        className={cn(
          'paint-mode-target relative z-10 flex size-full flex-col items-center justify-center gap-1.5 p-2 text-center transition-all duration-150',
          isPaintMode && 'paint-mode-armed',
          hoverTarget === 'toolServer' && 'paint-drop-target',
        )}
      >
        <div
          className="absolute inset-0 node-shape-hex transition-all duration-150"
          style={componentHexRingStyle('toolServer', { selected, hasPaint })}
          aria-hidden
        />
        <div
          className="absolute inset-[2.5px] node-shape-hex shadow-md transition-all duration-150"
          style={componentSurfaceStyle('toolServer')}
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center gap-1.5">
          <div
            className="flex size-10 items-center justify-center rounded-lg shadow-sm"
            style={componentIconGradientStyle('toolServer')}
          >
            <Server className="size-[18px]" />
          </div>

          <div className="w-full min-w-0 px-3">
            {hasConfig ? (
              <>
                <p
                  className="truncate text-[11px] font-semibold leading-tight"
                  style={{ color: componentVar('toolServer', 'foreground') }}
                >
                  {nodeData.name}
                </p>
                <p
                  className="mt-0.5 truncate text-[9px]"
                  style={{ color: componentVar('toolServer', 'muted') }}
                >
                  {formatTransportLabel(nodeData.transport ?? '')}
                </p>
              </>
            ) : (
              <>
                <p
                  className="truncate text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: componentVar('toolServer', 'label') }}
                >
                  Tool Server
                </p>
                <p
                  className="mt-0.5 text-[8px] leading-tight"
                  style={{ color: componentVar('toolServer', 'muted') }}
                >
                  {isPaintMode ? 'Drop to paint' : 'Tap to configure'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
