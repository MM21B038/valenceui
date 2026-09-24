import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'

import { PromptEntityCard } from '@/features/prompts/prompt-entity-card'
import {
  ATOM_KINDS,
  COMPOUND_KINDS,
  type SpectrumZone,
} from '@/features/prompts/prompt-spectrum-nav'
import type { buildReferenceUsageIndex } from '@/lib/prompts/entity-usage'
import { previewText } from '@/lib/prompts/resolve-references'
import type { LabEntityRecord } from '@/lib/prompts/use-lab-entity-cache'
import {
  getAtomBondCount,
  getCompositionRefCount,
} from '@/lib/prompts/use-reference-usage'
import {
  ENTITY_KIND_LABELS,
  type EntityKind,
} from '@/lib/types/prompt-entities'
import type { EntityListItem } from '@/features/prompts/prompt-entity-list'

interface PromptWorkbenchGalleryProps {
  filter: SpectrumZone
  query: string
  itemsByKind: Record<EntityKind, EntityListItem[]>
  isLoading: boolean
  isError: boolean
  selectedId: string | null
  isCreating: boolean
  creatingKind: EntityKind | null
  usageIndex: ReturnType<typeof buildReferenceUsageIndex>
  records: LabEntityRecord[]
  onSelect: (kind: EntityKind, uuid: string) => void
  onCreate: (kind: EntityKind) => void
  onDelete: (kind: EntityKind, uuid: string, name: string) => void
  onCopy: (kind: EntityKind, uuid: string) => void
  onBond: (refType: 'prompt' | 'skill', uuid: string) => void
}

function filterKinds(zone: SpectrumZone): EntityKind[] {
  if (zone === 'all') return [...ATOM_KINDS, ...COMPOUND_KINDS]
  if (zone === 'atoms') return ATOM_KINDS
  if (zone === 'compounds') return COMPOUND_KINDS
  return [zone]
}

