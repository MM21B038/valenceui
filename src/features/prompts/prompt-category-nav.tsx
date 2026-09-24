import {
  FileText,
  Layers,
  Minimize2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

import {
  ENTITY_KIND_LABELS,
  type EntityKind,
} from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

const ENTITY_ICONS: Record<EntityKind, LucideIcon> = {
  prompt: FileText,
  skill: Sparkles,
  'system-prompt': Layers,
  'compression-prompt': Minimize2,
}

const NAV_GROUPS: Array<{
  label: string
  description: string
  kinds: EntityKind[]
}> = [
  {
    label: 'Basics',
    description: 'Standalone content',
    kinds: ['prompt', 'skill'],
  },
  {
    label: 'Composed',
    description: 'Embed references with @',
    kinds: ['system-prompt', 'compression-prompt'],
  },
]

interface PromptCategoryNavProps {
  activeKind: EntityKind
  onSelect: (kind: EntityKind) => void
  counts: Record<EntityKind, number>
}

export function PromptCategoryNav({
  activeKind,
  onSelect,
  counts,
}: PromptCategoryNavProps) {
  return (
    <nav className="flex min-h-0 flex-col border-r border-panel-border bg-panel/60 p-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-5 last:mb-0">
          <div className="mb-2 px-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
              {group.label}
            </p>
            <p className="mt-0.5 text-[10px] text-panel-muted/80">
              {group.description}
            </p>
          </div>
          <div className="space-y-1">
            {group.kinds.map((kind) => {
              const Icon = ENTITY_ICONS[kind]
              const isActive = activeKind === kind
              const count = counts[kind]

              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => onSelect(kind)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors',
                    isActive
                      ? 'bg-connector/15 text-connector ring-1 ring-connector/25'
                      : 'text-panel-fg hover:bg-node/80',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg',
                      isActive ? 'bg-connector/20' : 'bg-node',
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {ENTITY_KIND_LABELS[kind]}
                    </p>
                    <p className="text-[10px] text-panel-muted">
                      {count} item{count === 1 ? '' : 's'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

export { ENTITY_ICONS }
