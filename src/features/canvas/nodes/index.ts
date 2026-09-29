import type { NodeTypes } from '@xyflow/react'

import {
  AgentCardNode,
  AgentExecutorNode,
  AgentInterfaceNode,
  AgentSkillNode,
} from '@/features/canvas/nodes/agent-nodes'
import {
  InterfaceStackNode,
  ServerStackNode,
  SkillStackNode,
} from '@/features/canvas/nodes/group-stack-node'
import { LlmNode } from '@/features/canvas/nodes/llm-node'
import { ThreadConfigNode } from '@/features/canvas/nodes/thread-config-node'
import { ToolServerNode } from '@/features/canvas/nodes/tool-server-node'

export const nodeTypes: NodeTypes = {
  llm: LlmNode,
  toolServer: ToolServerNode,
  serverStack: ServerStackNode,
  threadConfig: ThreadConfigNode,
  agentSkill: AgentSkillNode,
  agentInterface: AgentInterfaceNode,
  agentCard: AgentCardNode,
  agentExecutor: AgentExecutorNode,
  skillStack: SkillStackNode,
  interfaceStack: InterfaceStackNode,
}