function SwimlaneSection({
  title,
  subtitle,
  kinds,
  itemsByKind,
  query,
  isLoading,
  isError,
  selectedId,
  isCreating,
  creatingKind,
  usageIndex,
  records,
  onSelect,
  onCreate,
  onDelete,
  onCopy,
  onBond,
}: {
  title: string
  subtitle: string
  kinds: EntityKind[]
  itemsByKind: Record<EntityKind, EntityListItem[]>
  query: string
  isLoading: boolean
  isError: boolean
  selectedId: string | null
  isCreating: boolean
  creatingKind: EntityKind | null
  usageIndex: ReturnType<typeof buildReferenceUsageIndex>
  records: LabEntityRecord[]
  onSelect: (kind: EntityKind, uuid: string) => void
  onCreate: (kind: EntityKind) => void
  onDelete: (kind: EntityKind, uuid: string, name: string) => void
  onCopy: (kind: EntityKind, uuid: string) => void
  onBond: (refType: 'prompt' | 'skill', uuid: string) => void
}) {
  const normalized = query.trim().toLowerCase()

  const hasVisibleItems = kinds.some((kind) => {
    const items = itemsByKind[kind] ?? []
    if (!normalized) return items.length > 0 || creatingKind === kind
    return items.some((item) => item.name.toLowerCase().includes(normalized))
  })

  if (!hasVisibleItems && !isLoading && normalized) return null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-panel-muted">{subtitle}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-panel-muted">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
          API unreachable. Is Django running?
        </p>
      ) : (
        <div className="space-y-6">
          {kinds.map((kind) => {
            const items = itemsByKind[kind] ?? []
            const filtered = normalized
              ? items.filter((item) =>
                  item.name.toLowerCase().includes(normalized),
                )
              : items
            const showLane =
              filtered.length > 0 ||
              creatingKind === kind ||
              (!normalized && items.length === 0)

            if (!showLane) return null

            const recordFor = (uuid: string) =>
              records.find((record) => record.kind === kind && record.uuid === uuid)

            return (
              <div key={kind}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
                  {ENTITY_KIND_LABELS[kind]}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {isCreating && creatingKind === kind ? (
                    <PromptEntityCard
                      kind={kind}
                      item={{
                        uuid: '__draft__',
                        name: '',
                        updated_at: new Date().toISOString(),
                      }}
                      isDraft
                      isSelected
                      onSelect={() => onSelect(kind, '__draft__')}
                    />
                  ) : null}

                  {filtered.map((item) => {
                    const record = recordFor(item.uuid)
                    return (
                      <PromptEntityCard
                        key={item.uuid}
                        kind={kind}
                        item={item}
                        preview={record ? previewText(record.content, 100) : undefined}
                        isSelected={selectedId === item.uuid && !isCreating}
                        bondCount={
                          kind === 'prompt'
                            ? getAtomBondCount(usageIndex, 'prompt', item.uuid)
                            : kind === 'skill'
                              ? getAtomBondCount(usageIndex, 'skill', item.uuid)
                              : 0
                        }
                        embeddedRefCount={getCompositionRefCount(
                          usageIndex,
                          item.uuid,
                        )}
                        onSelect={() => onSelect(kind, item.uuid)}
                        onDelete={() => onDelete(kind, item.uuid, item.name)}
                        onCopy={() => onCopy(kind, item.uuid)}
                        onBond={
                          kind === 'prompt' || kind === 'skill'
                            ? () =>
                                onBond(
                                  kind === 'skill' ? 'skill' : 'prompt',
                                  item.uuid,
                                )
                            : undefined
                        }
                      />
                    )
                  })}

                  <PromptEntityCard
                    kind={kind}
                    onSelect={() => onCreate(kind)}
                    onCreate={() => onCreate(kind)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function PromptWorkbenchGallery({
  filter,
  query,
  itemsByKind,
  isLoading,
  isError,
  selectedId,
  isCreating,
  creatingKind,
  usageIndex,
  records,
  onSelect,
  onCreate,
  onDelete,
  onCopy,
  onBond,
}: PromptWorkbenchGalleryProps) {
  const kinds = useMemo(() => filterKinds(filter), [filter])

  const showAtoms =
    filter === 'all' || filter === 'atoms' || ATOM_KINDS.includes(filter as EntityKind)
  const showCompounds =
    filter === 'all' ||
    filter === 'compounds' ||
    COMPOUND_KINDS.includes(filter as EntityKind)

  const atomKinds = kinds.filter((k) => ATOM_KINDS.includes(k))
  const compoundKinds = kinds.filter((k) => COMPOUND_KINDS.includes(k))

  const resultCount = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return kinds.reduce((sum, kind) => {
      const items = itemsByKind[kind] ?? []
      if (!normalized) return sum + items.length
      return (
        sum +
        items.filter((item) => item.name.toLowerCase().includes(normalized)).length
      )
    }, 0)
  }, [kinds, itemsByKind, query])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {showAtoms && atomKinds.length > 0 ? (
          <SwimlaneSection
            title="Atoms"
            subtitle="Building blocks — bond into compounds with @ references"
            kinds={atomKinds}
            itemsByKind={itemsByKind}
            query={query}
            isLoading={isLoading}
            isError={isError}
            selectedId={selectedId}
            isCreating={isCreating}
            creatingKind={creatingKind}
            usageIndex={usageIndex}
            records={records}
            onSelect={onSelect}
            onCreate={onCreate}
            onDelete={onDelete}
            onCopy={onCopy}
            onBond={onBond}
          />
        ) : null}

        {showAtoms && showCompounds && filter === 'all' ? (
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-connector/35 to-transparent" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-panel-muted">
              Valence bonds
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-interactive/35 to-transparent" />
          </div>
        ) : null}

        {showCompounds && compoundKinds.length > 0 ? (
          <SwimlaneSection
            title="Compounds"
            subtitle="Composed prompts — drag atoms from the shelf or type @"
            kinds={compoundKinds}
            itemsByKind={itemsByKind}
            query={query}
            isLoading={isLoading}
            isError={isError}
            selectedId={selectedId}
            isCreating={isCreating}
            creatingKind={creatingKind}
            usageIndex={usageIndex}
            records={records}
            onSelect={onSelect}
            onCreate={onCreate}
            onDelete={onDelete}
            onCopy={onCopy}
            onBond={onBond}
          />
        ) : null}

        {resultCount === 0 && query.trim() && !isLoading ? (
          <p className="py-12 text-center text-sm text-panel-muted">
            No matches for “{query.trim()}”. Try the command palette (Ctrl+K) to
            search content too.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export { filterKinds }
