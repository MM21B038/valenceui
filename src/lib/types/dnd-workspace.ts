export type WorkspaceType = 'agent-executor' | 'a2a'

export type DndComponentType =
  | 'mcp-server'
  | 'llm-config'
  | 'thread-config'
  | 'agent-skill'
  | 'agent-interface'
  | 'agent-card'
  | 'agent-executor'
  | 'server-stack'
  | 'agent-skill-stack'
  | 'agent-interface-stack'

export interface DndComponent {
  uuid: string
  type: DndComponentType
  position_x: number
  position_y: number
  color_code: string
  component_uuid: string | null
  created_at: string
  updated_at: string
}

export interface DndComponentCreatePayload {
  type: DndComponentType
  position_x?: number
  position_y?: number
  color_code?: string
  component_uuid?: string | null
}

export interface DndConnection {
  uuid: string
  source: string
  target: string
}

export interface DndConnectionDetail {
  uuid: string
  source: DndComponent
  target: DndComponent
}

export interface DndConnectionCreatePayload {
  source: string
  target: string
}

export interface WorkspaceListItem {
  uuid: string
  name: string
  type: WorkspaceType
}

export interface WorkspaceDetail {
  uuid: string
  name: string
  type: WorkspaceType
  components: DndComponent[]
  connections: DndConnectionDetail[]
  created_at: string
  updated_at: string
}

export interface WorkspaceCreatePayload {
  name: string
  type: WorkspaceType
  components?: string[]
  connections?: string[]
}

export interface WorkspaceUpdatePayload {
  name?: string
  type?: WorkspaceType
  components?: string[]
  connections?: string[]
}

export interface ServerStackEntity {
  uuid: string
  servers: string[]
}

export interface AgentSkillStackEntity {
  uuid: string
  agent_skills: string[]
}

export interface AgentInterfaceStackEntity {
  uuid: string
  agent_interfaces: string[]
}
