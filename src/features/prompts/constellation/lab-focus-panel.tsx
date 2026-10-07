import { Eye, Link2, PenLine, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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

  const seededContent = useMemo(() => {
    if (isCreating) return createSeed ?? ''
    if (!entityId) return ''
    return records.find((r) => r.kind === kind && r.uuid === entityId)?.content ?? ''
  }, [createSeed, entityId, isCreating, kind, records])

  useEffect(() => {
    setTab('edit')
    setLiveContent(seededContent)
  }, [kind, entityId, isCreating, createSeed, seededContent])

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
  const previewContent = liveContent || seededContent

  return (
    <>
      <button
        type="button"
        aria-label="Close focus"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] animate-in fade-in-0 duration-200"
      />

      <div
        className={cn(
          'fixed top-3 right-3 bottom-3 z-50 flex w-[min(100vw-1.5rem,720px)] flex-col overflow-hidden rounded-3xl border border-panel-border/80 bg-background/95 shadow-2xl backdrop-blur-xl',
          'animate-in slide-in-from-right-8 fade-in-0 duration-300',
        )}
      >
        <div className="relative flex shrink-0 items-center justify-between gap-3 overflow-hidden border-b border-panel-border/70 px-5 py-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-connector/10 via-transparent to-interactive/10"
          />
          <div className="relative flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center shadow-sm transition-transform duration-300',
                composed
                  ? 'rounded-2xl bg-interactive/15'
                  : 'node-shape-hex bg-connector/15',
              )}
            >
              <Icon
                className={cn(
                  'size-4',
                  composed ? 'text-interactive' : 'text-connector',
                )}
              />
            </div>
            <div className="min-w-0">
              <p className="prompt-lab-serif truncate text-lg font-semibold tracking-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-panel-muted">
                {composed
                  ? 'Compound · weave atoms with @'
                  : 'Atom · write Markdown, preview live'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="relative flex size-9 items-center justify-center rounded-xl text-panel-muted transition-colors hover:bg-node hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) =>
            setTab(value as 'edit' | 'preview' | 'bonds')
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-5 mt-4 grid h-10 w-auto grid-cols-3 rounded-xl bg-muted/50 p-1">
            <TabsTrigger
              value="edit"
              className="gap-1.5 rounded-lg text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <PenLine className="size-3" />
              Edit
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="gap-1.5 rounded-lg text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Eye className="size-3" />
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="bonds"
              className="gap-1.5 rounded-lg text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Link2 className="size-3" />
              Bonds
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="edit"
            className="mt-0 min-h-0 flex-1 overflow-hidden"
          >
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

          <TabsContent
            value="preview"
            className="mt-0 min-h-0 flex-1 overflow-hidden"
          >
            <PromptPreviewView
              kind={kind}
              content={previewContent}
              records={records}
            />
          </TabsContent>

          <TabsContent
            value="bonds"
            className="mt-0 min-h-0 flex-1 overflow-hidden"
          >
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
              <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                <Link2 className="size-8 text-panel-muted/40" />
                <p className="text-sm text-panel-muted">
                  Save this entity first to map its bonds.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
