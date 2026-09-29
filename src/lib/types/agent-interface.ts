export const PROTOCOL_BINDINGS = ['JSONRPC', 'HTTP+JSON', 'GRPC'] as const

export type ProtocolBinding = (typeof PROTOCOL_BINDINGS)[number]

export interface AgentInterface {
  uuid: string
  host: string
  port: number
  protocol_binding: string
  created_at: string
  updated_at: string
}

export interface AgentInterfaceCreatePayload {
  host?: string
  port?: number
  protocol_binding?: string
}

export interface AgentInterfaceNodeData extends Record<string, unknown> {
  label: string
  configId?: string
  host?: string
  port?: number
  protocol_binding?: string
  /** When set, this interface is dumped inside an interface stack and hidden. */
  stackId?: string
}

export function formatProtocolBindingLabel(binding: string) {
  const key = binding.toUpperCase()
  if (key === 'JSONRPC') return 'JSON-RPC'
  if (key === 'HTTP+JSON' || key === 'HTTP_JSON') return 'HTTP+JSON'
  if (key === 'GRPC') return 'gRPC'
  return binding
}

export function formatAgentInterfaceEndpoint(
  host?: string | null,
  port?: number | null,
) {
  if (!host) return null
  return port != null ? `${host}:${port}` : host
}
