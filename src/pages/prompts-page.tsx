import { useState } from 'react'

import { PromptLibraryLayout } from '@/features/prompts/prompt-library-layout'
import type { EntityKind } from '@/lib/types/prompt-entities'

export function PromptsPage() {
  const [kind, setKind] = useState<EntityKind>('prompt')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createSeed, setCreateSeed] = useState<string | null>(null)

  const handleSelectKind = (nextKind: EntityKind) => {
    setKind(nextKind)
    setSelectedId(null)
    setIsCreating(false)
    setCreateSeed(null)
  }

  const handleCreate = (nextKind: EntityKind) => {
    setKind(nextKind)
    setIsCreating(true)
    setSelectedId(null)
    setCreateSeed(null)
  }

  const handleCreateCompoundFromAtom = (
    refType: 'prompt' | 'skill',
    uuid: string,
  ) => {
    setKind('system-prompt')
    setCreateSeed(`[${refType}](${uuid})`)
    setIsCreating(true)
    setSelectedId(null)
  }

  const handleSaved = (uuid: string) => {
    setIsCreating(false)
    setSelectedId(uuid)
    setCreateSeed(null)
  }

  const handleDismiss = () => {
    setSelectedId(null)
    setIsCreating(false)
    setCreateSeed(null)
  }

  const handleDeleted = () => {
    handleDismiss()
  }

  return (
    <div className="h-full min-h-0">
      <PromptLibraryLayout
        kind={kind}
        selectedId={selectedId}
        isCreating={isCreating}
        createSeed={createSeed}
        onSelectKind={handleSelectKind}
        onSelect={(uuid) => {
          setSelectedId(uuid)
          setIsCreating(false)
          setCreateSeed(null)
        }}
        onCreate={handleCreate}
        onCreateCompoundFromAtom={handleCreateCompoundFromAtom}
        onSaved={handleSaved}
        onDismiss={handleDismiss}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
