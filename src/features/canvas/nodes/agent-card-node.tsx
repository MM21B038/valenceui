import { type NodeProps } from '@xyflow/react'
import { Bot, CreditCard, Network, Sparkles } from 'lucide-react'

import { usePaintMode } from '@/components/theme/paint-mode-provider'
import { useTheme } from '@/components/theme/theme-provider'
import { NodeHoverActions } from '@/features/canvas/nodes/node-hover-actions'
import {
  FixedRolePorts,
  RoleBadge,
  useFixedPortState,
} from '@/features/canvas/nodes/fixed-role-ports'
import { AGENT_CARD_PORTS } from '@/lib/canvas/connection-rules'
import type { AgentCardNodeData } from '@/lib/types/agent-card'
import {
  componentBlockChromeStyle,
  componentIconGradientStyle,
  componentVar,
} from '@/lib/theme/component-block-styles'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

/** Agent Card — Interfaces left, Skills right, Executor bottom. */
export function AgentCardNode({ id, data, selected }: NodeProps) {
  const nodeData = data as AgentCardNodeData
  const openModal = useWorkflowStore((state) => state.openAgentCardModal)
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const removeNode = useWorkflowStore((state) => state.removeNode)

  const { componentGradients } = useTheme()
  const { isPaintMode, hoverTarget, applyToComponent } = usePaintMode()
  const ports = useFixedPortState(
    id,
    AGENT_CARD_PORTS.map((port) => port.id),
  )
  const hasPaint = Boolean(componentGradients.agentCard)
  const hasConfig = Boolean(nodeData.configId && nodeData.name)
  const compositionLinked =
    Boolean(ports['port-skills']) || Boolean(ports['port-interfaces'])

  const handleOpen = () => {
    if (isPaintMode) {
      applyToComponent('agentCard')
      return
    }
    openModal(id)
  }

  return (
    <div className="group/node relative h-[128px] w-[210px]">
      <div className="absolute -inset-10 z-0" aria-hidden />

      <FixedRolePorts nodeId={id} ports={AGENT_CARD_PORTS} />

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
        data-paint-target="agentCard"
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleOpen()
          }
        }}
        style={componentBlockChromeStyle('agentCard', {
          selected: Boolean(selected),
          hasPaint,
        })}
        className={cn(
          'paint-mode-target relative z-10 grid size-full grid-cols-[auto_1fr_auto] grid-rows-[1fr_auto] gap-1.5 overflow-hidden rounded-[1.75rem] p-2.5 shadow-md transition-all duration-150',
          !hasPaint && !selected && 'border-2',
          !selected && 'hover:opacity-95',
          isPaintMode && 'paint-mode-armed',
          hoverTarget === 'agentCard' && 'paint-drop-target',
        )}
      >
        {/* Left: Interfaces */}
        <div className="col-start-1 row-start-1 flex items-center">
          <RoleBadge
            label="Interfaces"
            active={Boolean(ports['port-interfaces'])}
          >
            <Network className="size-3.5" strokeWidth={2.25} />
          </RoleBadge>
        </div>

        {/* Center */}
        <div className="col-start-2 row-start-1 flex min-w-0 flex-col items-center justify-center text-center">
          <div
            className="flex size-8 items-center justify-center rounded-xl shadow-sm"
            style={componentIconGradientStyle('agentCard')}
          >
            <CreditCard className="size-3.5" />
          </div>
          {hasConfig ? (
            <>
              <p
                className="mt-1 w-full truncate text-[11px] font-semibold leading-tight"
                style={{ color: componentVar('agentCard', 'foreground') }}
              >
                {nodeData.name}
              </p>
              {nodeData.version ? (
                <p
                  className="w-full truncate text-[8px]"
                  style={{ color: componentVar('agentCard', 'muted') }}
                >
                  {nodeData.version}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p
                className="mt-1 text-[9px] font-bold uppercase tracking-widest"
                style={{ color: componentVar('agentCard', 'label') }}
              >
                Agent Card
              </p>
              <p
                className="text-[8px] leading-tight"
                style={{ color: componentVar('agentCard', 'muted') }}
              >
                {isPaintMode
                  ? 'Drop to paint'
                  : compositionLinked
                    ? 'Wire to executor'
                    : 'Interfaces · Skills · Executor'}
              </p>
            </>
          )}
        </div>

        {/* Right: Skills */}
        <div className="col-start-3 row-start-1 flex items-center">
          <RoleBadge label="Skills" active={Boolean(ports['port-skills'])}>
            <Sparkles className="size-3.5" strokeWidth={2.25} />
          </RoleBadge>
        </div>

        {/* Bottom: Executor */}
        <div className="col-span-3 col-start-1 row-start-2 flex justify-center">
          <RoleBadge
            label="Executor"
            active={Boolean(ports['port-executor'])}
          >
            <Bot className="size-3.5" strokeWidth={2.25} />
          </RoleBadge>
        </div>
      </div>
    </div>
  )
}
