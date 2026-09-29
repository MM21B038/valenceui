import { type NodeProps } from '@xyflow/react'
import {
  Bot,
  BrainCircuit,
  CreditCard,
  MessagesSquare,
  Server,
} from 'lucide-react'

import { usePaintMode } from '@/components/theme/paint-mode-provider'
import { useTheme } from '@/components/theme/theme-provider'
import { NodeHoverActions } from '@/features/canvas/nodes/node-hover-actions'
import { NodePorts } from '@/features/canvas/nodes/node-ports'
import {
  FixedRolePorts,
  RoleBadge,
  useFixedPortState,
} from '@/features/canvas/nodes/fixed-role-ports'
import { AGENT_EXECUTOR_PORTS } from '@/lib/canvas/connection-rules'
import type { AgentExecutorNodeData } from '@/lib/types/agent-executor'
import {
  componentBlockChromeStyle,
  componentIconGradientStyle,
  componentVar,
} from '@/lib/theme/component-block-styles'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

/**
 * Agent Executor:
 * - agent-executor workspace → compass hub (LLM / Card / Thread / Server)
 * - a2a workspace → plain card + cardinal ports (no role badges)
 */
export function AgentExecutorNode({ id, data, selected }: NodeProps) {
  const nodeData = data as AgentExecutorNodeData
  const workspaceType = useWorkflowStore((state) => state.workspaceType)
  const openModal = useWorkflowStore((state) => state.openAgentExecutorModal)
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const removeNode = useWorkflowStore((state) => state.removeNode)

  const { componentGradients } = useTheme()
  const { isPaintMode, hoverTarget, applyToComponent } = usePaintMode()
  const ports = useFixedPortState(
    id,
    AGENT_EXECUTOR_PORTS.map((port) => port.id),
  )
  const hasPaint = Boolean(componentGradients.agentExecutor)
  const hasConfig = Boolean(nodeData.configId && nodeData.name)
  const isA2a = workspaceType === 'a2a'

  const handleOpen = () => {
    if (isPaintMode) {
      applyToComponent('agentExecutor')
      return
    }
    openModal(id)
  }

  if (isA2a) {
    return (
      <div className="group/node relative h-[88px] w-[200px]">
        <div className="absolute -inset-8 z-0" aria-hidden />

        <NodePorts nodeId={id} />

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
          data-paint-target="agentExecutor"
          onClick={handleOpen}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleOpen()
            }
          }}
          style={componentBlockChromeStyle('agentExecutor', {
            selected: Boolean(selected),
            hasPaint,
          })}
          className={cn(
            'paint-mode-target relative z-10 flex size-full items-center gap-2.5 overflow-hidden rounded-[1.75rem] px-3.5 py-2 shadow-md transition-all duration-150',
            !hasPaint && !selected && 'border-2',
            !selected && 'hover:opacity-95',
            isPaintMode && 'paint-mode-armed',
            hoverTarget === 'agentExecutor' && 'paint-drop-target',
          )}
        >
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm"
            style={componentIconGradientStyle('agentExecutor')}
          >
            <Bot className="size-4" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            {hasConfig ? (
              <>
                <p
                  className="truncate text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: componentVar('agentExecutor', 'label') }}
                >
                  Executor
                </p>
                <p
                  className="truncate text-[12px] font-semibold leading-tight"
                  style={{
                    color: componentVar('agentExecutor', 'foreground'),
                  }}
                >
                  {nodeData.name}
                </p>
                {nodeData.host && nodeData.port ? (
                  <p
                    className="truncate text-[9px]"
                    style={{ color: componentVar('agentExecutor', 'muted') }}
                  >
                    {nodeData.host}:{nodeData.port}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p
                  className="truncate text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: componentVar('agentExecutor', 'label') }}
                >
                  Agent Executor
                </p>
                <p
                  className="truncate text-[9px] leading-tight"
                  style={{ color: componentVar('agentExecutor', 'muted') }}
                >
                  {isPaintMode ? 'Drop to paint' : 'Click to bind'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group/node relative h-[168px] w-[220px]">
      <div className="absolute -inset-10 z-0" aria-hidden />

      <FixedRolePorts nodeId={id} ports={AGENT_EXECUTOR_PORTS} />

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
        data-paint-target="agentExecutor"
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleOpen()
          }
        }}
        style={componentBlockChromeStyle('agentExecutor', {
          selected: Boolean(selected),
          hasPaint,
        })}
        className={cn(
          'paint-mode-target relative z-10 grid size-full grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] gap-1.5 overflow-hidden rounded-[1.75rem] p-2.5 shadow-md transition-all duration-150',
          !hasPaint && !selected && 'border-2',
          !selected && 'hover:opacity-95',
          isPaintMode && 'paint-mode-armed',
          hoverTarget === 'agentExecutor' && 'paint-drop-target',
        )}
      >
        <div className="col-start-2 row-start-1 flex justify-center">
          <RoleBadge label="Card" active={Boolean(ports['port-card'])}>
            <CreditCard className="size-3.5" strokeWidth={2.25} />
          </RoleBadge>
        </div>

        <div className="col-start-1 row-start-2 flex items-center">
          <RoleBadge label="LLM" active={Boolean(ports['port-llm'])}>
            <BrainCircuit className="size-3.5" strokeWidth={2.25} />
          </RoleBadge>
        </div>

        <div className="col-start-2 row-start-2 flex min-w-0 flex-col items-center justify-center gap-1 text-center">
          <div
            className="flex size-9 items-center justify-center rounded-xl shadow-sm"
            style={componentIconGradientStyle('agentExecutor')}
          >
            <Bot className="size-4" />
          </div>
          {hasConfig ? (
            <>
              <p
                className="w-full truncate text-[11px] font-semibold leading-tight"
                style={{ color: componentVar('agentExecutor', 'foreground') }}
              >
                {nodeData.name}
              </p>
              {nodeData.host && nodeData.port ? (
                <p
                  className="w-full truncate text-[8px]"
                  style={{ color: componentVar('agentExecutor', 'muted') }}
                >
                  {nodeData.host}:{nodeData.port}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: componentVar('agentExecutor', 'label') }}
              >
                Executor
              </p>
              <p
                className="text-[8px] leading-tight"
                style={{ color: componentVar('agentExecutor', 'muted') }}
              >
                {isPaintMode
                  ? 'Drop to paint'
                  : 'Wire LLM · Card · Thread · Server'}
              </p>
            </>
          )}
        </div>

        <div className="col-start-3 row-start-2 flex items-center">
          <RoleBadge
            label="Thread"
            active={Boolean(ports['port-thread'])}
          >
            <MessagesSquare className="size-3.5" strokeWidth={2.25} />
          </RoleBadge>
        </div>

        <div className="col-start-2 row-start-3 flex justify-center">
          <RoleBadge
            label="Server"
            active={Boolean(ports['port-server'])}
          >
            <Server className="size-3.5" strokeWidth={2.25} />
          </RoleBadge>
        </div>
      </div>
    </div>
  )
}
