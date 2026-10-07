export interface AgentExecutor {
  uuid: string
  name: string
  host: string
  port: number
  rpc_url: string | null
  mcp_servers: string[]
  llm_config: string
  thread_config: string
  excluded_internal_tools: string[]
  system_prompt: string
  skills: string[]
  agent_card: string
  created_at: string
  updated_at: string
}

export interface AgentExecutorListItem {
  uuid: string
  name: string
  host: string
  port: number
  rpc_url: string | null
}

export interface AgentExecutorCreatePayload {
  name: string
  host: string
  port: number
  rpc_url?: string | null
  mcp_servers?: string[]
  llm_config: string
  thread_config: string
  excluded_internal_tools?: string[]
  system_prompt: string
  skills?: string[]
  agent_card: string
}

/** Response from image build (and workspace lifecycle container entries) */
export interface AgentExecutorContainer {
  uuid?: string | null
  container_name?: string | null
  status: string
  image?: string | null
  message?: string
}

export interface AgentExecutorNodeData extends Record<string, unknown> {
  label: string
  configId?: string
  name?: string
  host?: string
  port?: number
  /** Last known Docker container status from lifecycle APIs */
  containerStatus?: string | null
}
