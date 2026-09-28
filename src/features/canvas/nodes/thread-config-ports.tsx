import { Position } from '@xyflow/react'

import { NodePort } from '@/features/canvas/nodes/node-port'
import {
  getConnectedPortIds,
  THREAD_CONFIG_PORTS,
  type ThreadConfigPortHandleId,
} from '@/lib/canvas/connection-rules'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

interface ThreadConfigPortsProps {
  nodeId: string
}

/** Sit clear of the pill edge so role icons inside stay readable. */
const HANDLE_OFFSET: Record<Position.Left | Position.Right, string> = {
  [Position.Left]: '!-translate-x-[16px]',
  [Position.Right]: '!translate-x-[16px]',
}

/**
 * Connection dots only — Agent / Server role icons live in the node body
 * so they never collide with the handles.
 */
export function ThreadConfigPorts({ nodeId }: ThreadConfigPortsProps) {
  const edges = useWorkflowStore((state) => state.edges)
  const connectedPorts = new Set(getConnectedPortIds(edges, nodeId))

  return (
    <>
      {THREAD_CONFIG_PORTS.map((port) => {
        const isActive = connectedPorts.has(port.id as ThreadConfigPortHandleId)
        const isConnectable = !isActive
        const offset =
          port.position === Position.Left || port.position === Position.Right
            ? HANDLE_OFFSET[port.position]
            : undefined

        return (
          <div key={port.id} className="pointer-events-none absolute inset-0">
            <NodePort
              id={port.id}
              handleType="target"
              position={port.position}
              isActive={isActive}
              isConnectable={isConnectable}
              showVisual
              className={cn('!z-30 pointer-events-auto', offset)}
            />
            <NodePort
              id={port.id}
              handleType="source"
              position={port.position}
              isActive={isActive}
              isConnectable={isConnectable}
              showVisual={false}
              className={cn('!z-40 pointer-events-auto', offset)}
            />
          </div>
        )
      })}
    </>
  )
}

export function useThreadConfigPortState(nodeId: string) {
  const edges = useWorkflowStore((state) => state.edges)
  const connected = getConnectedPortIds(edges, nodeId)
  return {
    agentConnected: connected.includes('port-agent'),
    serverConnected: connected.includes('port-server'),
  }
}
