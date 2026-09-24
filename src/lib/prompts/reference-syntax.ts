import type { ReferenceType } from '@/lib/types/prompt-entities'

export const REFERENCE_PATTERN =
  /\[(prompt|skill)\]\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)/g

export interface TextSegment {
  type: 'text'
  value: string
}

export interface ReferenceSegment {
  type: 'reference'
  refType: ReferenceType
  uuid: string
  name?: string
}

export type ComposerSegment = TextSegment | ReferenceSegment

export interface ReferenceLookupEntry {
  refType: ReferenceType
  name: string
}

export function referenceKey(refType: ReferenceType, uuid: string) {
  return `${refType}:${uuid}`
}

function referenceToken(segment: ReferenceSegment) {
  return `[${segment.refType}](${segment.uuid})`
}

export interface MentionTrigger {
  query: string
  start: number
  end: number
}

export function getMentionTrigger(value: string, cursor: number): MentionTrigger | null {
  const before = value.slice(0, cursor)
  const match = before.match(/@([^\s@[\]()]{0,40})$/)
  if (!match || match.index === undefined) return null

  return {
    query: match[1] ?? '',
    start: match.index,
    end: cursor,
  }
}

export function mergeAdjacentText(segments: ComposerSegment[]) {
  const merged: ComposerSegment[] = []

  for (const segment of segments) {
    const previous = merged.at(-1)
    if (segment.type === 'text' && previous?.type === 'text') {
      merged[merged.length - 1] = {
        type: 'text',
        value: previous.value + segment.value,
      }
      continue
    }
    merged.push(segment)
  }

  return merged
}

export function ensureEditableSlots(segments: ComposerSegment[]) {
  const merged = mergeAdjacentText(segments)
  const result: ComposerSegment[] = []

  for (let index = 0; index < merged.length; index++) {
    const segment = merged[index]
    if (!segment) continue

    if (segment.type === 'text' && segment.value === '') {
      const previous = result[result.length - 1]
      const next = merged[index + 1]
      if (previous?.type !== 'reference' && next?.type !== 'reference') {
        continue
      }
    }

    result.push(segment)

    if (segment.type === 'reference') {
      const next = merged[index + 1]
      if (!next || next.type !== 'text') {
        result.push({ type: 'text', value: '' })
      }
    }
  }

  if (result.length === 0) {
    result.push({ type: 'text', value: '' })
  }

  if (result[result.length - 1]?.type === 'reference') {
    result.push({ type: 'text', value: '' })
  }

  return result
}

export function parseComposerContent(
  content: string,
  nameLookup?: Map<string, ReferenceLookupEntry>,
  forEditing = true,
): ComposerSegment[] {
  if (!content) {
    return forEditing ? [{ type: 'text', value: '' }] : []
  }

  const segments: ComposerSegment[] = []
  let lastIndex = 0

  for (const match of content.matchAll(REFERENCE_PATTERN)) {
    const index = match.index ?? 0

    if (index > lastIndex) {
      segments.push({ type: 'text', value: content.slice(lastIndex, index) })
    }

    const refType = match[1] as ReferenceType | undefined
    const uuid = match[2]
    if (!refType || !uuid) continue

    const lookup = nameLookup?.get(referenceKey(refType, uuid))

    segments.push({
      type: 'reference',
      refType,
      uuid,
      name: lookup?.name,
    })

    lastIndex = index + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) })
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', value: content })
  }

  return forEditing ? ensureEditableSlots(segments) : mergeAdjacentText(segments)
}

export function serializeComposerContent(segments: ComposerSegment[]) {
  const merged = mergeAdjacentText(segments)
  const trimmed = [...merged]

  while (trimmed.length > 1) {
    const last = trimmed[trimmed.length - 1]
    if (last?.type !== 'text' || last.value !== '') break
    trimmed.pop()
  }

  const only = trimmed[0]
  if (trimmed.length === 1 && only?.type === 'text' && only.value === '') {
    return ''
  }

  return trimmed
    .map((segment) =>
      segment.type === 'text' ? segment.value : referenceToken(segment),
    )
    .join('')
}

export function normalizeSegments(segments: ComposerSegment[]) {
  return ensureEditableSlots(segments)
}

export function insertReferenceAt(
  segments: ComposerSegment[],
  index: number,
  reference: ReferenceSegment,
) {
  const next = [...ensureEditableSlots(segments)]
  const boundedIndex = Math.max(0, Math.min(index, next.length))
  next.splice(boundedIndex, 0, reference)
  return ensureEditableSlots(next)
}

export function insertReferenceAtCursor(
  segments: ComposerSegment[],
  segmentIndex: number,
  cursor: number,
  reference: ReferenceSegment,
) {
  const next = [...ensureEditableSlots(segments)]
  const segment = next[segmentIndex]

  if (!segment || segment.type !== 'text') {
    return insertReferenceAt(next, segmentIndex, reference)
  }

  const before = segment.value.slice(0, cursor)
  const after = segment.value.slice(cursor)

  const replacement: ComposerSegment[] = []
  if (before || next[segmentIndex - 1]?.type !== 'reference') {
    replacement.push({ type: 'text', value: before })
  }
  replacement.push(reference)
  replacement.push({ type: 'text', value: after })

  next.splice(segmentIndex, 1, ...replacement)
  return ensureEditableSlots(next)
}

export function removeReferenceAt(segments: ComposerSegment[], refIndex: number) {
  const next = [...segments]
  const reference = next[refIndex]
  if (reference?.type !== 'reference') return ensureEditableSlots(next)

  const before = next[refIndex - 1]
  const after = next[refIndex + 1]

  next.splice(refIndex, 1)

  if (before?.type === 'text' && after?.type === 'text') {
    const mergedValue = before.value + after.value
    next.splice(refIndex - 1, 2, { type: 'text', value: mergedValue })
  }

  return ensureEditableSlots(next)
}

export function findFocusAfterInsert(
  segments: ComposerSegment[],
  insertedAt: number,
): { segmentIndex: number; cursor: number } {
  for (let index = insertedAt; index < segments.length; index++) {
    const segment = segments[index]
    if (segment?.type === 'text') {
      return { segmentIndex: index, cursor: 0 }
    }
  }

  for (let index = insertedAt - 1; index >= 0; index--) {
    const segment = segments[index]
    if (segment?.type === 'text') {
      return { segmentIndex: index, cursor: segment.value.length }
    }
  }

  return { segmentIndex: 0, cursor: 0 }
}

export const REFERENCE_INSERT_PREFIX = 'reference-insert:'

export function referenceInsertId(index: number) {
  return `${REFERENCE_INSERT_PREFIX}${index}`
}

export function parseReferenceInsertIndex(id: string | number) {
  const value = String(id)
  if (!value.startsWith(REFERENCE_INSERT_PREFIX)) return null
  const index = Number.parseInt(value.slice(REFERENCE_INSERT_PREFIX.length), 10)
  return Number.isNaN(index) ? null : index
}

export function countReferences(content: string) {
  return [...content.matchAll(REFERENCE_PATTERN)].length
}
