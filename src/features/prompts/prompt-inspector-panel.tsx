import { Eye, GitBranch, Pencil, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PromptBondsView } from '@/features/prompts/prompt-bonds-view'
import { PromptEntityEditor } from '@/features/prompts/prompt-entity-editor'
import { PromptInspectorHome } from '@/features/prompts/prompt-inspector-home'
import { PromptPreviewView } from '@/features/prompts/prompt-preview-view'
import { KIND_ICONS } from '@/features/prompts/prompt-spectrum-nav'
import type { buildReferenceUsageIndex } from '@/lib/prompts/entity-usage'
import type { LabEntityRecord } from '@/lib/prompts/use-lab-entity-cache'
import {
  ENTITY_KIND_LABELS,
  isComposedKind,
  type EntityKind,
} from '@/lib/types/prompt-entities'

interface PromptInspectorPanelProps {
  kind: EntityKind
  entityId: string | null
  isCreating: boolean
  entityName?: string
  createSeed?: string | null
  counts: Record<EntityKind, number>
  usageIndex: ReturnType<typeof buildReferenceUsageIndex>
  records: LabEntityRecord[]
  onDismiss: () => void
  onSaved: (uuid: string) => void
  onDeleted: () => void
  onNavigate: (kind: EntityKind, uuid: string) => void
  onCreate: (kind: EntityKind) => void
  onCreateCompoundFromAtom: (refType: 'prompt' | 'skill', uuid: string) => void
  onFocusZone: (zone: 'atoms' | 'compounds') => void
}

export function PromptInspectorPanel({
  kind,
  entityId,
  isCreating,
  entityName,
  createSeed,
  counts,
  usageIndex,
  records,
  onDismiss,
  onSaved,
  onDeleted,
  onNavigate,
  onCreate,
  onCreateCompoundFromAtom,
  onFocusZone,
}: PromptInspectorPanelProps) {
  const [tab, setTab] = useState<'edit' | 'preview' | 'bonds'>('edit')
  const [liveContent, setLiveContent] = useState('')
  const isOpen = isCreating || Boolean(entityId)

  useEffect(() => {
    setTab('edit')
    setLiveContent('')
  }, [kind, entityId, isCreating, createSeed])
  const Icon = KIND_ICONS[kind]
  const kindLabel = ENTITY_KIND_LABELS[kind].replace(/s$/, '')

  if (!isOpen) {
    return (
      <aside className="flex min-h-0 w-[380px] shrink-0 flex-col border-l border-panel-border bg-panel-inspector/20">
        <PromptInspectorHome
          counts={counts}
          usageIndex={usageIndex}
          onCreate={onCreate}
          onFocusZone={onFocusZone}
        />
      </aside>
    )
  }

  const displayName = isCreating ? `New ${kindLabel}` : entityName ?? kindLabel
  const composed = isComposedKind(kind)

  return (
    <aside className="flex min-h-0 w-[min(420px,42vw)] shrink-0 flex-col border-l border-panel-border bg-background">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-panel-border px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-node-header">
            <Icon className="size-4 text-connector" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="text-[10px] text-panel-muted">
              {kindLabel}
              {composed ? ' · compound' : ' · atom'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-panel-muted transition-colors hover:bg-node hover:text-panel-fg"
          aria-label="Close inspector"
        >
          <X className="size-4" />
        </button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as 'edit' | 'preview' | 'bonds')}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-3">
          <TabsTrigger value="edit" className="gap-1.5 text-[11px]">
            <Pencil className="size-3" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5 text-[11px]">
            <Eye className="size-3" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="bonds" className="gap-1.5 text-[11px]">
            <GitBranch className="size-3" />
            Bonds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-0 min-h-0 flex-1 overflow-hidden">
          <PromptEntityEditor
            kind={kind}
            entityId={entityId}
            initialContent={createSeed}
            embedded
            onContentChange={setLiveContent}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0 min-h-0 flex-1 overflow-hidden">
          <PromptPreviewView kind={kind} content={liveContent} records={records} />
        </TabsContent>

        <TabsContent value="bonds" className="mt-0 min-h-0 flex-1 overflow-hidden">
          {entityId ? (
            <PromptBondsView
              kind={kind}
              uuid={entityId}
              name={entityName ?? displayName}
              usageIndex={usageIndex}
              records={records}
              onNavigate={onNavigate}
              onCreateCompoundFromAtom={onCreateCompoundFromAtom}
            />
          ) : (
            <div className="p-5 text-sm text-panel-muted">
              Save this item first to trace its bonds.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  )
}
