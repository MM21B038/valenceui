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

/** MCP server config UUIDs linked to an LLM via a direct server or a dumped stack. */
export function getConnectedMcpServerIds(
  llmNodeId: string,
  nodes: ValenceNode[],
  edges: Edge[],
): string[] {
  const serverIds = new Set<string>()

  for (const neighborId of getNeighborIds(llmNodeId, edges)) {
    for (const id of collectToolServerConfigIds(neighborId, nodes)) {
      serverIds.add(id)
    }
  }

  return [...serverIds]
}

export function getStackedToolServerNodes(stackId: string, nodes: ValenceNode[]) {
  return getDumpedToolServers(stackId, nodes)
}
