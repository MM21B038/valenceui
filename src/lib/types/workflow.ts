import type { Edge, Node, Viewport } from '@xyflow/react'

import type { AgentCardNodeData } from '@/lib/types/agent-card'
import type { AgentExecutorNodeData } from '@/lib/types/agent-executor'
import type { AgentInterfaceNodeData } from '@/lib/types/agent-interface'
import type { AgentSkillNodeData } from '@/lib/types/agent-skill'
import type { InterfaceStackNodeData } from '@/lib/types/interface-stack'
import type { LlmNodeData } from '@/lib/types/llm-config'
import type { ToolServerNodeData } from '@/lib/types/mcp-server-config'
import type { ServerStackNodeData } from '@/lib/types/server-stack'
import type { SkillStackNodeData } from '@/lib/types/skill-stack'
import type { ThreadConfigNodeData } from '@/lib/types/thread-config'

export type ValenceNodeType =
  | 'llm'
  | 'toolServer'
  | 'serverStack'
  | 'threadConfig'
  | 'agentSkill'
  | 'agentInterface'
  | 'agentCard'
  | 'agentExecutor'
  | 'skillStack'
  | 'interfaceStack'

export type ValenceNode =
  | Node<LlmNodeData, 'llm'>
  | Node<ToolServerNodeData, 'toolServer'>
  | Node<ServerStackNodeData, 'serverStack'>
  | Node<ThreadConfigNodeData, 'threadConfig'>
  | Node<AgentSkillNodeData, 'agentSkill'>
  | Node<AgentInterfaceNodeData, 'agentInterface'>
  | Node<AgentCardNodeData, 'agentCard'>
  | Node<AgentExecutorNodeData, 'agentExecutor'>
  | Node<SkillStackNodeData, 'skillStack'>
  | Node<InterfaceStackNodeData, 'interfaceStack'>

export type ValenceEdge = Edge

export interface WorkflowGraph {
  id: string
  name: string
  nodes: ValenceNode[]
  edges: ValenceEdge[]
  viewport: Viewport
  updatedAt?: string
}
