import { A2A_EXECUTOR_PORTS } from '@/lib/canvas/connection-rules'
import { NodePort } from '@/features/canvas/nodes/node-port'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

interface A2aExecutorPortsProps {
  nodeId: string
}

/**
 * A2A Agent Executor ports: top = in (target), bottom = out (source).
 * Both sides stay connectable so many peers can attach.
 */
export function A2aExecutorPorts({ nodeId }: A2aExecutorPortsProps) {
  const edges = useWorkflowStore((state) => state.edges)
  const hasIn = edges.some(
    (edge) => edge.target === nodeId && edge.targetHandle === 'port-in',
  )
  const hasOut = edges.some(
    (edge) => edge.source === nodeId && edge.sourceHandle === 'port-out',
  )

  return (
    <>
      {A2A_EXECUTOR_PORTS.map((port) => {
        const isActive = port.id === 'port-in' ? hasIn : hasOut
        const idleReveal =
          'opacity-0 scale-75 pointer-events-none group-hover/node:opacity-100 group-hover/node:scale-100 group-hover/node:pointer-events-auto'

        return (
          <NodePort
            key={port.id}
            id={port.id}
            handleType={port.handleType}
            position={port.position}
            isActive={isActive}
            isConnectable
            showVisual
            className={cn('!z-20', !isActive && idleReveal)}
          />
        )
      })}
    </>
  )
}
