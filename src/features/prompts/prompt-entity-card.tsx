import {
  AtSign,
  Copy,
  Link2,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { KIND_ICONS } from '@/features/prompts/prompt-spectrum-nav'
import {
  ENTITY_KIND_LABELS,
  isComposedKind,
  type EntityKind,
} from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

export interface PromptEntityCardData {
  uuid: string
  name: string
  updated_at: string
}

interface PromptEntityCardProps {
  kind: EntityKind
  item?: PromptEntityCardData
  isDraft?: boolean
  isSelected?: boolean
  preview?: string
  bondCount?: number
  embeddedRefCount?: number
  onSelect: () => void
  onDelete?: () => void
  onCopy?: () => void
  onBond?: () => void
  onCreate?: () => void
}

function CardMenu({
  onCopy,
  onBond,
  onDelete,
}: {
  onCopy?: () => void
  onBond?: () => void
  onDelete?: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((value) => !value)
        }}
        className="flex size-7 items-center justify-center rounded-lg border border-panel-border bg-background/80 text-panel-muted backdrop-blur-sm transition-colors hover:bg-node hover:text-panel-fg"
        aria-label="More actions"
      >
        <MoreHorizontal className="size-3.5" />
      </button>

      {open ? (
        <div
          className="absolute top-[calc(100%+4px)] right-0 z-20 w-44 overflow-hidden rounded-lg border border-panel-border bg-background shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          {onCopy ? (
            <button
              type="button"
              onClick={() => {
                onCopy()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-node/80"
            >
              <Copy className="size-3.5" />
              Copy content
            </button>
          ) : null}
          {onBond ? (
            <button
              type="button"
              onClick={() => {
                onBond()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-node/80"
            >
              <Link2 className="size-3.5" />
              Bond to compound
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function PromptEntityCard({
  kind,
  item,
  isDraft,
  isSelected,
  preview,
  bondCount = 0,
  embeddedRefCount = 0,
  onSelect,
  onDelete,
  onCopy,
  onBond,
  onCreate,
}: PromptEntityCardProps) {
  if (!item && onCreate) {
    return (
      <button
        type="button"
        onClick={onCreate}
        className="group flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-panel-border bg-node/20 p-4 text-panel-muted transition-all hover:border-connector/50 hover:bg-connector/5 hover:text-connector"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-node-header transition-colors group-hover:bg-connector/15">
          <Plus className="size-5" />
        </div>
        <span className="text-xs font-medium">
          New {ENTITY_KIND_LABELS[kind].replace(/s$/, '')}
        </span>
      </button>
    )
  }

  if (!item) return null

  const Icon = KIND_ICONS[kind]
  const composed = isComposedKind(kind)
  const isSkill = kind === 'skill'
  const accent = isSkill ? 'interactive' : 'connector'

  return (
    <div
      className={cn(
        'group relative flex min-h-[168px] flex-col overflow-hidden rounded-2xl border bg-node/50 transition-all duration-200',
        isDraft
          ? 'border-dashed border-connector/50 bg-connector/5'
          : isSelected
            ? 'border-connector shadow-[0_0_0_1px_var(--connector)] ring-2 ring-connector/10'
            : 'border-panel-border hover:border-connector/35 hover:shadow-md',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 flex-col p-4 text-left"
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'node-shape-hex flex size-10 shrink-0 items-center justify-center',
              accent === 'interactive'
                ? 'bg-interactive/20 text-interactive'
                : 'bg-connector/20 text-connector',
            )}
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1 pr-8 pt-0.5">
            <p className="truncate text-sm font-semibold text-node-fg">
              {isDraft ? 'Untitled draft' : item.name}
            </p>
            <p className="mt-0.5 text-[10px] text-panel-muted">
              {ENTITY_KIND_LABELS[kind].replace(/s$/, '')}
              {' · '}
              {new Date(item.updated_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {preview ? (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-panel-muted">
            {preview}
          </p>
        ) : (
          <p className="mt-3 text-xs italic text-panel-muted/60">No preview yet</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {composed ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                'bg-interactive/10 text-interactive',
              )}
            >
              <AtSign className="size-2.5" />
              {embeddedRefCount} bond{embeddedRefCount === 1 ? '' : 's'}
            </span>
          ) : bondCount > 0 ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                isSkill
                  ? 'bg-interactive/10 text-interactive'
                  : 'bg-connector/10 text-connector',
              )}
            >
              <AtSign className="size-2.5" />
              in {bondCount} compound{bondCount === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="text-[10px] text-panel-muted/70">
              {composed ? 'Weave atoms with @' : 'Ready to bond'}
            </span>
          )}
        </div>
      </button>

      {!isDraft ? (
        <div
          className={cn(
            'absolute top-3 right-3 transition-opacity group-focus-within:opacity-100',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          <CardMenu onCopy={onCopy} onBond={onBond} onDelete={onDelete} />
        </div>
      ) : null}
    </div>
  )
}
