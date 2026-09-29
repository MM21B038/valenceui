import type { Connection, Edge } from '@xyflow/react'
import { Position } from '@xyflow/react'

import type { ValenceNode, ValenceNodeType } from '@/lib/types/workflow'

export const NODE_PORT_SIDES = [
  { id: 'port-top', position: Position.Top },
  { id: 'port-right', position: Position.Right },
  { id: 'port-bottom', position: Position.Bottom },
  { id: 'port-left', position: Position.Left },
] as const

/** Thread Config — Executor left, Server right. Never LLM. */
export const THREAD_CONFIG_PORTS = [
  { id: 'port-agent', position: Position.Left, label: 'Executor' },
  { id: 'port-server', position: Position.Right, label: 'Server' },
] as const

/** LLM — Server left, Executor right (same pattern as Thread Config). */
export const LLM_PORTS = [
  { id: 'port-server', position: Position.Left, label: 'Server' },
  { id: 'port-executor', position: Position.Right, label: 'Executor' },
] as const

/**
 * Agent Executor hub — fixed compass ports.
 * Left LLM · Top Card · Right Thread · Bottom Server
 */
export const AGENT_EXECUTOR_PORTS = [
  { id: 'port-llm', position: Position.Left, label: 'LLM' },
  { id: 'port-card', position: Position.Top, label: 'Card' },
  { id: 'port-thread', position: Position.Right, label: 'Thread' },
  { id: 'port-server', position: Position.Bottom, label: 'Server' },
] as const

/**
 * Agent Card — Interfaces left, Skills right, Executor bottom. Nothing on top.
 */
export const AGENT_CARD_PORTS = [
  { id: 'port-interfaces', position: Position.Left, label: 'Interfaces' },
  { id: 'port-skills', position: Position.Right, label: 'Skills' },
  { id: 'port-executor', position: Position.Bottom, label: 'Executor' },
] as const

export type CardinalPortHandleId = (typeof NODE_PORT_SIDES)[number]['id']
export type ThreadConfigPortHandleId = (typeof THREAD_CONFIG_PORTS)[number]['id']
export type LlmPortHandleId = (typeof LLM_PORTS)[number]['id']
export type AgentExecutorPortHandleId = (typeof AGENT_EXECUTOR_PORTS)[number]['id']
export type AgentCardPortHandleId = (typeof AGENT_CARD_PORTS)[number]['id']
export type PortHandleId =
  | CardinalPortHandleId
  | ThreadConfigPortHandleId
  | LlmPortHandleId
  | AgentExecutorPortHandleId
  | AgentCardPortHandleId

export interface FixedPortDef {
  id: string
  position: Position
  label: string
}

export interface NodeConnectionProfile {
  type: ValenceNodeType
  portHandleIds: readonly PortHandleId[]
  fixedPorts?: readonly FixedPortDef[]
}

const CARDINAL_PROFILE = (type: ValenceNodeType): NodeConnectionProfile => ({
  type,
  portHandleIds: NODE_PORT_SIDES.map((side) => side.id),
})

export const NODE_CONNECTION_PROFILES: Record<
  ValenceNodeType,
  NodeConnectionProfile
> = {
  llm: {
    type: 'llm',
    portHandleIds: LLM_PORTS.map((port) => port.id),
    fixedPorts: LLM_PORTS,
  },
  toolServer: CARDINAL_PROFILE('toolServer'),
  serverStack: CARDINAL_PROFILE('serverStack'),
  threadConfig: {
    type: 'threadConfig',
    portHandleIds: THREAD_CONFIG_PORTS.map((port) => port.id),
    fixedPorts: THREAD_CONFIG_PORTS,
  },
  agentSkill: CARDINAL_PROFILE('agentSkill'),
  agentInterface: CARDINAL_PROFILE('agentInterface'),
  agentCard: {
    type: 'agentCard',
    portHandleIds: AGENT_CARD_PORTS.map((port) => port.id),
    fixedPorts: AGENT_CARD_PORTS,
  },
  agentExecutor: {
    type: 'agentExecutor',
    portHandleIds: AGENT_EXECUTOR_PORTS.map((port) => port.id),
    fixedPorts: AGENT_EXECUTOR_PORTS,
  },
  skillStack: CARDINAL_PROFILE('skillStack'),
  interfaceStack: CARDINAL_PROFILE('interfaceStack'),
}

