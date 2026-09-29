import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateAgentSkill,
  useUpdateAgentSkill,
} from '@/lib/api/agent-skill'
import { useCreateSkillTag, useSkillTags } from '@/lib/api/skill-tag'
import type { AgentSkill } from '@/lib/types/agent-skill'
import { cn } from '@/lib/utils'

interface CreateAgentSkillFormProps {
  initialConfig?: AgentSkill
  onSaved: (config: AgentSkill) => void
  onCancel: () => void
}

export function CreateAgentSkillForm({
  initialConfig,
  onSaved,
  onCancel,
}: CreateAgentSkillFormProps) {
  const createSkill = useCreateAgentSkill()
  const updateSkill = useUpdateAgentSkill()
  const createTag = useCreateSkillTag()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [examples, setExamples] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  const { data: tags = [] } = useSkillTags(tagSearch)

  useEffect(() => {
    if (!initialConfig) return
    setName(initialConfig.name)
    setDescription(initialConfig.description ?? '')
    setExamples(
      initialConfig.examples == null
        ? ''
        : JSON.stringify(initialConfig.examples, null, 2),
    )
    setSelectedTagIds(initialConfig.tags ?? [])
  }, [initialConfig])

  const selectedTags = useMemo(
    () => tags.filter((tag) => selectedTagIds.includes(tag.uuid)),
    [tags, selectedTagIds],
  )

  const isPending = createSkill.isPending || updateSkill.isPending

  const toggleTag = (uuid: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
    )
  }

  const handleCreateTag = async () => {
    const value = tagSearch.trim()
    if (!value) return
    setFormError(null)
    try {
      const tag = await createTag.mutateAsync({ name: value })
      setSelectedTagIds((prev) =>
        prev.includes(tag.uuid) ? prev : [...prev, tag.uuid],
      )
      setTagSearch('')
    } catch (error) {
      const detail =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response
          ? error.response.data
          : null
      const nameError =
        detail &&
        typeof detail === 'object' &&
        'name' in detail &&
        Array.isArray(detail.name)
          ? String(detail.name[0])
          : null
      setFormError(nameError ?? 'Could not create skill tag.')
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    let parsedExamples: unknown[] | Record<string, unknown> | null = null
    if (examples.trim()) {
      try {
        parsedExamples = JSON.parse(examples) as
          | unknown[]
          | Record<string, unknown>
      } catch {
        setFormError('Examples must be valid JSON.')
        return
      }
    }

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        tags: selectedTagIds,
        examples: parsedExamples,
      }

      let saved: AgentSkill
      if (initialConfig) {
        saved = await updateSkill.mutateAsync({
          uuid: initialConfig.uuid,
          payload,
        })
      } else {
        // List-create serializer only accepts name/tags; enrich via patch.
        const created = await createSkill.mutateAsync({
          name: payload.name,
          tags: payload.tags,
        })
        saved = await updateSkill.mutateAsync({
          uuid: created.uuid,
          payload: {
            description: payload.description,
            examples: payload.examples,
            tags: payload.tags,
          },
        })
      }

      onSaved(saved)
    } catch {
      setFormError('Could not save agent skill.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-[10px]">Name</Label>
        <Input
          className="h-8 text-xs"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px]">Description</Label>
        <textarea
          className="scrollbar-hidden min-h-[64px] w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px]">Tags</Label>
        <div className="flex gap-2">
          <Input
            className="h-8 text-xs"
            placeholder="Search or create tag"
            value={tagSearch}
            onChange={(event) => setTagSearch(event.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-[10px]"
            onClick={handleCreateTag}
            disabled={!tagSearch.trim() || createTag.isPending}
          >
            Add
          </Button>
        </div>
        <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
          {tags.map((tag) => {
            const active = selectedTagIds.includes(tag.uuid)
            return (
              <button
                key={tag.uuid}
                type="button"
                onClick={() => toggleTag(tag.uuid)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px]',
                  active
                    ? 'border-connector bg-connector/15 text-connector'
                    : 'border-panel-border text-panel-muted',
                )}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
        {selectedTags.length > 0 ? (
          <p className="text-[10px] text-panel-muted">
            Selected: {selectedTags.map((tag) => tag.name).join(', ')}
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px]">Examples (JSON)</Label>
        <textarea
          className="scrollbar-hidden min-h-[64px] w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-[10px]"
          value={examples}
          onChange={(event) => setExamples(event.target.value)}
          placeholder='["example query"]'
        />
      </div>
      {formError ? (
        <p className="text-xs text-destructive">{formError}</p>
      ) : null}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Save'}
        </Button>
      </div>
    </form>
  )
}
