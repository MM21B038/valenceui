import type { Connection, Edge } from '@xyflow/react'
import { Position } from '@xyflow/react'

import type { ValenceNode, ValenceNodeType } from '@/lib/types/workflow'

export const NODE_PORT_SIDES = [
  { id: 'port-top', position: Position.Top },
  { id: 'port-right', position: Position.Right },
  { id: 'port-bottom', position: Position.Bottom },
  { id: 'port-left', position: Position.Left },
] as const

/** Fixed Thread Config ports — agent (LLM) on the left, server on the right. */
export const THREAD_CONFIG_PORTS = [
  { id: 'port-agent', position: Position.Left, label: 'Agent' },
  { id: 'port-server', position: Position.Right, label: 'Server' },
] as const

export type CardinalPortHandleId = (typeof NODE_PORT_SIDES)[number]['id']
export type ThreadConfigPortHandleId = (typeof THREAD_CONFIG_PORTS)[number]['id']
export type PortHandleId = CardinalPortHandleId | ThreadConfigPortHandleId

export interface NodeConnectionProfile {
  type: ValenceNodeType
  portHandleIds: readonly PortHandleId[]
}

export const NODE_CONNECTION_PROFILES: Record<
  ValenceNodeType,
  NodeConnectionProfile
> = {
  llm: {
    type: 'llm',
    portHandleIds: NODE_PORT_SIDES.map((side) => side.id),
  },
  toolServer: {
    type: 'toolServer',
    portHandleIds: NODE_PORT_SIDES.map((side) => side.id),
  },
  serverStack: {
    type: 'serverStack',
    portHandleIds: NODE_PORT_SIDES.map((side) => side.id),
  },
  threadConfig: {
    type: 'threadConfig',
    portHandleIds: THREAD_CONFIG_PORTS.map((side) => side.id),
  },
}

const ALLOWED_PAIRS = new Set<string>([
  'llm-toolServer',
  'toolServer-llm',
  'llm-serverStack',
  'serverStack-llm',
  'llm-threadConfig',
  'threadConfig-llm',
  'toolServer-threadConfig',
  'threadConfig-toolServer',
  'serverStack-threadConfig',
  'threadConfig-serverStack',
])

export function getNodeProfile(type: ValenceNodeType | undefined) {
  if (!type) return null
  return NODE_CONNECTION_PROFILES[type]
}

export function isPortHandleId(
  handleId: string | null | undefined,
  profile: NodeConnectionProfile,
) {
  if (!handleId) return true
  return profile.portHandleIds.includes(handleId as PortHandleId)
}

export function countNodeConnections(edges: Edge[], nodeId: string) {
  return edges.filter(
    (edge) => edge.source === nodeId || edge.target === nodeId,
  ).length
}

export function isNodeConnected(edges: Edge[], nodeId: string) {
  return countNodeConnections(edges, nodeId) > 0
}

export function getConnectedPortId(
  edges: Edge[],
  nodeId: string,
): PortHandleId | null {
  for (const edge of edges) {
    if (edge.source === nodeId && edge.sourceHandle) {
      return edge.sourceHandle as PortHandleId
    }
    if (edge.target === nodeId && edge.targetHandle) {
      return edge.targetHandle as PortHandleId
    }
  }
  return null
}

export function getConnectedPortIds(
  edges: Edge[],
  nodeId: string,
): PortHandleId[] {
  const ids: PortHandleId[] = []
  for (const edge of edges) {
    if (edge.source === nodeId && edge.sourceHandle) {
      ids.push(edge.sourceHandle as PortHandleId)
    }
    if (edge.target === nodeId && edge.targetHandle) {
      ids.push(edge.targetHandle as PortHandleId)
    }
  }
  return ids
}

function getNeighborIds(nodeId: string, edges: Edge[]) {
  const neighbors = new Set<string>()
  for (const edge of edges) {
    if (edge.source === nodeId) neighbors.add(edge.target)
    if (edge.target === nodeId) neighbors.add(edge.source)
  }
  return neighbors
}

function countLinksToTypes(
  nodeId: string,
  edges: Edge[],
  nodes: ValenceNode[],
  types: ValenceNodeType[],
) {
  let count = 0
  for (const neighborId of getNeighborIds(nodeId, edges)) {
    const node = nodes.find((item) => item.id === neighborId)
    if (node?.type && types.includes(node.type)) count += 1
  }
  return count
}

function countLlmLinksOnStack(
  stackId: string,
  nodes: ValenceNode[],
  edges: Edge[],
) {
  return countLinksToTypes(stackId, edges, nodes, ['llm'])
}

