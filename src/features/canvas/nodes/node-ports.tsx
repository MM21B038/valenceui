import {
  getConnectedPortId,
  isNodeConnected,
  NODE_PORT_SIDES,
} from '@/lib/canvas/connection-rules'
import { NodePort } from '@/features/canvas/nodes/node-port'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

interface NodePortsProps {
  nodeId: string
}

/**
 * Four-sided connection dots — visible on hover / when the cursor is near the node.
 * Once connected, only the active port stays visible until the edge is removed.
 */
export function NodePorts({ nodeId }: NodePortsProps) {
  const edges = useWorkflowStore((state) => state.edges)
  const isConnected = isNodeConnected(edges, nodeId)
  const connectedPortId = getConnectedPortId(edges, nodeId)

  const portVisibility = isConnected
    ? ''
    : 'opacity-0 scale-75 pointer-events-none group-hover/node:opacity-100 group-hover/node:scale-100 group-hover/node:pointer-events-auto'

  return (
    <>
      {NODE_PORT_SIDES.map((side) => {
        const isActivePort = connectedPortId === side.id
        const isVisible = isConnected ? isActivePort : true

        if (isConnected && !isActivePort) return null

        return (
          <>
            <NodePort
              key={`${side.id}-target`}
              id={side.id}
              handleType="target"
              position={side.position}
              isActive={isActivePort}
              isConnectable={!isConnected}
              showVisual={isVisible}
              className={cn('!z-20', portVisibility)}
            />
            <NodePort
              key={`${side.id}-source`}
              id={side.id}
              handleType="source"
              position={side.position}
              isActive={isActivePort}
              isConnectable={!isConnected}
              showVisual={false}
              className={cn('!z-30', portVisibility)}
            />
          </>
        )
      })}
    </>
  )
}
