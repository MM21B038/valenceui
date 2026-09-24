import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PromptBondsView } from '@/features/prompts/prompt-bonds-view'
import { PromptEntityEditor } from '@/features/prompts/prompt-entity-editor'
import { PromptPreviewView } from '@/features/prompts/prompt-preview-view'
import { KIND_ICONS } from '@/features/prompts/prompt-spectrum-nav'
import type { buildReferenceUsageIndex } from '@/lib/prompts/entity-usage'
import type { LabEntityRecord } from '@/lib/prompts/use-lab-entity-cache'
import {
  ENTITY_KIND_LABELS,
  isComposedKind,
  type EntityKind,
} from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

interface LabFocusPanelProps {
  open: boolean
  kind: EntityKind
  entityId: string | null
  isCreating: boolean
  entityName?: string
  createSeed?: string | null
  usageIndex: ReturnType<typeof buildReferenceUsageIndex>
  records: LabEntityRecord[]
  onClose: () => void
  onSaved: (uuid: string) => void
  onDeleted: () => void
  onNavigate: (kind: EntityKind, uuid: string) => void
  onCreateCompoundFromAtom: (refType: 'prompt' | 'skill', uuid: string) => void
}

export function LabFocusPanel({
  open,
  kind,
  entityId,
  isCreating,
  entityName,
  createSeed,
  usageIndex,
  records,
  onClose,
  onSaved,
  onDeleted,
  onNavigate,
  onCreateCompoundFromAtom,
}: LabFocusPanelProps) {
  const [tab, setTab] = useState<'edit' | 'preview' | 'bonds'>('edit')
  const [liveContent, setLiveContent] = useState('')

  useEffect(() => {
    setTab('edit')
    setLiveContent('')
  }, [kind, entityId, isCreating, createSeed])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const Icon = KIND_ICONS[kind]
  const kindLabel = ENTITY_KIND_LABELS[kind].replace(/s$/, '')
  const displayName = isCreating ? `New ${kindLabel}` : entityName ?? kindLabel
  const composed = isComposedKind(kind)

  return (
    <>
      <button
        type="button"
        aria-label="Close focus"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in-0"
      />

      <div
        className={cn(
          'fixed top-14 right-0 bottom-0 z-50 flex w-full max-w-[480px] flex-col border-l border-panel-border bg-background/95 shadow-2xl backdrop-blur-xl',
          'animate-in slide-in-from-right duration-300',
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-panel-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center',
                composed ? 'rounded-2xl bg-interactive/15' : 'node-shape-hex bg-connector/15',
              )}
            >
              <Icon className={cn('size-4', composed ? 'text-interactive' : 'text-connector')} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{displayName}</p>
              <p className="text-[11px] text-panel-muted">
                {composed ? 'Compound · weave atoms with @' : 'Atom · drag to bond'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-panel-muted transition-colors hover:bg-node hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as 'edit' | 'preview' | 'bonds')}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-5 mt-4 grid w-auto grid-cols-3">
            <TabsTrigger value="edit" className="text-[11px]">Edit</TabsTrigger>
            <TabsTrigger value="preview" className="text-[11px]">Preview</TabsTrigger>
            <TabsTrigger value="bonds" className="text-[11px]">Bonds</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-0 min-h-0 flex-1 overflow-hidden">
            <PromptEntityEditor
              kind={kind}
              entityId={entityId}
              initialContent={createSeed}
              embedded
              onContentChange={setLiveContent}
              onSaved={onSaved}
              onDeleted={() => {
                onDeleted()
                onClose()
              }}
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
              <p className="p-5 text-sm text-panel-muted">Save first to map bonds.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
