import {
  THREAD_CONFIG_PORTS,
  usesExecutorOwnedServer,
} from '@/lib/canvas/connection-rules'
import {
  FixedRolePorts,
  useFixedPortState,
} from '@/features/canvas/nodes/fixed-role-ports'
import { useWorkflowStore } from '@/stores/workflow-store'

interface ThreadConfigPortsProps {
  nodeId: string
  hideServer?: boolean
}

export function ThreadConfigPorts({
  nodeId,
  hideServer = false,
}: ThreadConfigPortsProps) {
  const ports = hideServer
    ? THREAD_CONFIG_PORTS.filter((port) => port.id !== 'port-server')
    : THREAD_CONFIG_PORTS
  return <FixedRolePorts nodeId={nodeId} ports={ports} />
}

export function useThreadConfigPortState(nodeId: string) {
  const edges = useWorkflowStore((state) => state.edges)
  const nodes = useWorkflowStore((state) => state.nodes)
  const state = useFixedPortState(
    nodeId,
    THREAD_CONFIG_PORTS.map((port) => port.id),
  )
  return {
    agentConnected: Boolean(state['port-agent']),
    serverConnected: Boolean(state['port-server']),
    serverOwnedByExecutor: usesExecutorOwnedServer(nodeId, edges, nodes),
  }
}