const ALLOWED_PAIRS = new Set<string>([
  'llm-toolServer',
  'toolServer-llm',
  'llm-serverStack',
  'serverStack-llm',
  'llm-agentExecutor',
  'agentExecutor-llm',
  'toolServer-threadConfig',
  'threadConfig-toolServer',
  'serverStack-threadConfig',
  'threadConfig-serverStack',
  'toolServer-agentExecutor',
  'agentExecutor-toolServer',
  'serverStack-agentExecutor',
  'agentExecutor-serverStack',
  'threadConfig-agentExecutor',
  'agentExecutor-threadConfig',
  'agentCard-agentExecutor',
  'agentExecutor-agentCard',
  'agentSkill-agentCard',
  'agentCard-agentSkill',
  'skillStack-agentCard',
  'agentCard-skillStack',
  'agentInterface-agentCard',
  'agentCard-agentInterface',
  'interfaceStack-agentCard',
  'agentCard-interfaceStack',
])

/** Required fixed-port id on `nodeType` when linking to `peerType`. */
const REQUIRED_PORT: Partial<
  Record<ValenceNodeType, Partial<Record<ValenceNodeType, string>>>
> = {
  threadConfig: {
    agentExecutor: 'port-agent',
    toolServer: 'port-server',
    serverStack: 'port-server',
  },
  llm: {
    agentExecutor: 'port-executor',
    toolServer: 'port-server',
    serverStack: 'port-server',
  },
  agentExecutor: {
    llm: 'port-llm',
    threadConfig: 'port-thread',
    agentCard: 'port-card',
    toolServer: 'port-server',
    serverStack: 'port-server',
  },
  agentCard: {
    agentExecutor: 'port-executor',
    agentSkill: 'port-skills',
    skillStack: 'port-skills',
    agentInterface: 'port-interfaces',
    interfaceStack: 'port-interfaces',
  },
}

/** Fixed role port required on `nodeType` when linked to `peerType`, if any. */
export function requiredPortFor(
  nodeType: ValenceNodeType,
  peerType: ValenceNodeType,
): string | null {
  return REQUIRED_PORT[nodeType]?.[peerType] ?? null
}

/** Pick the cardinal side on `from` that faces toward `to`. */
export function inferCardinalHandle(
  from: { x: number; y: number },
  to: { x: number; y: number },
): CardinalPortHandleId {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'port-right' : 'port-left'
  }
  return dy >= 0 ? 'port-bottom' : 'port-top'
}

/**
 * Reconstruct source/target handles for a persisted connection that only
 * stores node UUIDs (role ports from REQUIRED_PORT; cardinal from geometry).
 */
export function resolveEdgeHandles(options: {
  sourceType: ValenceNodeType
  targetType: ValenceNodeType
  sourcePosition: { x: number; y: number }
  targetPosition: { x: number; y: number }
}): { sourceHandle: string; targetHandle: string } {
  const { sourceType, targetType, sourcePosition, targetPosition } = options
  const sourceProfile = getNodeProfile(sourceType)
  const targetProfile = getNodeProfile(targetType)

  const sourceHandle =
    requiredPortFor(sourceType, targetType) ??
    (sourceProfile && !sourceProfile.fixedPorts
      ? inferCardinalHandle(sourcePosition, targetPosition)
      : (sourceProfile?.portHandleIds[0] ?? 'port-right'))

  const targetHandle =
    requiredPortFor(targetType, sourceType) ??
    (targetProfile && !targetProfile.fixedPorts
      ? inferCardinalHandle(targetPosition, sourcePosition)
      : (targetProfile?.portHandleIds[0] ?? 'port-left'))

  return { sourceHandle, targetHandle }
}

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

const SERVER_TYPES: ValenceNodeType[] = ['toolServer', 'serverStack']

export function findLinkedExecutorId(
  nodeId: string,
  edges: Edge[],
  nodes: ValenceNode[],
) {
  for (const neighborId of getNeighborIds(nodeId, edges)) {
    const neighbor = nodes.find((item) => item.id === neighborId)
    if (neighbor?.type === 'agentExecutor') return neighborId
  }
  return null
}

export function nodeHasServerLink(
  nodeId: string,
  edges: Edge[],
  nodes: ValenceNode[],
) {
  return countLinksToTypes(nodeId, edges, nodes, SERVER_TYPES) >= 1
}

/** True when this LLM/Thread shares an Executor that already owns the server. */
export function usesExecutorOwnedServer(
  consumerId: string,
  edges: Edge[],
  nodes: ValenceNode[],
) {
  const executorId = findLinkedExecutorId(consumerId, edges, nodes)
  if (!executorId) return false
  return nodeHasServerLink(executorId, edges, nodes)
}

function isServerType(type: ValenceNodeType | undefined) {
  return type === 'toolServer' || type === 'serverStack'
}

function isServerConsumer(type: ValenceNodeType | undefined) {
  return type === 'llm' || type === 'threadConfig'
}

/**
 * When an Executor owns a server, LLM/Thread linked to it must not keep their
 * own server edges — they inherit the executor's server.
 */
