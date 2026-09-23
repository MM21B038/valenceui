export interface McpTransportOptionsResponse {
  providers: string[]
}

export interface McpServerConfig {
  uuid: string
  name: string
  transport: string
  url: string | null
  command: string | null
  args: unknown[] | Record<string, unknown> | null
  env: Record<string, string> | null
  created_at: string
  updated_at: string
}

export interface McpServerConfigListItem {
  uuid: string
  name: string
  transport: string
}

export interface McpServerConfigCreatePayload {
  name: string
  transport: string
  url?: string | null
  command?: string | null
  args?: unknown[] | Record<string, unknown> | null
  env?: Record<string, string> | null
}

export interface ToolServerNodeData extends Record<string, unknown> {
  label: string
  configId?: string
  name?: string
  transport?: string
  /** When set, this server is dumped inside a stack and hidden on the canvas. */
  stackId?: string
}

export function formatTransportLabel(transport: string) {
  const key = transport.toLowerCase()
  if (key === 'http') return 'HTTP'
  if (key === 'stdio') return 'Stdio'
  if (key === 'sse') return 'SSE'
  return transport
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function getTransportDescription(transport: string) {
  const key = transport.toLowerCase()
  if (key === 'stdio') return 'Local process via stdin/stdout'
  if (key === 'sse') return 'Server-sent events endpoint'
  if (key === 'http') return 'Remote HTTP MCP server'
  return null
}

export function isStdioTransport(transport: string) {
  return transport.toLowerCase() === 'stdio'
}
