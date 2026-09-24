import { Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ENTITY_ICONS } from '@/features/prompts/prompt-category-nav'
import {
  ENTITY_KIND_LABELS,
  type EntityKind,
} from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

export interface EntityListItem {
  uuid: string
  name: string
  updated_at: string
}

interface PromptEntityListProps {
  kind: EntityKind
  items: EntityListItem[]
  isLoading: boolean
  isError: boolean
  selectedId: string | null
  isCreating: boolean
  onSelect: (uuid: string) => void
  onCreate: () => void
  onDelete?: (uuid: string, name: string) => void
}

export function PromptEntityList({
  kind,
  items,
  isLoading,
  isError,
  selectedId,
  isCreating,
  onSelect,
  onCreate,
  onDelete,
}: PromptEntityListProps) {
  const [query, setQuery] = useState('')
  const Icon = ENTITY_ICONS[kind]

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return items
    return items.filter((item) =>
      item.name.toLowerCase().includes(normalized),
    )
  }, [items, query])

  return (
    <div className="flex min-h-0 flex-col border-r border-panel-border bg-panel-inspector/30">
      <div className="space-y-3 border-b border-panel-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold">{ENTITY_KIND_LABELS[kind]}</p>
            <p className="text-[10px] text-panel-muted">
              {items.length} total
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onCreate}
            className="h-7 gap-1 bg-connector px-2.5 text-[11px] text-white hover:bg-connector/90"
          >
            <Plus className="size-3.5" />
            New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-panel-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isCreating ? (
          <div className="mb-2 rounded-xl border border-dashed border-connector/40 bg-connector/5 px-3 py-2.5">
            <p className="text-xs font-medium text-connector">New draft</p>
            <p className="text-[10px] text-panel-muted">Unsaved item</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-10 text-panel-muted">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : isError ? (
          <p className="px-2 py-4 text-[11px] text-destructive">
            API unreachable. Is Django running?
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-[11px] text-panel-muted">
            {query
              ? 'No matches found.'
              : `No ${ENTITY_KIND_LABELS[kind].toLowerCase()} yet.`}
          </p>
        ) : (
          <div className="space-y-1">
            {filtered.map((item) => {
              const isSelected = selectedId === item.uuid && !isCreating

              return (
                <div
                  key={item.uuid}
                  className={cn(
                    'group/card relative rounded-xl transition-colors',
                    isSelected
                      ? 'bg-node ring-1 ring-connector/40'
                      : 'hover:bg-node/70',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(item.uuid)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        isSelected ? 'bg-connector/15' : 'bg-node-header',
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-3.5',
                          isSelected ? 'text-connector' : 'text-panel-muted',
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1 pr-8">
                      <p className="truncate text-xs font-medium">{item.name}</p>
                      <p className="mt-0.5 text-[10px] text-panel-muted">
                        {new Date(item.updated_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </button>

                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(item.uuid, item.name)}
                      className={cn(
                        'absolute top-2.5 right-2 flex size-6 items-center justify-center rounded-md border border-panel-border bg-background text-panel-muted opacity-0 transition-opacity hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive group-hover/card:opacity-100',
                        isSelected && 'opacity-100',
                      )}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
