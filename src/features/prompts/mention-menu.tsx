import { FileText, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { ReferenceType } from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

export interface MentionOption {
  refType: ReferenceType
  uuid: string
  name: string
}

interface MentionMenuProps {
  options: MentionOption[]
  query: string
  anchorRect: DOMRect | null
  onSelect: (option: MentionOption) => void
  onClose: () => void
}

export function MentionMenu({
  options,
  query,
  anchorRect,
  onSelect,
  onClose,
}: MentionMenuProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter((option) =>
      option.name.toLowerCase().includes(normalized),
    )
  }, [options, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, filtered.length])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!listRef.current?.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((index) => (index + 1) % Math.max(filtered.length, 1))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((index) =>
          index === 0 ? Math.max(filtered.length - 1, 0) : index - 1,
        )
        return
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        const option = filtered[activeIndex]
        if (!option) return
        event.preventDefault()
        onSelect(option)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [activeIndex, filtered, onClose, onSelect])

  if (!anchorRect) return null

  const style = {
    top: anchorRect.bottom + 6,
    left: Math.max(12, anchorRect.left),
  }

  const menu = (
    <div
      ref={listRef}
      style={style}
      className="fixed z-[100] w-64 overflow-hidden rounded-xl border border-panel-border bg-panel-inspector shadow-xl"
    >
      <div className="border-b border-panel-border px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
          Insert reference
        </p>
        <p className="text-[11px] text-panel-muted">
          @{query || '…'} · ↑↓ navigate · Enter select
        </p>
      </div>

      <div className="max-h-52 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-panel-muted">
            No matches for @{query}
          </p>
        ) : (
          filtered.map((option, index) => {
            const isSkill = option.refType === 'skill'
            const isActive = index === activeIndex

            return (
              <button
                key={`${option.refType}-${option.uuid}`}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => onSelect(option)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
                  isActive ? 'bg-node' : 'hover:bg-node/70',
                  isSkill ? 'text-interactive' : 'text-connector',
                )}
              >
                {isSkill ? (
                  <Sparkles className="size-3.5 shrink-0" />
                ) : (
                  <FileText className="size-3.5 shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate font-medium">
                  {option.name}
                </span>
                <span className="text-[9px] uppercase text-panel-muted">
                  {option.refType}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  return createPortal(menu, document.body)
}
