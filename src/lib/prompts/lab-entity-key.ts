import type { EntityKind } from '@/lib/types/prompt-entities'

export function labEntityKey(kind: EntityKind, uuid: string) {
  return `${kind}:${uuid}`
}

export function parseLabEntityKey(key: string): { kind: EntityKind; uuid: string } | null {
  const separator = key.indexOf(':')
  if (separator === -1) return null

  const kind = key.slice(0, separator) as EntityKind
  const uuid = key.slice(separator + 1)
  if (!uuid) return null

  return { kind, uuid }
}
