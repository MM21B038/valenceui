import { ArrowRight, AtSign, FileText, Layers, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { buildReferenceUsageIndex } from '@/lib/prompts/entity-usage'
import type { EntityKind } from '@/lib/types/prompt-entities'

interface PromptInspectorHomeProps {
  counts: Record<EntityKind, number>
  usageIndex: ReturnType<typeof buildReferenceUsageIndex>
  onCreate: (kind: EntityKind) => void
  onFocusZone: (zone: 'atoms' | 'compounds') => void
}

export function PromptInspectorHome({
  counts,
  usageIndex,
  onCreate,
  onFocusZone,
}: PromptInspectorHomeProps) {
  const atomTotal = counts.prompt + counts.skill
  const compoundTotal = counts['system-prompt'] + counts['compression-prompt']
  const bondedAtoms = usageIndex.atomUsage.size
  const totalBonds = [...usageIndex.compositionRefs.values()].reduce(
    (sum, refs) => sum + refs.length,
    0,
  )

  return (
    <div className="flex h-full flex-col justify-between p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
          Workbench
        </p>
        <h2 className="mt-1 text-lg font-semibold">Select or create</h2>
        <p className="mt-2 text-sm leading-relaxed text-panel-muted">
          Pick a card to inspect, edit, preview resolved output, and trace bonds.
          Atoms are building blocks; compounds weave them together with{' '}
          <AtSign className="inline size-3" /> references.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-panel-border bg-node/40 p-3">
            <p className="text-2xl font-semibold tabular-nums">{atomTotal}</p>
            <p className="text-[10px] text-panel-muted">Atoms</p>
          </div>
          <div className="rounded-xl border border-panel-border bg-node/40 p-3">
            <p className="text-2xl font-semibold tabular-nums">{compoundTotal}</p>
            <p className="text-[10px] text-panel-muted">Compounds</p>
          </div>
          <div className="rounded-xl border border-panel-border bg-node/40 p-3">
            <p className="text-2xl font-semibold tabular-nums">{bondedAtoms}</p>
            <p className="text-[10px] text-panel-muted">Bonded atoms</p>
          </div>
          <div className="rounded-xl border border-panel-border bg-node/40 p-3">
            <p className="text-2xl font-semibold tabular-nums">{totalBonds}</p>
            <p className="text-[10px] text-panel-muted">Total bonds</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
          Quick start
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-between"
          onClick={() => onCreate('prompt')}
        >
          <span className="flex items-center gap-2">
            <FileText className="size-3.5" />
            New prompt atom
          </span>
          <ArrowRight className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-between"
          onClick={() => onCreate('skill')}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="size-3.5" />
            New skill atom
          </span>
          <ArrowRight className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-between"
          onClick={() => onCreate('system-prompt')}
        >
          <span className="flex items-center gap-2">
            <Layers className="size-3.5" />
            New system compound
          </span>
          <ArrowRight className="size-3.5" />
        </Button>
        <button
          type="button"
          onClick={() => onFocusZone('atoms')}
          className="w-full text-left text-[11px] text-panel-muted transition-colors hover:text-connector"
        >
          Browse atoms in the gallery →
        </button>
      </div>
    </div>
  )
}
