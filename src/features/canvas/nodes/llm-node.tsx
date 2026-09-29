import { type NodeProps } from '@xyflow/react'
import { Bot, BrainCircuit, Server } from 'lucide-react'

import { usePaintMode } from '@/components/theme/paint-mode-provider'
import { useTheme } from '@/components/theme/theme-provider'
import { NodeHoverActions } from '@/features/canvas/nodes/node-hover-actions'
import {
  FixedRolePorts,
  RoleBadge,
  useFixedPortState,
} from '@/features/canvas/nodes/fixed-role-ports'
import {
  LLM_PORTS,
  usesExecutorOwnedServer,
} from '@/lib/canvas/connection-rules'
import type { LlmNodeData } from '@/lib/types/llm-config'
import {
  componentBlockChromeStyle,
  componentIconGradientStyle,
  componentVar,
} from '@/lib/theme/component-block-styles'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

/** LLM pill — Server left, Executor right (same pattern as Thread Config). */
export function LlmNode({ id, data, selected }: NodeProps) {
  const nodeData = data as LlmNodeData
  const openLlmModal = useWorkflowStore((state) => state.openLlmModal)
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const removeNode = useWorkflowStore((state) => state.removeNode)
  const edges = useWorkflowStore((state) => state.edges)
  const nodes = useWorkflowStore((state) => state.nodes)

  const { componentGradients } = useTheme()
  const { isPaintMode, hoverTarget, applyToComponent } = usePaintMode()
  const ports = useFixedPortState(
    id,
    LLM_PORTS.map((port) => port.id),
  )
  const serverOwnedByExecutor = usesExecutorOwnedServer(id, edges, nodes)
  const visiblePorts = serverOwnedByExecutor
    ? LLM_PORTS.filter((port) => port.id !== 'port-server')
    : LLM_PORTS
  const hasPaint = Boolean(componentGradients.llm)
  const hasConfig = Boolean(nodeData.configId && nodeData.model)

  const handleOpenConfig = () => {
    if (isPaintMode) {
      applyToComponent('llm')
      return
    }
    openLlmModal(id)
  }

  return (
    <div className="group/node relative h-[72px] w-[240px]">
      <div className="absolute -inset-8 z-0" aria-hidden />

      <FixedRolePorts nodeId={id} ports={visiblePorts} />

      <NodeHoverActions
        onDuplicate={(event) => {
          event.stopPropagation()
          duplicateNode(id)
        }}
        onRemove={(event) => {
          event.stopPropagation()
          removeNode(id)
        }}
      />

      <div
        role="button"
        tabIndex={0}
        data-paint-target="llm"
        onClick={handleOpenConfig}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleOpenConfig()
          }
        }}
        style={componentBlockChromeStyle('llm', {
          selected: Boolean(selected),
          hasPaint,
        })}
        className={cn(
          'paint-mode-target relative z-10 flex size-full items-center gap-1.5 overflow-hidden rounded-[1.75rem] px-3.5 py-2 shadow-md transition-all duration-150',
          !hasPaint && !selected && 'border-2',
          !selected && 'hover:opacity-95',
          isPaintMode && 'paint-mode-armed',
          hoverTarget === 'llm' && 'paint-drop-target',
        )}
      >
        <RoleBadge
          label="Server"
          active={Boolean(ports['port-server']) || serverOwnedByExecutor}
          title={
            serverOwnedByExecutor ? 'Server (via Executor)' : 'Server'
          }
        >
          <Server className="size-3.5" strokeWidth={2.25} />
        </RoleBadge>

        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-xl shadow-sm"
          style={componentIconGradientStyle('llm')}
        >
          <BrainCircuit className="size-3.5" />
        </div>

        <div className="min-w-0 flex-1 text-left">
          {hasConfig ? (
            <>
              <p
                className="truncate text-[9px] font-bold uppercase tracking-widest"
                style={{ color: componentVar('llm', 'label') }}
              >
                LLM
              </p>
              <p
                className="truncate text-[12px] font-semibold leading-tight"
                style={{ color: componentVar('llm', 'foreground') }}
              >
                {nodeData.model}
              </p>
            </>
          ) : (
            <>
              <p
                className="truncate text-[10px] font-bold uppercase tracking-widest"
                style={{ color: componentVar('llm', 'label') }}
              >
                LLM
              </p>
              <p
                className="truncate text-[9px] leading-tight"
                style={{ color: componentVar('llm', 'muted') }}
              >
                {isPaintMode ? 'Drop to paint' : 'Server · Executor'}
              </p>
            </>
          )}
        </div>

        <RoleBadge
          label="Executor"
          active={Boolean(ports['port-executor'])}
        >
          <Bot className="size-3.5" strokeWidth={2.25} />
        </RoleBadge>
      </div>
    </div>
  )
}
