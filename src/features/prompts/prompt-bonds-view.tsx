import { ArrowRight, AtSign, FileText, Sparkles, type LucideIcon } from 'lucide-react'

import { KIND_ICONS } from '@/features/prompts/prompt-spectrum-nav'

import type { buildReferenceUsageIndex } from '@/lib/prompts/entity-usage'
import { referenceKey } from '@/lib/prompts/reference-syntax'
import type { LabEntityRecord } from '@/lib/prompts/use-lab-entity-cache'
import {
  ENTITY_KIND_LABELS,
  isComposedKind,
  type EntityKind,
} from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

interface PromptBondsViewProps {
  kind: EntityKind
  uuid: string
  name: string
  usageIndex: ReturnType<typeof buildReferenceUsageIndex>
  records: LabEntityRecord[]
  onNavigate: (kind: EntityKind, uuid: string) => void
  onCreateCompoundFromAtom?: (refType: 'prompt' | 'skill', uuid: string) => void
}

function BondChip({
  label,
  sublabel,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string
  sublabel: string
  icon: typeof FileText
  accent: 'connector' | 'interactive'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-panel-border bg-node/40 px-3 py-2.5 text-left transition-colors hover:border-connector/40 hover:bg-node/70',
        accent === 'interactive' && 'hover:border-interactive/40',
      )}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          accent === 'interactive'
            ? 'bg-interactive/15 text-interactive'
            : 'bg-connector/15 text-connector',
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-[10px] text-panel-muted">{sublabel}</p>
      </div>
      <ArrowRight className="size-3.5 shrink-0 text-panel-muted" />
    </button>
  )
}

export function PromptBondsView({
  kind,
  uuid,
  name,
  usageIndex,
  records,
  onNavigate,
  onCreateCompoundFromAtom,
}: PromptBondsViewProps) {
  const composed = isComposedKind(kind)
  const recordByKey = new Map(
    records.map((record) => [`${record.kind}:${record.uuid}`, record]),
  )

  if (composed) {
    const refs = usageIndex.compositionRefs.get(uuid) ?? []

    return (
      <div className="space-y-4 p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
            Embedded atoms
          </p>
          <p className="mt-1 text-sm text-panel-muted">
            Atoms bonded into <span className="font-medium text-foreground">{name}</span>
          </p>
        </div>

        {refs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-panel-border px-4 py-8 text-center">
            <AtSign className="mx-auto size-5 text-panel-muted" />
            <p className="mt-2 text-sm text-panel-muted">No bonds yet</p>
            <p className="mt-1 text-xs text-panel-muted/80">
              Type @ in the editor or drag from the atom shelf.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {refs.map((ref) => {
              const record = recordByKey.get(referenceKey(ref.refType, ref.uuid))
              const Icon = ref.refType === 'skill' ? Sparkles : FileText
              return (
                <BondChip
                  key={`${ref.refType}-${ref.uuid}`}
                  label={record?.name ?? 'Unknown atom'}
                  sublabel={ENTITY_KIND_LABELS[
                    ref.refType === 'skill' ? 'skill' : 'prompt'
                  ].replace(/s$/, '')}
                  icon={Icon}
                  accent={ref.refType === 'skill' ? 'interactive' : 'connector'}
                  onClick={() =>
                    onNavigate(ref.refType === 'skill' ? 'skill' : 'prompt', ref.uuid)
                  }
                />
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const isSkill = kind === 'skill'
  const refType = isSkill ? 'skill' : 'prompt'
  const bondCount = usageIndex.atomUsage.get(referenceKey(refType, uuid)) ?? 0

  const compounds = records.filter((record) => {
    if (!isComposedKind(record.kind)) return false
    const refs = usageIndex.compositionRefs.get(record.uuid) ?? []
    return refs.some((ref) => ref.refType === refType && ref.uuid === uuid)
  })

  return (
    <div className="space-y-4 p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
          Used in compounds
        </p>
        <p className="mt-1 text-sm text-panel-muted">
          <span className="font-medium text-foreground">{name}</span> appears in{' '}
          {bondCount} compound{bondCount === 1 ? '' : 's'}
        </p>
      </div>

      {compounds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-panel-border px-4 py-8 text-center">
          <AtSign className="mx-auto size-5 text-panel-muted" />
          <p className="mt-2 text-sm text-panel-muted">Not bonded yet</p>
          <p className="mt-1 text-xs text-panel-muted/80">
            Reference this atom with @ inside a compound.
          </p>
          {onCreateCompoundFromAtom && (kind === 'prompt' || kind === 'skill') ? (
            <button
              type="button"
              onClick={() => onCreateCompoundFromAtom(refType, uuid)}
              className="mt-4 text-xs font-medium text-connector hover:underline"
            >
              Create compound with this atom →
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          {compounds.map((compound) => {
            const Icon = KIND_ICONS[compound.kind] as LucideIcon
            return (
              <BondChip
                key={compound.uuid}
                label={compound.name}
                sublabel={ENTITY_KIND_LABELS[compound.kind].replace(/s$/, '')}
                icon={Icon}
                accent="interactive"
                onClick={() => onNavigate(compound.kind, compound.uuid)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
