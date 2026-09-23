export interface LlmProviderOptionsResponse {
  providers: string[]
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  openai_compatible: 'OpenAI Compatible',
  open_router: 'OpenRouter',
}

export function formatProviderLabel(provider: string) {
  const known = PROVIDER_LABELS[provider.toLowerCase()]
  if (known) return known

  return provider
    .split('_')
    .map((part) => {
      const lower = part.toLowerCase()
      if (lower === 'openai') return 'OpenAI'
      if (lower === 'api') return 'API'
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    })
    .join(' ')
}

export function getProviderDescription(provider: string) {
  const key = provider.toLowerCase()
  if (key === 'openai_compatible') return 'Any OpenAI-compatible endpoint'
  if (key === 'open_router') return 'Multi-model routing gateway'
  return null
}

export interface LlmConfig {
  uuid: string
  provider: string
  model: string
  base_url: string | null
  created_at: string
  updated_at: string
}

export interface LlmConfigCreatePayload {
  provider: string
  model: string
  base_url?: string | null
  api_key?: string | null
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface LlmChatRequest {
  message: string
  servers?: string[]
}

export interface LlmChatResponse {
  message: string
}

export interface LlmChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface LlmNodeData extends Record<string, unknown> {
  label: string
  configId?: string
  provider?: string
  model?: string
  baseUrl?: string | null
}
