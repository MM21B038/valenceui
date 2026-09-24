import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import { apiClient } from '@/lib/api/client'
import { promptEntityKeys } from '@/lib/api/prompt-entities'
import {
  atomUsageKey,
  buildReferenceUsageIndex,
} from '@/lib/prompts/entity-usage'
import type {
  CompressionPrompt,
  CompressionPromptListItem,
  SystemPrompt,
  SystemPromptListItem,
} from '@/lib/types/prompt-entities'

function useCompositionContents(
  systemItems: SystemPromptListItem[],
  compressionItems: CompressionPromptListItem[],
) {
  const systemQueries = useQueries({
    queries: systemItems.map((item) => ({
      queryKey: promptEntityKeys.systemPrompts.detail(item.uuid),
      queryFn: async () => {
        const { data } = await apiClient.get<SystemPrompt>(
          `/system-prompt/${item.uuid}/`,
        )
        return data
      },
      staleTime: 60_000,
    })),
  })

  const compressionQueries = useQueries({
    queries: compressionItems.map((item) => ({
      queryKey: promptEntityKeys.compressionPrompts.detail(item.uuid),
      queryFn: async () => {
        const { data } = await apiClient.get<CompressionPrompt>(
          `/compression-prompt/${item.uuid}/`,
        )
        return data
      },
      staleTime: 60_000,
    })),
  })

  const isLoading =
    systemQueries.some((query) => query.isLoading) ||
    compressionQueries.some((query) => query.isLoading)

  const compositions = useMemo(() => {
    const entries: Array<{ uuid: string; content: string }> = []

    for (const query of systemQueries) {
      if (query.data) {
        entries.push({ uuid: query.data.uuid, content: query.data.content })
      }
    }

    for (const query of compressionQueries) {
      if (query.data) {
        entries.push({ uuid: query.data.uuid, content: query.data.prompt })
      }
    }

    return entries
  }, [systemQueries, compressionQueries])

  return { compositions, isLoading }
}

export function useReferenceUsage(
  systemItems: SystemPromptListItem[] = [],
  compressionItems: CompressionPromptListItem[] = [],
) {
  const { compositions, isLoading } = useCompositionContents(
    systemItems,
    compressionItems,
  )

  const index = useMemo(
    () => buildReferenceUsageIndex(compositions),
    [compositions],
  )

  return { index, isLoading }
}

export function getAtomBondCount(
  index: ReturnType<typeof buildReferenceUsageIndex>,
  refType: 'prompt' | 'skill',
  uuid: string,
) {
  return index.atomUsage.get(atomUsageKey(refType, uuid)) ?? 0
}

export function getCompositionRefCount(
  index: ReturnType<typeof buildReferenceUsageIndex>,
  uuid: string,
) {
  return index.compositionRefs.get(uuid)?.length ?? 0
}
