import type { Edge } from '@xyflow/react'

import { findLinkedExecutorId } from '@/lib/canvas/connection-rules'
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

function collectDirectServerIds(
  nodeId: string,
  nodes: ValenceNode[],
  edges: Edge[],
) {
  const serverIds = new Set<string>()
  for (const neighborId of getNeighborIds(nodeId, edges)) {
    for (const id of collectToolServerConfigIds(neighborId, nodes)) {
      serverIds.add(id)
    }
  }
  return serverIds
}

/**
 * MCP server config UUIDs for an LLM — direct links, or inherited from a
 * linked Agent Executor that owns the server.
 */
export function getConnectedMcpServerIds(
  llmNodeId: string,
  nodes: ValenceNode[],
  edges: Edge[],
): string[] {
  const direct = collectDirectServerIds(llmNodeId, nodes, edges)
  if (direct.size > 0) return [...direct]

  const executorId = findLinkedExecutorId(llmNodeId, edges, nodes)
  if (!executorId) return []

  return [...collectDirectServerIds(executorId, nodes, edges)]
}

export function getStackedToolServerNodes(stackId: string, nodes: ValenceNode[]) {
  return getDumpedToolServers(stackId, nodes)
}
