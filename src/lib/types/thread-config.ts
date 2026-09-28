export interface ThreadConfig {
  uuid: string
  name: string
  system_prompt: string | null
  compression_prompt: string | null
  compression_token_limit: number | null
  tool_hide_rules: string[]
  auto_hide_rule: boolean
  token_limit: number | null
  per_tool_token_limit: number | null
  created_at: string
  updated_at: string
}

export interface ThreadConfigListItem {
  uuid: string
  name: string
}

export interface ThreadConfigCreatePayload {
  name: string
  system_prompt?: string | null
  compression_prompt?: string | null
  compression_token_limit?: number | null
  tool_hide_rules?: string[]
  auto_hide_rule?: boolean
  token_limit?: number | null
  per_tool_token_limit?: number | null
}

export interface ThreadConfigNodeData extends Record<string, unknown> {
  label: string
  configId?: string
  name?: string
}
