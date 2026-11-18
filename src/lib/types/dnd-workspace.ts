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

/** Response from workspace run / stop / stop-remove */
export interface WorkspaceContainerResult {
  network: string | null
  containers: Array<{
    uuid?: string | null
    container_name?: string | null
    status: string
    image?: string | null
    message?: string
  }>
}

/** Aggregate Docker state for a workspace */
export type WorkspaceAggregateState =
  | 'not_started'
  | 'running'
  | 'partial'
  | 'stopped'

export interface WorkspaceNetworkStatus {
  name: string
  exists: boolean
}

export interface WorkspaceExecutorStatus {
  agent_executor_uuid: string
  name: string | null
  host: string | null
  port: number | null
  container_name: string | null
  /** Docker status or "not_found" */
  container_status: string
  image: string | null
  connected_to?: string[]
}

/** GET /workspace/<uuid>/status/ */
export interface WorkspaceStatusResponse {
  workspace_uuid: string
  workspace_name: string
  workspace_type: WorkspaceType
  state: WorkspaceAggregateState
  network: WorkspaceNetworkStatus | null
  executors: WorkspaceExecutorStatus[]
}

export interface ProcessContainerSummary {
  agent_executor_uuid: string
  name: string | null
  container_status: string
  container_name: string | null
  port: number | null
}

export interface ProcessWorkspaceSummary {
  workspace_uuid: string
  workspace_name: string
  workspace_type: WorkspaceType
  state: WorkspaceAggregateState
  running_count: number
  expected_count: number
  containers: ProcessContainerSummary[]
}

/** GET /processes/ */
export interface ProcessListResponse {
  processes: ProcessWorkspaceSummary[]
}
