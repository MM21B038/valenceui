import { Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { KIND_ICONS } from '@/features/prompts/prompt-spectrum-nav'
import type { LabSearchResult } from '@/lib/prompts/use-lab-entity-cache'
import {
  ENTITY_KIND_LABELS,
  type EntityKind,
} from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

const CREATE_ACTIONS: Array<{
  kind: EntityKind
  label: string
  description: string
}> = [
  {
    kind: 'prompt',
    label: 'New Prompt',
    description: 'Standalone atom block',
  },
  {
    kind: 'skill',
    label: 'New Skill',
    description: 'Reusable skill instructions',
  },
  {
    kind: 'system-prompt',
    label: 'New System Prompt',
    description: 'Compound with @ references',
  },
  {
    kind: 'compression-prompt',
    label: 'New Compression Prompt',
    description: 'Compound for compression flows',
  },
]

interface PromptCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  search: (query: string) => LabSearchResult[]
  onSelectEntity: (kind: EntityKind, uuid: string) => void
  onCreate: (kind: EntityKind) => void
}

export function PromptCommandPalette({
  open,
  onOpenChange,
  search,
  onSelectEntity,
  onCreate,
}: PromptCommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => search(query), [query, search])
  const showCreate = !query.trim() || query.trim().toLowerCase().startsWith('new')

  const createFiltered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return CREATE_ACTIONS
    return CREATE_ACTIONS.filter(
      (action) =>
        action.label.toLowerCase().includes(normalized) ||
        action.description.toLowerCase().includes(normalized),
    )
  }, [query])

  const items = useMemo(() => {
    if (query.trim() && results.length > 0) {
      return results.map((result) => ({
        type: 'entity' as const,
        ...result,
      }))
    }

    if (showCreate) {
      return createFiltered.map((action) => ({
        type: 'create' as const,
        ...action,
      }))
    }

    return results.map((result) => ({
      type: 'entity' as const,
      ...result,
    }))
  }, [query, results, showCreate, createFiltered])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, items.length - 1))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
      }
      if (event.key === 'Enter' && items[activeIndex]) {
        event.preventDefault()
        const item = items[activeIndex]
        if (item.type === 'create') {
          onCreate(item.kind)
        } else {
          onSelectEntity(item.kind, item.uuid)
        }
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, items, activeIndex, onCreate, onSelectEntity, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-panel-border px-4 py-3">
          <DialogTitle className="text-sm">Command palette</DialogTitle>
          <DialogDescription className="text-xs">
            Jump to any item, search content, or create something new
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-panel-border px-4 py-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-panel-muted" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search names & content, or type “new”…"
              className="h-10 pl-10"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-panel-muted">
              No matches. Try a different search or create something new.
            </p>
          ) : (
            <div className="space-y-0.5">
              {items.map((item, index) => {
                if (item.type === 'create') {
                  const Icon = KIND_ICONS[item.kind]
                  return (
                    <button
                      key={item.kind}
                      type="button"
                      onClick={() => {
                        onCreate(item.kind)
                        onOpenChange(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        index === activeIndex
                          ? 'bg-connector/15 text-connector'
                          : 'hover:bg-node/80',
                      )}
                    >
                      <div className="flex size-8 items-center justify-center rounded-lg bg-node-header">
                        <Plus className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-panel-muted">{item.description}</p>
                      </div>
                      <Icon className="size-4 shrink-0 opacity-50" />
                    </button>
                  )
                }

                const Icon = KIND_ICONS[item.kind]
                return (
                  <button
                    key={`${item.kind}-${item.uuid}`}
                    type="button"
                    onClick={() => {
                      onSelectEntity(item.kind, item.uuid)
                      onOpenChange(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      index === activeIndex
                        ? 'bg-connector/15 text-connector'
                        : 'hover:bg-node/80',
                    )}
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-node-header">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="truncate text-xs text-panel-muted">
                        {ENTITY_KIND_LABELS[item.kind].replace(/s$/, '')}
                        {item.preview ? ` · ${item.preview}` : ''}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-panel-border bg-panel/20 px-4 py-2 text-[10px] text-panel-muted">
          <span>↑↓ navigate · Enter select · Esc close</span>
          <span className="hidden sm:inline">Ctrl+K</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpen])
}
