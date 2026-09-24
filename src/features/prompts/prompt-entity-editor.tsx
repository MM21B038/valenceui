import { AtSign, Copy, Loader2, Save, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ComposedEditorWorkspace } from '@/features/prompts/composed-editor-workspace'
import type { RichComposerHandle } from '@/features/prompts/rich-reference-composer'
import {
  useCompressionPrompt,
  useCreateCompressionPrompt,
  useCreatePrompt,
  useCreateSkill,
  useCreateSystemPrompt,
  useDeleteCompressionPrompt,
  useDeletePrompt,
  useDeleteSkill,
  useDeleteSystemPrompt,
  usePrompt,
  useSkill,
  useSystemPrompt,
  useUpdateCompressionPrompt,
  useUpdatePrompt,
  useUpdateSkill,
  useUpdateSystemPrompt,
} from '@/lib/api/prompt-entities'
import { countReferences } from '@/lib/prompts/reference-syntax'
import {
  ENTITY_KIND_LABELS,
  isComposedKind,
  type EntityKind,
} from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

interface PromptEntityEditorProps {
  kind: EntityKind
  entityId: string | null
  initialContent?: string | null
  embedded?: boolean
  onSaved: (uuid: string) => void
  onDeleted: () => void
  onContentChange?: (content: string) => void
}

