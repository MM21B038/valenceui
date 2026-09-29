import {
  Bot,
  BrainCircuit,
  CreditCard,
  MessagesSquare,
  Network,
  Server,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export type ComponentType =
  | 'llm'
  | 'toolServer'
  | 'threadConfig'
  | 'agentSkill'
  | 'agentInterface'
  | 'agentCard'
  | 'agentExecutor'

export interface PaletteComponent {
  type: ComponentType
  label: string
  description: string
  icon: LucideIcon
}

export const PALETTE_COMPONENTS: PaletteComponent[] = [
  {
    type: 'llm',
    label: 'LLM',
    description: 'Language model agent block',
    icon: BrainCircuit,
  },
  {
    type: 'toolServer',
    label: 'Tool Server',
    description: 'MCP tool server block',
    icon: Server,
  },
  {
    type: 'threadConfig',
    label: 'Thread Config',
    description: 'Thread prompts, limits & hide rules',
    icon: MessagesSquare,
  },
  {
    type: 'agentSkill',
    label: 'Agent Skill',
    description: 'A2A discovery skill',
    icon: Sparkles,
  },
  {
    type: 'agentInterface',
    label: 'Agent Interface',
    description: 'A2A transport interface',
    icon: Network,
  },
  {
    type: 'agentCard',
    label: 'Agent Card',
    description: 'A2A agent card',
    icon: CreditCard,
  },
  {
    type: 'agentExecutor',
    label: 'Agent Executor',
    description: 'Runnable agent executor',
    icon: Bot,
  },
]

export function getPaletteComponent(type: ComponentType) {
  const component = PALETTE_COMPONENTS.find((item) => item.type === type)
  if (!component) {
    throw new Error(`Unknown palette component: ${type}`)
  }
  return component
}
