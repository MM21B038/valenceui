export interface AgentCard {
  uuid: string
  name: string
  description: string | null
  version: string | null
  supported_interfaces: string[]
  streaming: boolean
  push_notifications: boolean
  skills: string[]
  created_at: string
  updated_at: string
}

export interface AgentCardListItem {
  uuid: string
  name: string
  version: string | null
}

export interface AgentCardCreatePayload {
  name: string
  description?: string | null
  version?: string | null
  supported_interfaces?: string[]
  streaming?: boolean
  push_notifications?: boolean
  skills?: string[]
}

export interface AgentCardNodeData extends Record<string, unknown> {
  label: string
  configId?: string
  name?: string
  version?: string | null
}
