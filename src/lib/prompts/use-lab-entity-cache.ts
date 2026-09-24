import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import { apiClient } from '@/lib/api/client'
import { promptEntityKeys } from '@/lib/api/prompt-entities'
import { labEntityKey } from '@/lib/prompts/lab-entity-key'
import { previewText } from '@/lib/prompts/resolve-references'
import type {
  CompressionPrompt,
  CompressionPromptListItem,
  EntityKind,
  Prompt,
  PromptListItem,
  Skill,
  SkillListItem,
  SystemPrompt,
  SystemPromptListItem,
} from '@/lib/types/prompt-entities'

export interface LabEntityRecord {
  kind: EntityKind
  uuid: string
  name: string
  content: string
  updated_at: string
}

export interface LabSearchResult {
  kind: EntityKind
  uuid: string
  name: string
  preview: string
  score: number
}

function useEntityDetails<T>(
  items: Array<{ uuid: string }>,
  endpoint: string,
  detailKey: (uuid: string) => readonly [string, string],
) {
  return useQueries({
    queries: items.map((item) => ({
      queryKey: detailKey(item.uuid),
      queryFn: async () => {
        const { data } = await apiClient.get<T>(`${endpoint}${item.uuid}/`)
        return data
      },
      staleTime: 60_000,
    })),
  })
}

export function useLabEntityCache(
  prompts: PromptListItem[] = [],
  skills: SkillListItem[] = [],
  systemPrompts: SystemPromptListItem[] = [],
  compressionPrompts: CompressionPromptListItem[] = [],
) {
  const promptQueries = useEntityDetails<Prompt>(
    prompts,
    '/prompt/',
    promptEntityKeys.prompts.detail,
  )

  const skillQueries = useEntityDetails<Skill>(
    skills,
    '/skill/',
    promptEntityKeys.skills.detail,
  )

  const systemQueries = useEntityDetails<SystemPrompt>(
    systemPrompts,
    '/system-prompt/',
    promptEntityKeys.systemPrompts.detail,
  )

  const compressionQueries = useEntityDetails<CompressionPrompt>(
    compressionPrompts,
    '/compression-prompt/',
    promptEntityKeys.compressionPrompts.detail,
  )

  const records = useMemo(() => {
    const entries: LabEntityRecord[] = []

    const pushFromQueries = <T>(
      kind: EntityKind,
      queries: Array<{ data?: T }>,
      pickContent: (entity: T) => string,
      pickMeta: (entity: T) => { uuid: string; name: string; updated_at: string },
    ) => {
      for (const query of queries) {
        if (!query.data) continue
        const meta = pickMeta(query.data)
        entries.push({
          kind,
          uuid: meta.uuid,
          name: meta.name,
          content: pickContent(query.data),
          updated_at: meta.updated_at,
        })
      }
    }

    pushFromQueries(
      'prompt',
      promptQueries,
      (entity) => entity.content,
      (entity) => entity,
    )
    pushFromQueries(
      'skill',
      skillQueries,
      (entity) => entity.content,
      (entity) => entity,
    )
    pushFromQueries(
      'system-prompt',
      systemQueries,
      (entity) => entity.content,
      (entity) => entity,
    )
    pushFromQueries(
      'compression-prompt',
      compressionQueries,
      (entity) => entity.prompt,
      (entity) => entity,
    )

    return entries
  }, [promptQueries, skillQueries, systemQueries, compressionQueries])

  const recordMap = useMemo(() => {
    const map = new Map<string, LabEntityRecord>()
    for (const record of records) {
      map.set(labEntityKey(record.kind, record.uuid), record)
    }
    return map
  }, [records])

  const isLoading =
    promptQueries.some((query) => query.isLoading) ||
    skillQueries.some((query) => query.isLoading) ||
    systemQueries.some((query) => query.isLoading) ||
    compressionQueries.some((query) => query.isLoading)

  const search = (query: string, limit = 12): LabSearchResult[] => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []

    const scored: LabSearchResult[] = []

    for (const record of records) {
      const name = record.name.toLowerCase()
      const content = record.content.toLowerCase()
      let score = 0

      if (name === normalized) score += 100
      else if (name.startsWith(normalized)) score += 80
      else if (name.includes(normalized)) score += 50

      if (content.includes(normalized)) score += 20

      if (score > 0) {
        scored.push({
          kind: record.kind,
          uuid: record.uuid,
          name: record.name,
          preview: previewText(record.content, 80),
          score,
        })
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  const getRecord = (kind: EntityKind, uuid: string) =>
    recordMap.get(labEntityKey(kind, uuid))

  const getPreview = (kind: EntityKind, uuid: string) => {
    const record = getRecord(kind, uuid)
    if (!record) return undefined
    return previewText(record.content, 100)
  }

  return {
    records,
    recordMap,
    isLoading,
    search,
    getRecord,
    getPreview,
  }
}
