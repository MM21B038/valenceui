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
  useCompressionPrompts,
  useCreateCompressionPrompt,
} from '@/lib/api/prompt-entities'
import { cn } from '@/lib/utils'

const NONE_VALUE = '__none__'

interface CompressionPromptPickerProps {
  value: string | null
  onChange: (uuid: string | null) => void
  compact?: boolean
  disabled?: boolean
}

export function CompressionPromptPicker({
  value,
  onChange,
  compact = false,
  disabled = false,
}: CompressionPromptPickerProps) {
  const { data: prompts = [], isLoading } = useCompressionPrompts()
  const createPrompt = useCreateCompressionPrompt()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    const trimmedName = name.trim()
    if (!trimmedName || !prompt.trim()) {
      setError('Name and prompt are required')
      return
    }

    setError(null)
    try {
      const created = await createPrompt.mutateAsync({
        name: trimmedName,
        prompt,
      })
      onChange(created.uuid)
      setCreateOpen(false)
      setName('')
      setPrompt('')
    } catch {
      setError('Could not create compression prompt')
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
          <SelectValue placeholder="Select compression prompt" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>None</SelectItem>
          {prompts.map((item) => (
            <SelectItem key={item.uuid} value={item.uuid}>
              {item.name}
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
        aria-label="Create compression prompt"
      >
        <Plus className="size-3.5" />
      </Button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New compression prompt</DialogTitle>
            <DialogDescription>
              Create a compression prompt and attach it to this thread config.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="compression-prompt-name">Name</Label>
              <Input
                id="compression-prompt-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="compression-prompt-body">Prompt</Label>
              <textarea
                id="compression-prompt-body"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
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
