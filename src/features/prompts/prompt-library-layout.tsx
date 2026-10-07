import { ArrowLeft, FlaskConical, Search, Sparkles } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { LabFocusPanel } from '@/features/prompts/constellation/lab-focus-panel'
import { PromptConstellationCanvas } from '@/features/prompts/constellation/prompt-constellation-canvas'
import {
  PromptCommandPalette,
  useCommandPaletteShortcut,
} from '@/features/prompts/prompt-command-palette'
import { PromptCreateMenu } from '@/features/prompts/prompt-create-menu'
import {
  useCompressionPrompts,
  usePrompts,
  useSkills,
  useSystemPrompts,
  useUpdateCompressionPrompt,
  useUpdateSystemPrompt,
} from '@/lib/api/prompt-entities'
import { buildReferenceUsageIndex } from '@/lib/prompts/entity-usage'
import { useLabEntityCache } from '@/lib/prompts/use-lab-entity-cache'
import { useReferenceUsage } from '@/lib/prompts/use-reference-usage'
import type { EntityKind } from '@/lib/types/prompt-entities'

interface PromptLibraryLayoutProps {
  kind: EntityKind
  selectedId: string | null
  isCreating: boolean
  createSeed: string | null
  onSelectKind: (kind: EntityKind) => void
  onSelect: (uuid: string) => void
  onCreate: (kind: EntityKind) => void
  onCreateCompoundFromAtom: (refType: 'prompt' | 'skill', uuid: string) => void
  onSaved: (uuid: string) => void
  onDismiss: () => void
  onDeleted: () => void
}

export function PromptLibraryLayout({
  kind,
  selectedId,
  isCreating,
  createSeed,
  onSelectKind,
  onSelect,
  onCreate,
  onCreateCompoundFromAtom,
  onSaved,
  onDismiss,
  onDeleted,
}: PromptLibraryLayoutProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)

  const promptsQuery = usePrompts()
  const skillsQuery = useSkills()
  const systemPromptsQuery = useSystemPrompts()
  const compressionPromptsQuery = useCompressionPrompts()
  const updateSystemPrompt = useUpdateSystemPrompt()
  const updateCompressionPrompt = useUpdateCompressionPrompt()

  const { index: usageIndex } = useReferenceUsage(
    systemPromptsQuery.data ?? [],
    compressionPromptsQuery.data ?? [],
  )

  const { records, search, getRecord } = useLabEntityCache(
    promptsQuery.data ?? [],
    skillsQuery.data ?? [],
    systemPromptsQuery.data ?? [],
    compressionPromptsQuery.data ?? [],
  )

  const selectedKey = selectedId ? `${kind}:${selectedId}` : null
  const selectedRecord = selectedId ? getRecord(kind, selectedId) : undefined
  const focusOpen = isCreating || Boolean(selectedId)
  const emptyIndex = useMemo(() => buildReferenceUsageIndex([]), [])

  const atomCount = useMemo(
    () =>
      records.filter((r) => r.kind === 'prompt' || r.kind === 'skill').length,
    [records],
  )
  const compoundCount = useMemo(
    () =>
      records.filter(
        (r) => r.kind === 'system-prompt' || r.kind === 'compression-prompt',
      ).length,
    [records],
  )

  const handleNavigate = useCallback(
    (entityKind: EntityKind, uuid: string) => {
      onSelectKind(entityKind)
      onSelect(uuid)
    },
    [onSelectKind, onSelect],
  )

  const handleBondAtomToCompound = useCallback(
    async (
      atomKind: 'prompt' | 'skill',
      atomUuid: string,
      compoundKind: 'system-prompt' | 'compression-prompt',
      compoundUuid: string,
    ) => {
      const compound = getRecord(compoundKind, compoundUuid)
      if (!compound) return

      const token = `[${atomKind}](${atomUuid})`
      if (compound.content.includes(token)) {
        handleNavigate(compoundKind, compoundUuid)
        return
      }

      const nextContent = compound.content
        ? `${compound.content}\n${token}`
        : token

      try {
        if (compoundKind === 'system-prompt') {
          await updateSystemPrompt.mutateAsync({
            uuid: compoundUuid,
            payload: { name: compound.name, content: nextContent },
          })
        } else {
          await updateCompressionPrompt.mutateAsync({
            uuid: compoundUuid,
            payload: { name: compound.name, prompt: nextContent },
          })
        }
        handleNavigate(compoundKind, compoundUuid)
      } catch {
        window.alert('Could not bond atom to compound.')
      }
    },
    [getRecord, handleNavigate, updateCompressionPrompt, updateSystemPrompt],
  )

  const openPalette = useCallback(() => setPaletteOpen(true), [])
  useCommandPaletteShortcut(openPalette)

  return (
    <div className="prompt-lab-ambient relative flex h-full min-h-0 flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-panel-border/70 bg-chrome/90 px-3.5 py-2.5 text-chrome-fg shadow-xl backdrop-blur-md animate-in fade-in-0 slide-in-from-top-2 duration-500">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-chrome-fg/25 bg-transparent px-2.5 text-chrome-fg hover:bg-interactive hover:text-interactive-fg"
            asChild
          >
            <Link to="/editor" title="Back to editor">
              <ArrowLeft className="size-3.5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="relative flex size-9 items-center justify-center rounded-xl bg-chrome-fg/10">
              <FlaskConical className="size-4" />
              <Sparkles className="absolute -top-1 -right-1 size-3 text-chrome-fg/70" />
            </div>
            <div>
              <p className="prompt-lab-title-sheen text-sm font-semibold leading-none tracking-tight">
                Valence Lab
              </p>
              <p className="mt-1 text-[10px] text-chrome-muted">
                Prompt constellation · {atomCount} atoms · {compoundCount}{' '}
                compounds
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-panel-border/70 bg-chrome/90 px-2.5 py-2 shadow-xl backdrop-blur-md animate-in fade-in-0 slide-in-from-top-2 duration-500">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="h-8 border-chrome-fg/25 bg-transparent text-chrome-fg hover:bg-interactive hover:text-interactive-fg"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Find</span>
            <kbd className="ml-1 hidden rounded border border-chrome-fg/20 px-1 py-px text-[9px] opacity-70 sm:inline">
              ⌘K
            </kbd>
          </Button>
          <PromptCreateMenu onCreate={onCreate} />
          <ThemeToggle />
        </div>
      </div>

      <div className="min-h-0 flex-1 [background-image:radial-gradient(circle_at_1px_1px,var(--workspace-dot)_1px,transparent_0)] [background-size:22px_22px]">
        <PromptConstellationCanvas
          records={records}
          usageIndex={usageIndex ?? emptyIndex}
          selectedKey={selectedKey}
          onSelect={handleNavigate}
          onCreate={onCreate}
          onBondAtomToCompound={handleBondAtomToCompound}
        />
      </div>

      <LabFocusPanel
        open={focusOpen}
        kind={kind}
        entityId={isCreating ? null : selectedId}
        isCreating={isCreating}
        entityName={selectedRecord?.name}
        createSeed={createSeed}
        usageIndex={usageIndex ?? emptyIndex}
        records={records}
        onClose={onDismiss}
        onSaved={onSaved}
        onDeleted={onDeleted}
        onNavigate={handleNavigate}
        onCreateCompoundFromAtom={onCreateCompoundFromAtom}
      />

      <PromptCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        search={search}
        onSelectEntity={handleNavigate}
        onCreate={onCreate}
      />
    </div>
  )
}
