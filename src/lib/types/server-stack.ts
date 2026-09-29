export interface ServerStackNodeData extends Record<string, unknown> {
  label: string
  memberIds: string[]
  /** Persisted stack entity uuid (component_uuid on the DnD component). */
  stackEntityId?: string
}
