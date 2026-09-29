import { type NodeProps } from '@xyflow/react'
import { Network, Sparkles } from 'lucide-react'

import { AgentBlockNode } from '@/features/canvas/nodes/agent-block-node'
import {
  formatAgentInterfaceEndpoint,
  formatProtocolBindingLabel,
  type AgentInterfaceNodeData,
} from '@/lib/types/agent-interface'
import type { AgentSkillNodeData } from '@/lib/types/agent-skill'
import { useWorkflowStore } from '@/stores/workflow-store'

export { AgentCardNode } from '@/features/canvas/nodes/agent-card-node'
export { AgentExecutorNode } from '@/features/canvas/nodes/agent-executor-node'

export function AgentSkillNode({ id, data, selected }: NodeProps) {
  const nodeData = data as AgentSkillNodeData
  const openModal = useWorkflowStore((state) => state.openAgentSkillModal)

  return (
    <AgentBlockNode
      id={id}
      selected={selected}
      themeType="agentSkill"
      title="Agent Skill"
      Icon={Sparkles}
      hasConfig={Boolean(nodeData.configId && nodeData.name)}
      primary={nodeData.name}
      onOpen={() => openModal(id)}
      shape="hex"
    />
  )
}

export function AgentInterfaceNode({ id, data, selected }: NodeProps) {
  const nodeData = data as AgentInterfaceNodeData
  const openModal = useWorkflowStore((state) => state.openAgentInterfaceModal)

  return (
    <AgentBlockNode
      id={id}
      selected={selected}
      themeType="agentInterface"
      title="Interface"
      Icon={Network}
      hasConfig={Boolean(nodeData.configId)}
      primary={
        formatAgentInterfaceEndpoint(nodeData.host, nodeData.port) ??
        formatProtocolBindingLabel(nodeData.protocol_binding ?? 'JSONRPC')
      }
      secondary={
        formatAgentInterfaceEndpoint(nodeData.host, nodeData.port)
          ? formatProtocolBindingLabel(nodeData.protocol_binding ?? 'JSONRPC')
          : undefined
      }
      onOpen={() => openModal(id)}
      shape="hex"
    />
  )
}