function isAllowedPair(
  sourceType: ValenceNodeType,
  targetType: ValenceNodeType,
) {
  return ALLOWED_PAIRS.has(`${sourceType}-${targetType}`)
}

function threadHandleForPeer(
  connection: Connection | Edge,
  threadId: string,
): ThreadConfigPortHandleId | null {
  if (connection.source === threadId) {
    return (connection.sourceHandle as ThreadConfigPortHandleId) ?? null
  }
  if (connection.target === threadId) {
    return (connection.targetHandle as ThreadConfigPortHandleId) ?? null
  }
  return null
}

export function isValidWorkflowConnection(
  connection: Connection | Edge,
  nodes: ValenceNode[],
  edges: Edge[],
): boolean {
  const source = connection.source
  const target = connection.target

  if (!source || !target || source === target) return false

  const sourceNode = nodes.find((node) => node.id === source)
  const targetNode = nodes.find((node) => node.id === target)

  if (!sourceNode?.type || !targetNode?.type) return false

  const sourceType = sourceNode.type as ValenceNodeType
  const targetType = targetNode.type as ValenceNodeType

  const sourceProfile = getNodeProfile(sourceType)
  const targetProfile = getNodeProfile(targetType)

  if (!sourceProfile || !targetProfile) return false

  if (!isAllowedPair(sourceType, targetType)) return false

  if (
    !isPortHandleId(connection.sourceHandle, sourceProfile) ||
    !isPortHandleId(connection.targetHandle, targetProfile)
  ) {
    return false
  }

  // ── Thread Config: max 2 links, 1 agent + 1 server, fixed ports ──
  if (sourceType === 'threadConfig' || targetType === 'threadConfig') {
    const threadId = sourceType === 'threadConfig' ? source : target
    const peerType = sourceType === 'threadConfig' ? targetType : sourceType
    const handle = threadHandleForPeer(connection, threadId)

    if (countNodeConnections(edges, threadId) >= 2) return false

    if (peerType === 'llm') {
      if (handle && handle !== 'port-agent') return false
      if (countLinksToTypes(threadId, edges, nodes, ['llm']) >= 1) return false
    } else if (peerType === 'toolServer' || peerType === 'serverStack') {
      if (handle && handle !== 'port-server') return false
      if (
        countLinksToTypes(threadId, edges, nodes, [
          'toolServer',
          'serverStack',
        ]) >= 1
      ) {
        return false
      }
    } else {
      return false
    }
  }

  if (sourceType === 'llm' || targetType === 'llm') {
    const llmId = sourceType === 'llm' ? source : target
    const otherType = sourceType === 'llm' ? targetType : sourceType

    if (
      otherType !== 'toolServer' &&
      otherType !== 'serverStack' &&
      otherType !== 'threadConfig'
    ) {
      return false
    }

    if (otherType === 'toolServer' || otherType === 'serverStack') {
      if (
        countLinksToTypes(llmId, edges, nodes, ['toolServer', 'serverStack']) >=
        1
      ) {
        return false
      }
    }

    if (otherType === 'threadConfig') {
      if (countLinksToTypes(llmId, edges, nodes, ['threadConfig']) >= 1) {
        return false
      }
    }

    if (otherType === 'serverStack') {
      const stackId = sourceType === 'serverStack' ? source : target
      if (countLlmLinksOnStack(stackId, nodes, edges) >= 1) return false
    }
  }

  if (sourceType === 'toolServer' || targetType === 'toolServer') {
    const toolServerId = sourceType === 'toolServer' ? source : target
    const otherType = sourceType === 'toolServer' ? targetType : sourceType
    const toolServer = nodes.find(
      (node): node is ValenceNode & { type: 'toolServer' } =>
        node.id === toolServerId && node.type === 'toolServer',
    )
    if (toolServer?.data.stackId) return false

    // Tool server: one LLM + one Thread Config max
    if (otherType === 'llm') {
      if (countLinksToTypes(toolServerId, edges, nodes, ['llm']) >= 1) {
        return false
      }
    } else if (otherType === 'threadConfig') {
      if (countLinksToTypes(toolServerId, edges, nodes, ['threadConfig']) >= 1) {
        return false
      }
    } else {
      return false
    }
  }

  if (sourceType === 'serverStack' || targetType === 'serverStack') {
    const stackId = sourceType === 'serverStack' ? source : target
    const otherType = sourceType === 'serverStack' ? targetType : sourceType

    if (otherType === 'llm') {
      if (countLlmLinksOnStack(stackId, nodes, edges) >= 1) return false
    } else if (otherType === 'threadConfig') {
      if (countLinksToTypes(stackId, edges, nodes, ['threadConfig']) >= 1) {
        return false
      }
    }
  }

  return true
}
