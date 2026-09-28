import type { Edge, Node, Viewport } from '@xyflow/react'

import type { LlmNodeData } from '@/lib/types/llm-config'
import type { ToolServerNodeData } from '@/lib/types/mcp-server-config'
import type { ServerStackNodeData } from '@/lib/types/server-stack'
import type { ThreadConfigNodeData } from '@/lib/types/thread-config'

export type ValenceNodeType = 'llm' | 'toolServer' | 'serverStack' | 'threadConfig'

export type ValenceNode =
  | Node<LlmNodeData, 'llm'>
  | Node<ToolServerNodeData, 'toolServer'>
  | Node<ServerStackNodeData, 'serverStack'>
  | Node<ThreadConfigNodeData, 'threadConfig'>
export type ValenceEdge = Edge

export interface WorkflowGraph {
  id: string
  name: string
  nodes: ValenceNode[]
  edges: ValenceEdge[]
  viewport: Viewport
  updatedAt?: string
}