export function pruneConsumerServerEdgesForExecutorOwners(
  edges: Edge[],
  nodes: ValenceNode[],
): Edge[] {
  const blockedConsumers = new Set<string>()

  for (const node of nodes) {
    if (node.type !== 'agentExecutor') continue
    if (!nodeHasServerLink(node.id, edges, nodes)) continue

    for (const neighborId of getNeighborIds(node.id, edges)) {
      const neighbor = nodes.find((item) => item.id === neighborId)
      if (isServerConsumer(neighbor?.type)) {
        blockedConsumers.add(neighborId)
      }
    }
  }

  if (blockedConsumers.size === 0) return edges

  return edges.filter((edge) => {
    const source = nodes.find((item) => item.id === edge.source)
    const target = nodes.find((item) => item.id === edge.target)
    const consumerId = isServerConsumer(source?.type)
      ? edge.source
      : isServerConsumer(target?.type)
        ? edge.target
        : null
    if (!consumerId || !blockedConsumers.has(consumerId)) return true

    const peerType = consumerId === edge.source ? target?.type : source?.type
    return !isServerType(peerType)
  })
}

function isAllowedPair(
  sourceType: ValenceNodeType,
  targetType: ValenceNodeType,
) {
  return ALLOWED_PAIRS.has(`${sourceType}-${targetType}`)
}

function handleForNode(
  connection: Connection | Edge,
  nodeId: string,
): string | null {
  if (connection.source === nodeId) {
    return connection.sourceHandle ?? null
  }
  if (connection.target === nodeId) {
    return connection.targetHandle ?? null
  }
  return null
}

function portMatchesPeer(
  nodeType: ValenceNodeType,
  peerType: ValenceNodeType,
  handle: string | null,
) {
  const required = REQUIRED_PORT[nodeType]?.[peerType]
  if (!required) return true
  if (!handle) return false
  return handle === required
}

function hasStackId(
  node: ValenceNode,
): node is ValenceNode & { data: { stackId?: string } } {
  return (
    node.type === 'toolServer' ||
    node.type === 'agentSkill' ||
    node.type === 'agentInterface'
  )
}

