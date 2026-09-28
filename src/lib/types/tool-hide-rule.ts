export interface ToolHideRule {
  uuid: string
  name: string
  message: string
  server: string
  created_at: string
  updated_at: string
}

export interface ToolHideRuleCreatePayload {
  name: string
  message: string
  server: string
}

export type ToolHideRuleUpdatePayload = Partial<ToolHideRuleCreatePayload>
