export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Prompt {
  uuid: string
  name: string
  content: string
  server: string | null
  created_at: string
  updated_at: string
}

export interface PromptListItem {
  uuid: string
  name: string
  server: string | null
  created_at: string
  updated_at: string
}

export interface PromptCreatePayload {
  name: string
  content: string
  server?: string | null
}

export interface Skill {
  uuid: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

export interface SkillListItem {
  uuid: string
  name: string
  created_at: string
  updated_at: string
}

export interface SkillCreatePayload {
  name: string
  content: string
}

export interface SystemPrompt {
  uuid: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

export interface SystemPromptListItem {
  uuid: string
  name: string
  created_at: string
  updated_at: string
}

export interface SystemPromptCreatePayload {
  name: string
  content: string
}

export interface CompressionPrompt {
  uuid: string
  name: string
  prompt: string
  created_at: string
  updated_at: string
}

export interface CompressionPromptListItem {
  uuid: string
  name: string
  created_at: string
  updated_at: string
}

export interface CompressionPromptCreatePayload {
  name: string
  prompt: string
}

export type ReferenceType = 'prompt' | 'skill'

export type EntityKind =
  | 'prompt'
  | 'skill'
  | 'system-prompt'
  | 'compression-prompt'

export const ENTITY_KIND_LABELS: Record<EntityKind, string> = {
  prompt: 'Prompts',
  skill: 'Skills',
  'system-prompt': 'System Prompts',
  'compression-prompt': 'Compression Prompts',
}

export const ENTITY_KIND_DESCRIPTIONS: Record<EntityKind, string> = {
  prompt: 'Reusable prompt blocks with full content',
  skill: 'Reusable skill instructions with full content',
  'system-prompt': 'Compose with text and prompt/skill references',
  'compression-prompt': 'Compose with text and prompt/skill references',
}

export function isComposedKind(kind: EntityKind) {
  return kind === 'system-prompt' || kind === 'compression-prompt'
}
