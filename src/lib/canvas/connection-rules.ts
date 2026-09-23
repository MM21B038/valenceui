import type { Connection, Edge } from '@xyflow/react'
import { Position } from '@xyflow/react'

import type { ValenceNode, ValenceNodeType } from '@/lib/types/workflow'

export const NODE_PORT_SIDES = [
  { id: 'port-top', position: Position.Top },
  { id: 'port-right', position: Position.Right },
  { id: 'port-bottom', position: Position.Bottom },
  { id: 'port-left', position: Position.Left },
] as const

export type PortHandleId = (typeof NODE_PORT_SIDES)[number]['id']

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
}

const ALLOWED_PAIRS = new Set<string>([
  'llm-toolServer',
  'toolServer-llm',
  'llm-serverStack',
  'serverStack-llm',
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

function getNeighborIds(nodeId: string, edges: Edge[]) {
  const neighbors = new Set<string>()
  for (const edge of edges) {
    if (edge.source === nodeId) neighbors.add(edge.target)
    if (edge.target === nodeId) neighbors.add(edge.source)
  }
  return neighbors
}

function countLlmLinksOnStack(
  stackId: string,
  nodes: ValenceNode[],
  edges: Edge[],
) {
  let count = 0
  for (const neighborId of getNeighborIds(stackId, edges)) {
    const node = nodes.find((item) => item.id === neighborId)
    if (node?.type === 'llm') count += 1
  }
  return count
}

function isAllowedPair(
  sourceType: ValenceNodeType,
  targetType: ValenceNodeType,
) {
  return ALLOWED_PAIRS.has(`${sourceType}-${targetType}`)
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

  if (sourceType === 'llm' || targetType === 'llm') {
    const llmId = sourceType === 'llm' ? source : target
    const otherType = sourceType === 'llm' ? targetType : sourceType

    if (otherType !== 'toolServer' && otherType !== 'serverStack') return false
    if (countNodeConnections(edges, llmId) >= 1) return false

    if (otherType === 'serverStack') {
      const stackId = sourceType === 'serverStack' ? source : target
      if (countLlmLinksOnStack(stackId, nodes, edges) >= 1) return false
    }
  }

  if (sourceType === 'toolServer' || targetType === 'toolServer') {
    const toolServerId = sourceType === 'toolServer' ? source : target
    const toolServer = nodes.find(
      (node): node is ValenceNode & { type: 'toolServer' } =>
        node.id === toolServerId && node.type === 'toolServer',
    )
    if (toolServer?.data.stackId) return false
    if (countNodeConnections(edges, toolServerId) >= 1) return false
  }

  return true
}