export function PromptEntityEditor({
  kind,
  entityId,
  initialContent,
  embedded = false,
  onSaved,
  onDeleted,
  onContentChange,
}: PromptEntityEditorProps) {
  const isNew = !entityId
  const composed = isComposedKind(kind)
  const composerRef = useRef<RichComposerHandle>(null)

  const { data: prompt, isLoading: promptLoading } = usePrompt(entityId ?? '')
  const { data: skill, isLoading: skillLoading } = useSkill(entityId ?? '')
  const { data: systemPrompt, isLoading: systemLoading } = useSystemPrompt(
    entityId ?? '',
  )
  const { data: compressionPrompt, isLoading: compressionLoading } =
    useCompressionPrompt(entityId ?? '')

  const createPrompt = useCreatePrompt()
  const updatePrompt = useUpdatePrompt()
  const deletePrompt = useDeletePrompt()
  const createSkill = useCreateSkill()
  const updateSkill = useUpdateSkill()
  const deleteSkill = useDeleteSkill()
  const createSystemPrompt = useCreateSystemPrompt()
  const updateSystemPrompt = useUpdateSystemPrompt()
  const deleteSystemPrompt = useDeleteSystemPrompt()
  const createCompressionPrompt = useCreateCompressionPrompt()
  const updateCompressionPrompt = useUpdateCompressionPrompt()
  const deleteCompressionPrompt = useDeleteCompressionPrompt()

  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isLoading =
    (!isNew && kind === 'prompt' && promptLoading) ||
    (!isNew && kind === 'skill' && skillLoading) ||
    (!isNew && kind === 'system-prompt' && systemLoading) ||
    (!isNew && kind === 'compression-prompt' && compressionLoading)

  const isSaving =
    createPrompt.isPending ||
    updatePrompt.isPending ||
    createSkill.isPending ||
    updateSkill.isPending ||
    createSystemPrompt.isPending ||
    updateSystemPrompt.isPending ||
    createCompressionPrompt.isPending ||
    updateCompressionPrompt.isPending

  const updateContent = (value: string) => {
    setContent(value)
    onContentChange?.(value)
  }

  useEffect(() => {
    if (isNew) {
      setName('')
      const seed = initialContent ?? ''
      setContent(seed)
      onContentChange?.(seed)
      setError(null)
      return
    }

    if (kind === 'prompt' && prompt) {
      setName(prompt.name)
      setContent(prompt.content)
      onContentChange?.(prompt.content)
    } else if (kind === 'skill' && skill) {
      setName(skill.name)
      setContent(skill.content)
      onContentChange?.(skill.content)
    } else if (kind === 'system-prompt' && systemPrompt) {
      setName(systemPrompt.name)
      setContent(systemPrompt.content)
      onContentChange?.(systemPrompt.content)
    } else if (kind === 'compression-prompt' && compressionPrompt) {
      setName(compressionPrompt.name)
      setContent(compressionPrompt.prompt)
      onContentChange?.(compressionPrompt.prompt)
    }
  }, [
    isNew,
    kind,
    prompt,
    skill,
    systemPrompt,
    compressionPrompt,
    initialContent,
    onContentChange,
  ])

  const handleSave = async () => {
    setError(null)

    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    try {
      if (kind === 'prompt') {
        if (isNew) {
          const created = await createPrompt.mutateAsync({
            name: name.trim(),
            content,
          })
          onSaved(created.uuid)
        } else if (entityId) {
          await updatePrompt.mutateAsync({
            uuid: entityId,
            payload: { name: name.trim(), content },
          })
        }
      } else if (kind === 'skill') {
        if (isNew) {
          const created = await createSkill.mutateAsync({
            name: name.trim(),
            content,
          })
          onSaved(created.uuid)
        } else if (entityId) {
          await updateSkill.mutateAsync({
            uuid: entityId,
            payload: { name: name.trim(), content },
          })
        }
      } else if (kind === 'system-prompt') {
        if (isNew) {
          const created = await createSystemPrompt.mutateAsync({
            name: name.trim(),
            content,
          })
          onSaved(created.uuid)
        } else if (entityId) {
          await updateSystemPrompt.mutateAsync({
            uuid: entityId,
            payload: { name: name.trim(), content },
          })
        }
      } else if (kind === 'compression-prompt') {
        if (isNew) {
          const created = await createCompressionPrompt.mutateAsync({
            name: name.trim(),
            prompt: content,
          })
          onSaved(created.uuid)
        } else if (entityId) {
          await updateCompressionPrompt.mutateAsync({
            uuid: entityId,
            payload: { name: name.trim(), prompt: content },
          })
        }
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save.',
      )
    }
  }

  const handleDelete = async () => {
    if (!entityId) return
    const confirmed = window.confirm(`Delete "${name}"?`)
    if (!confirmed) return

    try {
      if (kind === 'prompt') await deletePrompt.mutateAsync(entityId)
      if (kind === 'skill') await deleteSkill.mutateAsync(entityId)
      if (kind === 'system-prompt') await deleteSystemPrompt.mutateAsync(entityId)
      if (kind === 'compression-prompt') {
        await deleteCompressionPrompt.mutateAsync(entityId)
      }
      onDeleted()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Failed to delete.',
      )
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      setError('Could not copy to clipboard.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-panel-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  const kindLabel = ENTITY_KIND_LABELS[kind].replace(/s$/, '')
  const refCount = composed ? countReferences(content) : 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'shrink-0 border-b border-panel-border',
          embedded ? 'px-4 py-3' : 'bg-panel-inspector/40 px-6 py-5',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {!embedded ? (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
                {isNew ? `New ${kindLabel}` : kindLabel}
              </p>
            ) : null}
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
              placeholder={`${kindLabel} name`}
              className={cn(
                'border-0 bg-transparent px-0 font-semibold shadow-none focus-visible:ring-0',
                embedded ? 'h-8 text-base' : 'mt-2 h-10 text-xl',
              )}
            />
            <p className="mt-0.5 text-[10px] text-panel-muted">
              {content.length} chars
              {composed ? ` · ${refCount} bond${refCount === 1 ? '' : 's'}` : ''}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {composed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => composerRef.current?.insertAtSign()}
                className="h-7 gap-1 px-2"
              >
                <AtSign className="size-3" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2"
            >
              <Copy className="size-3" />
            </Button>
            {!isNew ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="h-7 border-destructive/40 px-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3" />
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7 gap-1 bg-connector px-2.5 text-white hover:bg-connector/90"
            >
              {isSaving ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Save className="size-3" />
              )}
              Save
            </Button>
          </div>
        </div>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {composed ? (
          <ComposedEditorWorkspace
            content={content}
            onChange={updateContent}
            composerRef={composerRef}
          />
        ) : (
          <div className="flex h-full flex-col p-4">
            <textarea
              value={content}
              onChange={(event) => updateContent(event.target.value)}
              maxLength={3000}
              placeholder="Write atom content — concise, reusable instructions or prompt text."
              className={cn(
                'min-h-0 flex-1 resize-none rounded-xl border border-panel-border bg-background px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-connector/60 focus:ring-2 focus:ring-connector/15',
              )}
            />
            <p className="mt-2 text-right text-[10px] text-panel-muted">
              {content.length} / 3000
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
