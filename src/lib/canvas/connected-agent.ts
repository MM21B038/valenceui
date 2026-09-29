import type { Edge } from '@xyflow/react'

import { getDumpedToolServers } from '@/lib/canvas/stack-dump'
import type { ValenceNode } from '@/lib/types/workflow'

function getNeighborIds(nodeId: string, edges: Edge[]) {
  const neighbors = new Set<string>()
  for (const edge of edges) {
    if (edge.source === nodeId) neighbors.add(edge.target)
    if (edge.target === nodeId) neighbors.add(edge.source)
  }
  return neighbors
}

function collectToolServerConfigIds(
  nodeId: string,
  nodes: ValenceNode[],
): string[] {
  const node = nodes.find((item) => item.id === nodeId)
  if (!node) return []

  if (node.type === 'toolServer' && node.data.configId) {
    return [node.data.configId]
  }

  if (node.type === 'serverStack') {
    return getDumpedToolServers(nodeId, nodes)
      .filter((server) => server.data.configId)
      .map((server) => server.data.configId as string)
  }

  return []
}

function getStackedMemberConfigIds(
  stackId: string,
  nodes: ValenceNode[],
  memberType: 'agentSkill' | 'agentInterface',
): string[] {
  const stack = nodes.find((node) => node.id === stackId)
  const memberIds =
    stack?.type === 'skillStack' || stack?.type === 'interfaceStack'
      ? stack.data.memberIds ?? []
      : []

  return memberIds
    .map((memberId) => nodes.find((node) => node.id === memberId))
    .filter(
      (node): node is ValenceNode & { type: typeof memberType } =>
        node?.type === memberType,
    )
    .map((node) => node.data.configId)
    .filter((id): id is string => Boolean(id))
}

/** Resolve MCP / LLM / thread / card links from an Agent Executor node. */
export function getAgentExecutorConnections(
  executorNodeId: string,
  nodes: ValenceNode[],
  edges: Edge[],
) {
  let llmConfigId: string | null = null
  let threadConfigId: string | null = null
  let agentCardId: string | null = null
  const mcpServerIds = new Set<string>()

  for (const neighborId of getNeighborIds(executorNodeId, edges)) {
    const neighbor = nodes.find((node) => node.id === neighborId)
    if (!neighbor) continue

    if (neighbor.type === 'llm' && neighbor.data.configId) {
      llmConfigId = neighbor.data.configId
    } else if (neighbor.type === 'threadConfig' && neighbor.data.configId) {
      threadConfigId = neighbor.data.configId
    } else if (neighbor.type === 'agentCard' && neighbor.data.configId) {
      agentCardId = neighbor.data.configId
    } else if (
      neighbor.type === 'toolServer' ||
      neighbor.type === 'serverStack'
    ) {
      for (const id of collectToolServerConfigIds(neighborId, nodes)) {
        mcpServerIds.add(id)
      }
    }
  }

  return {
    llmConfigId,
    threadConfigId,
    agentCardId,
    mcpServerIds: [...mcpServerIds],
  }
}

/** Resolve skill + interface UUIDs linked to an Agent Card (expand stacks). */
export function getAgentCardConnections(
  cardNodeId: string,
  nodes: ValenceNode[],
  edges: Edge[],
) {
  const skillIds = new Set<string>()
  const interfaceIds = new Set<string>()

  for (const neighborId of getNeighborIds(cardNodeId, edges)) {
    const neighbor = nodes.find((node) => node.id === neighborId)
    if (!neighbor) continue

    if (neighbor.type === 'agentSkill' && neighbor.data.configId) {
      skillIds.add(neighbor.data.configId)
    } else if (neighbor.type === 'skillStack') {
      for (const id of getStackedMemberConfigIds(
        neighborId,
        nodes,
        'agentSkill',
      )) {
        skillIds.add(id)
      }
    } else if (neighbor.type === 'agentInterface' && neighbor.data.configId) {
      interfaceIds.add(neighbor.data.configId)
    } else if (neighbor.type === 'interfaceStack') {
      for (const id of getStackedMemberConfigIds(
        neighborId,
        nodes,
        'agentInterface',
      )) {
        interfaceIds.add(id)
      }
    }
  }

  return {
    skillIds: [...skillIds],
    interfaceIds: [...interfaceIds],
  }
}

export function getMissingAgentExecutorLinks(
  executorNodeId: string,
  nodes: ValenceNode[],
  edges: Edge[],
) {
  const connected = getAgentExecutorConnections(executorNodeId, nodes, edges)
  const missing: string[] = []
  if (!connected.llmConfigId) missing.push('LLM')
  if (!connected.threadConfigId) missing.push('Thread Config')
  if (!connected.agentCardId) missing.push('Agent Card')
  return { connected, missing }
}
