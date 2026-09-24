import { ChevronDown, FileText, Layers, Minimize2, Plus, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  ENTITY_KIND_LABELS,
  type EntityKind,
} from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

const CREATE_OPTIONS: Array<{
  kind: EntityKind
  icon: typeof FileText
  hint: string
}> = [
  { kind: 'prompt', icon: FileText, hint: 'Atom · reusable block' },
  { kind: 'skill', icon: Sparkles, hint: 'Atom · skill instructions' },
  { kind: 'system-prompt', icon: Layers, hint: 'Compound · weave with @' },
  {
    kind: 'compression-prompt',
    icon: Minimize2,
    hint: 'Compound · compression flow',
  },
]

interface PromptCreateMenuProps {
  onCreate: (kind: EntityKind) => void
}

export function PromptCreateMenu({ onCreate }: PromptCreateMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        className="h-8 gap-1.5 bg-connector pr-2 pl-2.5 text-white hover:bg-connector/90"
      >
        <Plus className="size-3.5" />
        Create
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </Button>

      {open ? (
        <div className="absolute top-[calc(100%+6px)] right-0 z-50 w-64 overflow-hidden rounded-xl border border-panel-border bg-background shadow-xl">
          <div className="border-b border-panel-border px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
              What are you making?
            </p>
          </div>
          <div className="p-1.5">
            {CREATE_OPTIONS.map(({ kind, icon: Icon, hint }) => (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  onCreate(kind)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-node/80"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-node-header">
                  <Icon className="size-4 text-connector" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium">
                    {ENTITY_KIND_LABELS[kind].replace(/s$/, '')}
                  </p>
                  <p className="text-[10px] text-panel-muted">{hint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