export function isValidWorkflowConnection(
  connection: Connection | Edge,
  nodes: ValenceNode[],
  edges: Edge[],
  workspaceType: 'agent-executor' | 'a2a' = 'agent-executor',
): boolean {
  const source = connection.source
  const target = connection.target

  if (!source || !target || source === target) return false

  const sourceNode = nodes.find((node) => node.id === source)
  const targetNode = nodes.find((node) => node.id === target)

  if (!sourceNode?.type || !targetNode?.type) return false

  const sourceType = sourceNode.type as ValenceNodeType
  const targetType = targetNode.type as ValenceNodeType

  // A2A workspace — only Agent Executor ↔ Agent Executor
  if (workspaceType === 'a2a') {
    if (sourceType !== 'agentExecutor' || targetType !== 'agentExecutor') {
      return false
    }
    return true
  }

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

  if (hasStackId(sourceNode) && sourceNode.data.stackId) return false
  if (hasStackId(targetNode) && targetNode.data.stackId) return false

  const sourceHandle = handleForNode(connection, source)
  const targetHandle = handleForNode(connection, target)

  if (!portMatchesPeer(sourceType, targetType, sourceHandle)) return false
  if (!portMatchesPeer(targetType, sourceType, targetHandle)) return false

  // ── Thread Config: Executor + Server only (never LLM) ──
  if (sourceType === 'threadConfig' || targetType === 'threadConfig') {
    const threadId = sourceType === 'threadConfig' ? source : target
    const peerType = sourceType === 'threadConfig' ? targetType : sourceType

    if (peerType === 'llm') return false

    if (countNodeConnections(edges, threadId) >= 2) return false

    if (peerType === 'agentExecutor') {
      if (countLinksToTypes(threadId, edges, nodes, ['agentExecutor']) >= 1) {
        return false
      }
    } else if (peerType === 'toolServer' || peerType === 'serverStack') {
      if (usesExecutorOwnedServer(threadId, edges, nodes)) return false
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

  // ── LLM: Executor + Server only ──
  if (sourceType === 'llm' || targetType === 'llm') {
    const llmId = sourceType === 'llm' ? source : target
    const otherType = sourceType === 'llm' ? targetType : sourceType

    if (
      otherType !== 'toolServer' &&
      otherType !== 'serverStack' &&
      otherType !== 'agentExecutor'
    ) {
      return false
    }

    if (countNodeConnections(edges, llmId) >= 2) return false

    if (otherType === 'toolServer' || otherType === 'serverStack') {
      if (usesExecutorOwnedServer(llmId, edges, nodes)) return false
      if (
        countLinksToTypes(llmId, edges, nodes, ['toolServer', 'serverStack']) >=
        1
      ) {
        return false
      }
    }

    if (otherType === 'agentExecutor') {
      if (countLinksToTypes(llmId, edges, nodes, ['agentExecutor']) >= 1) {
        return false
      }
    }
  }

  // ── Agent Executor hub (max 4 links, one per role) ──
  if (sourceType === 'agentExecutor' || targetType === 'agentExecutor') {
    const executorId =
      sourceType === 'agentExecutor' ? source : target
    const otherType =
      sourceType === 'agentExecutor' ? targetType : sourceType

    if (countNodeConnections(edges, executorId) >= 4) return false

    if (otherType === 'llm') {
      if (countLinksToTypes(executorId, edges, nodes, ['llm']) >= 1) {
        return false
      }
    } else if (otherType === 'threadConfig') {
      if (
        countLinksToTypes(executorId, edges, nodes, ['threadConfig']) >= 1
      ) {
        return false
      }
    } else if (otherType === 'agentCard') {
      if (countLinksToTypes(executorId, edges, nodes, ['agentCard']) >= 1) {
        return false
      }
    } else if (otherType === 'toolServer' || otherType === 'serverStack') {
      if (
        countLinksToTypes(executorId, edges, nodes, [
          'toolServer',
          'serverStack',
        ]) >= 1
      ) {
        return false
      }
    }
  }

  // ── Agent Card composition ──
  if (sourceType === 'agentCard' || targetType === 'agentCard') {
    const cardId = sourceType === 'agentCard' ? source : target
    const otherType = sourceType === 'agentCard' ? targetType : sourceType

    if (otherType === 'agentExecutor') {
      if (countLinksToTypes(cardId, edges, nodes, ['agentExecutor']) >= 1) {
        return false
      }
    } else if (otherType === 'agentSkill') {
      if (countLinksToTypes(cardId, edges, nodes, ['skillStack']) >= 1) {
        return false
      }
    } else if (otherType === 'skillStack') {
      if (
        countLinksToTypes(cardId, edges, nodes, ['agentSkill', 'skillStack']) >=
        1
      ) {
        return false
      }
    } else if (otherType === 'agentInterface') {
      if (countLinksToTypes(cardId, edges, nodes, ['interfaceStack']) >= 1) {
        return false
      }
    } else if (otherType === 'interfaceStack') {
      if (
        countLinksToTypes(cardId, edges, nodes, [
          'agentInterface',
          'interfaceStack',
        ]) >= 1
      ) {
        return false
      }
    }
  }

  // ── Tool server / MCP stack: LLM + Thread + Executor (max 3, one each) ──
  if (sourceType === 'toolServer' || targetType === 'toolServer') {
    const toolServerId = sourceType === 'toolServer' ? source : target
    const otherType = sourceType === 'toolServer' ? targetType : sourceType

    if (countNodeConnections(edges, toolServerId) >= 3) return false

    if (otherType === 'llm') {
      if (countLinksToTypes(toolServerId, edges, nodes, ['llm']) >= 1) {
        return false
      }
    } else if (otherType === 'threadConfig') {
      if (
        countLinksToTypes(toolServerId, edges, nodes, ['threadConfig']) >= 1
      ) {
        return false
      }
    } else if (otherType === 'agentExecutor') {
      if (
        countLinksToTypes(toolServerId, edges, nodes, ['agentExecutor']) >= 1
      ) {
        return false
      }
    } else {
      return false
    }
  }

  if (sourceType === 'serverStack' || targetType === 'serverStack') {
    const stackId = sourceType === 'serverStack' ? source : target
    const otherType = sourceType === 'serverStack' ? targetType : sourceType

    if (countNodeConnections(edges, stackId) >= 3) return false

    if (otherType === 'llm') {
      if (countLinksToTypes(stackId, edges, nodes, ['llm']) >= 1) return false
    } else if (otherType === 'threadConfig') {
      if (countLinksToTypes(stackId, edges, nodes, ['threadConfig']) >= 1) {
        return false
      }
    } else if (otherType === 'agentExecutor') {
      if (countLinksToTypes(stackId, edges, nodes, ['agentExecutor']) >= 1) {
        return false
      }
    } else {
      return false
    }
  }

  if (sourceType === 'skillStack' || targetType === 'skillStack') {
    const stackId = sourceType === 'skillStack' ? source : target
    const otherType = sourceType === 'skillStack' ? targetType : sourceType
    if (otherType === 'agentCard') {
      if (countLinksToTypes(stackId, edges, nodes, ['agentCard']) >= 1) {
        return false
      }
    }
  }

  if (sourceType === 'interfaceStack' || targetType === 'interfaceStack') {
    const stackId = sourceType === 'interfaceStack' ? source : target
    const otherType = sourceType === 'interfaceStack' ? targetType : sourceType
    if (otherType === 'agentCard') {
      if (countLinksToTypes(stackId, edges, nodes, ['agentCard']) >= 1) {
        return false
      }
    }
  }

  return true
}
