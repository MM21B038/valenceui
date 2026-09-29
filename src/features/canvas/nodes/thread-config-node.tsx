import { type NodeProps } from '@xyflow/react'
import { Bot, MessagesSquare, Server } from 'lucide-react'

import { usePaintMode } from '@/components/theme/paint-mode-provider'
import { useTheme } from '@/components/theme/theme-provider'
import { NodeHoverActions } from '@/features/canvas/nodes/node-hover-actions'
import { RoleBadge } from '@/features/canvas/nodes/fixed-role-ports'
import {
  ThreadConfigPorts,
  useThreadConfigPortState,
} from '@/features/canvas/nodes/thread-config-ports'
import type { ThreadConfigNodeData } from '@/lib/types/thread-config'
import {
  componentBlockChromeStyle,
  componentIconGradientStyle,
  componentVar,
} from '@/lib/theme/component-block-styles'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

export function ThreadConfigNode({ id, data, selected }: NodeProps) {
  const nodeData = data as ThreadConfigNodeData
  const openThreadConfigModal = useWorkflowStore(
    (state) => state.openThreadConfigModal,
  )
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const removeNode = useWorkflowStore((state) => state.removeNode)

  const { componentGradients } = useTheme()
  const { isPaintMode, hoverTarget, applyToComponent } = usePaintMode()
  const { agentConnected, serverConnected, serverOwnedByExecutor } =
    useThreadConfigPortState(id)
  const hasPaint = Boolean(componentGradients.threadConfig)
  const hasConfig = Boolean(nodeData.configId && nodeData.name)

  const handleOpenConfig = () => {
    if (isPaintMode) {
      applyToComponent('threadConfig')
      return
    }
    openThreadConfigModal(id)
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
    <div className="group/node relative h-[72px] w-[240px]">
      <div className="absolute -inset-8 z-0" aria-hidden />

      <ThreadConfigPorts
        nodeId={id}
        hideServer={serverOwnedByExecutor}
      />

      <NodeHoverActions
        onDuplicate={handleDuplicate}
        onRemove={handleRemove}
      />

      <div
        role="button"
        tabIndex={0}
        data-paint-target="threadConfig"
        onClick={handleOpenConfig}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleOpenConfig()
          }
        }}
        style={componentBlockChromeStyle('threadConfig', {
          selected: Boolean(selected),
          hasPaint,
        })}
        className={cn(
          'paint-mode-target relative z-10 flex size-full items-center gap-1.5 overflow-hidden rounded-[1.75rem] px-3.5 py-2 shadow-md transition-all duration-150',
          !hasPaint && !selected && 'border-2',
          !selected && 'hover:opacity-95',
          isPaintMode && 'paint-mode-armed',
          hoverTarget === 'threadConfig' && 'paint-drop-target',
        )}
      >
        <RoleBadge label="Executor" active={agentConnected}>
          <Bot className="size-3.5" strokeWidth={2.25} />
        </RoleBadge>

        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-xl shadow-sm"
          style={componentIconGradientStyle('threadConfig')}
        >
          <MessagesSquare className="size-3.5" />
        </div>

        <div className="min-w-0 flex-1 text-left">
          {hasConfig ? (
            <>
              <p
                className="truncate text-[9px] font-bold uppercase tracking-widest"
                style={{ color: componentVar('threadConfig', 'label') }}
              >
                Thread
              </p>
              <p
                className="truncate text-[12px] font-semibold leading-tight"
                style={{ color: componentVar('threadConfig', 'foreground') }}
              >
                {nodeData.name}
              </p>
            </>
          ) : (
            <>
              <p
                className="truncate text-[10px] font-bold uppercase tracking-widest"
                style={{ color: componentVar('threadConfig', 'label') }}
              >
                Thread Config
              </p>
              <p
                className="truncate text-[9px] leading-tight"
                style={{ color: componentVar('threadConfig', 'muted') }}
              >
                {isPaintMode ? 'Drop to paint' : 'Executor · Server'}
              </p>
            </>
          )}
        </div>

        <RoleBadge
          label="Server"
          active={serverConnected || serverOwnedByExecutor}
          title={
            serverOwnedByExecutor ? 'Server (via Executor)' : 'Server'
          }
        >
          <Server className="size-3.5" strokeWidth={2.25} />
        </RoleBadge>
      </div>
    </div>
  )
}
