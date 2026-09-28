import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateSystemPrompt,
  useSystemPrompts,
} from '@/lib/api/prompt-entities'
import { cn } from '@/lib/utils'

const NONE_VALUE = '__none__'

interface SystemPromptPickerProps {
  value: string | null
  onChange: (uuid: string | null) => void
  compact?: boolean
  disabled?: boolean
}

export function SystemPromptPicker({
  value,
  onChange,
  compact = false,
  disabled = false,
}: SystemPromptPickerProps) {
  const { data: prompts = [], isLoading } = useSystemPrompts()
  const createPrompt = useCreateSystemPrompt()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    const trimmedName = name.trim()
    if (!trimmedName || !content.trim()) {
      setError('Name and content are required')
      return
    }

    setError(null)
    try {
      const created = await createPrompt.mutateAsync({
        name: trimmedName,
        content,
      })
      onChange(created.uuid)
      setCreateOpen(false)
      setName('')
      setContent('')
    } catch {
      setError('Could not create system prompt')
    }
  }

  return (
    <div className="flex gap-2">
      <Select
        value={value ?? NONE_VALUE}
        onValueChange={(next) =>
          onChange(next === NONE_VALUE ? null : next)
        }
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          size={compact ? 'sm' : 'default'}
          className={cn('min-w-0 flex-1', compact && 'h-8 text-xs')}
        >
          <SelectValue placeholder="Select system prompt" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>None</SelectItem>
          {prompts.map((prompt) => (
            <SelectItem key={prompt.uuid} value={prompt.uuid}>
              {prompt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        size={compact ? 'sm' : 'default'}
        className={cn(compact ? 'h-8 px-2' : 'px-2.5')}
        onClick={() => {
          setError(null)
          setCreateOpen(true)
        }}
        disabled={disabled}
        aria-label="Create system prompt"
      >
        <Plus className="size-3.5" />
      </Button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New system prompt</DialogTitle>
            <DialogDescription>
              Create a system prompt and attach it to this thread config.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="system-prompt-name">Name</Label>
              <Input
                id="system-prompt-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="system-prompt-content">Content</Label>
              <textarea
                id="system-prompt-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={6}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createPrompt.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createPrompt.isPending}
            >
              {createPrompt.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
