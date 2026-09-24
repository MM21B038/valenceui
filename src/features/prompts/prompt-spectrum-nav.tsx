import {
  FileText,
  Layers,
  Link2,
  Minimize2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

import {
  ENTITY_KIND_LABELS,
  type EntityKind,
} from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

export type SpectrumZone = 'all' | 'atoms' | 'compounds' | EntityKind

const ATOM_KINDS: EntityKind[] = ['prompt', 'skill']
const COMPOUND_KINDS: EntityKind[] = ['system-prompt', 'compression-prompt']

const KIND_ICONS: Record<EntityKind, LucideIcon> = {
  prompt: FileText,
  skill: Sparkles,
  'system-prompt': Layers,
  'compression-prompt': Minimize2,
}

interface PromptSpectrumNavProps {
  active: SpectrumZone
  onSelect: (zone: SpectrumZone) => void
  counts: Record<EntityKind, number>
  resultCount?: number
}

function NavPill({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-[11px] font-medium transition-all',
        active
          ? 'bg-connector/15 text-connector ring-1 ring-connector/25'
          : 'text-panel-muted hover:bg-node/70 hover:text-panel-fg',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function PromptSpectrumNav({
  active,
  onSelect,
  counts,
  resultCount,
}: PromptSpectrumNavProps) {
  const atomTotal = ATOM_KINDS.reduce((sum, kind) => sum + counts[kind], 0)
  const compoundTotal = COMPOUND_KINDS.reduce(
    (sum, kind) => sum + counts[kind],
    0,
  )

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-panel-border bg-panel/30 px-5 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <NavPill active={active === 'all'} onClick={() => onSelect('all')}>
          All
        </NavPill>
        <NavPill active={active === 'atoms'} onClick={() => onSelect('atoms')}>
          Atoms ({atomTotal})
        </NavPill>
        <NavPill
          active={active === 'compounds'}
          onClick={() => onSelect('compounds')}
        >
          Compounds ({compoundTotal})
        </NavPill>

        <span className="mx-1 hidden h-4 w-px bg-panel-border sm:inline" />

        {ATOM_KINDS.map((kind) => (
          <NavPill
            key={kind}
            active={active === kind}
            onClick={() => onSelect(kind)}
          >
            {ENTITY_KIND_LABELS[kind].replace(/s$/, '')} ({counts[kind]})
          </NavPill>
        ))}

        <Link2 className="mx-0.5 hidden size-3 text-panel-muted/40 sm:inline" />

        {COMPOUND_KINDS.map((kind) => (
          <NavPill
            key={kind}
            active={active === kind}
            onClick={() => onSelect(kind)}
            className={
              active === kind ? 'bg-interactive/15 text-interactive ring-interactive/25' : ''
            }
          >
            {kind === 'system-prompt'
              ? 'System'
              : 'Compression'} ({counts[kind]})
          </NavPill>
        ))}
      </div>

      {resultCount !== undefined ? (
        <p className="text-[10px] text-panel-muted">
          {resultCount} shown
        </p>
      ) : null}
    </div>
  )
}

export { ATOM_KINDS, COMPOUND_KINDS, KIND_ICONS }
