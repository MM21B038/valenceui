import { FileText, Layers, Minimize2, Sparkles } from 'lucide-react'

import type { EntityKind } from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

const SEEDS: Array<{
  kind: EntityKind
  label: string
  icon: typeof FileText
  accent: string
}> = [
  { kind: 'prompt', label: 'Prompt', icon: FileText, accent: 'connector' },
  { kind: 'skill', label: 'Skill', icon: Sparkles, accent: 'interactive' },
  { kind: 'system-prompt', label: 'System', icon: Layers, accent: 'interactive' },
  {
    kind: 'compression-prompt',
    label: 'Compress',
    icon: Minimize2,
    accent: 'connector',
  },
]

interface LabNucleusProps {
  onCreate: (kind: EntityKind) => void
}

export function LabNucleus({ onCreate }: LabNucleusProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="pointer-events-auto text-center">
        <div className="relative mx-auto mb-8 size-32">
          <div className="absolute inset-0 animate-ping rounded-full bg-connector/10" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-connector/20 to-interactive/20 blur-sm" />
          <div className="relative flex size-full items-center justify-center rounded-full border border-connector/30 bg-node/80 shadow-2xl backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-connector">
              Nucleus
            </p>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-foreground">Seed your constellation</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-panel-muted">
          Atoms orbit as hex nodes. Compounds pull them in with valence bonds.
          Drag atoms onto compounds to bond.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {SEEDS.map(({ kind, label, icon: Icon, accent }) => (
            <button
              key={kind}
              type="button"
              onClick={() => onCreate(kind)}
              className={cn(
                'flex items-center gap-2 rounded-full border border-panel-border bg-node/70 px-4 py-2.5 text-xs font-medium shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-connector/40',
                accent === 'interactive'
                  ? 'hover:text-interactive'
                  : 'hover:text-connector',
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
