import {
  getConnectedPortIds,
  NODE_PORT_SIDES,
  type CardinalPortHandleId,
} from '@/lib/canvas/connection-rules'
import { NodePort } from '@/features/canvas/nodes/node-port'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

interface NodePortsProps {
  nodeId: string
}

/**
 * Four-sided connection dots — each side accepts at most one edge.
 * Free sides stay available on hover so multi-role hubs (e.g. server stack
 * → LLM + Thread + Executor) can take more than one link.
 */
export function NodePorts({ nodeId }: NodePortsProps) {
  const edges = useWorkflowStore((state) => state.edges)
  const connectedPorts = new Set(getConnectedPortIds(edges, nodeId))

  return (
    <>
      {NODE_PORT_SIDES.map((side) => {
        const isActivePort = connectedPorts.has(side.id as CardinalPortHandleId)
        const isConnectable = !isActivePort
        const idleReveal =
          'opacity-0 scale-75 pointer-events-none group-hover/node:opacity-100 group-hover/node:scale-100 group-hover/node:pointer-events-auto'

        return (
          <div key={side.id}>
            <NodePort
              id={side.id}
              handleType="target"
              position={side.position}
              isActive={isActivePort}
              isConnectable={isConnectable}
              showVisual
              className={cn('!z-20', !isActivePort && idleReveal)}
            />
            <NodePort
              id={side.id}
              handleType="source"
              position={side.position}
              isActive={isActivePort}
              isConnectable={isConnectable}
              showVisual={false}
              className={cn('!z-30', !isActivePort && idleReveal)}
            />
          </div>
        )
      })}
    </>
  )
}
