import type { ValenceNode } from '@/lib/types/workflow'

export const STACK_NODE_WIDTH = 188
export const STACK_NODE_HEIGHT = 148
export const TOOL_SERVER_NODE_WIDTH = 132
export const TOOL_SERVER_NODE_HEIGHT = 112
export const STACK_HIT_PADDING = 16
export const STACK_PAGE_SIZE = 2
export const STACK_PAGE_INTERVAL_MS = 3500
export const STACK_EJECT_OFFSET_X = 210
export const STACK_EJECT_OFFSET_Y = 28

export function isPointInsideStack(
  point: { x: number; y: number },
  stackPosition: { x: number; y: number },
  padding = STACK_HIT_PADDING,
) {
  return (
    point.x >= stackPosition.x - padding &&
    point.x <= stackPosition.x + STACK_NODE_WIDTH + padding &&
    point.y >= stackPosition.y - padding &&
    point.y <= stackPosition.y + STACK_NODE_HEIGHT + padding
  )
}

export function getStackIdAtPoint(
  point: { x: number; y: number },
  nodes: ValenceNode[],
) {
  for (const node of nodes) {
    if (node.type !== 'serverStack') continue
    if (isPointInsideStack(point, node.position)) return node.id
  }
  return null
}

export function getStackIdForToolServerNode(
  node: ValenceNode & { type: 'toolServer' },
  nodes: ValenceNode[],
) {
  const center = {
    x: node.position.x + TOOL_SERVER_NODE_WIDTH / 2,
    y: node.position.y + TOOL_SERVER_NODE_HEIGHT / 2,
  }
  return getStackIdAtPoint(center, nodes)
}

export function getDumpedToolServers(
  stackId: string,
  nodes: ValenceNode[],
) {
  const stack = nodes.find((node) => node.id === stackId)
  const memberIds =
    stack?.type === 'serverStack' ? stack.data.memberIds ?? [] : []

  return memberIds
    .map((memberId) => nodes.find((node) => node.id === memberId))
    .filter(
      (node): node is ValenceNode & { type: 'toolServer' } =>
        node?.type === 'toolServer',
    )
}
