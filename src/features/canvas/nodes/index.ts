import type { NodeTypes } from '@xyflow/react'

import { LlmNode } from '@/features/canvas/nodes/llm-node'
import { ServerStackNode } from '@/features/canvas/nodes/server-stack-node'
import { ToolServerNode } from '@/features/canvas/nodes/tool-server-node'

export const nodeTypes: NodeTypes = {
  llm: LlmNode,
  toolServer: ToolServerNode,
  serverStack: ServerStackNode,
}
