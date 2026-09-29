export interface SkillTag {
  uuid: string
  name: string
}

export interface SkillTagCreatePayload {
  name: string
}

export interface AgentSkill {
  uuid: string
  name: string
  description: string | null
  tags: string[]
  examples: unknown[] | Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AgentSkillListItem {
  uuid: string
  name: string
  tags: string[]
}

export interface AgentSkillCreatePayload {
  name: string
  description?: string | null
  tags?: string[]
  examples?: unknown[] | Record<string, unknown> | null
}

export interface AgentSkillNodeData extends Record<string, unknown> {
  label: string
  configId?: string
  name?: string
  /** When set, this skill is dumped inside a skill stack and hidden on the canvas. */
  stackId?: string
}
