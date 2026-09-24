import { REFERENCE_PATTERN } from '@/lib/prompts/reference-syntax'
import type { ReferenceType } from '@/lib/types/prompt-entities'

export interface ReferenceUsageIndex {
  /** How many compositions reference each atom (prompt/skill uuid). */
  atomUsage: Map<string, number>
  /** References embedded in each composition uuid. */
  compositionRefs: Map<string, Array<{ refType: ReferenceType; uuid: string }>>
}

function extractReferences(content: string) {
  const refs: Array<{ refType: ReferenceType; uuid: string }> = []
  for (const match of content.matchAll(REFERENCE_PATTERN)) {
    const refType = match[1] as ReferenceType | undefined
    const uuid = match[2]
    if (refType && uuid) refs.push({ refType, uuid })
  }
  return refs
}

export function buildReferenceUsageIndex(
  compositions: Array<{ uuid: string; content: string }>,
): ReferenceUsageIndex {
  const atomUsage = new Map<string, number>()
  const compositionRefs = new Map<
    string,
    Array<{ refType: ReferenceType; uuid: string }>
  >()

  for (const composition of compositions) {
    const refs = extractReferences(composition.content)
    compositionRefs.set(composition.uuid, refs)

    for (const ref of refs) {
      const key = `${ref.refType}:${ref.uuid}`
      atomUsage.set(key, (atomUsage.get(key) ?? 0) + 1)
    }
  }

  return { atomUsage, compositionRefs }
}

export function atomUsageKey(refType: ReferenceType, uuid: string) {
  return `${refType}:${uuid}`
}
