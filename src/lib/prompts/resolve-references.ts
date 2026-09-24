import {
  parseComposerContent,
  referenceKey,
  REFERENCE_PATTERN,
  type ReferenceLookupEntry,
} from '@/lib/prompts/reference-syntax'
import type { ReferenceType } from '@/lib/types/prompt-entities'

export type AtomContentLookup = Map<string, ReferenceLookupEntry & { content: string }>

export function buildAtomContentLookup(
  prompts: Array<{ uuid: string; name: string; content: string }>,
  skills: Array<{ uuid: string; name: string; content: string }>,
): AtomContentLookup {
  const lookup: AtomContentLookup = new Map()

  for (const prompt of prompts) {
    lookup.set(referenceKey('prompt', prompt.uuid), {
      refType: 'prompt',
      name: prompt.name,
      content: prompt.content,
    })
  }

  for (const skill of skills) {
    lookup.set(referenceKey('skill', skill.uuid), {
      refType: 'skill',
      name: skill.name,
      content: skill.content,
    })
  }

  return lookup
}

export function resolveCompositionContent(
  content: string,
  lookup: AtomContentLookup,
) {
  const nameLookup = new Map<string, ReferenceLookupEntry>()
  for (const [key, entry] of lookup) {
    nameLookup.set(key, { refType: entry.refType, name: entry.name })
  }

  const segments = parseComposerContent(content, nameLookup, false)

  return segments
    .map((segment) => {
      if (segment.type === 'text') return segment.value

      const entry = lookup.get(referenceKey(segment.refType, segment.uuid))
      if (!entry) {
        return `[missing ${segment.refType}: ${segment.name ?? segment.uuid}]`
      }

      return entry.content
    })
    .join('')
}

export function extractReferenceTokens(content: string) {
  const refs: Array<{ refType: ReferenceType; uuid: string }> = []

  for (const match of content.matchAll(REFERENCE_PATTERN)) {
    const refType = match[1] as ReferenceType | undefined
    const uuid = match[2]
    if (refType && uuid) refs.push({ refType, uuid })
  }

  return refs
}

export function previewText(content: string, maxLength = 120) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}…`
}
