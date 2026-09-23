import { BrainCircuit, Server, type LucideIcon } from 'lucide-react'

export type ComponentType = 'llm' | 'toolServer'

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
]

export function getPaletteComponent(type: ComponentType) {
  const component = PALETTE_COMPONENTS.find((item) => item.type === type)
  if (!component) {
    throw new Error(`Unknown palette component: ${type}`)
  }
  return component
}
