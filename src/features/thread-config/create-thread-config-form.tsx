import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CompressionPromptPicker } from '@/features/thread-config/compression-prompt-picker'
import { SystemPromptPicker } from '@/features/thread-config/system-prompt-picker'
import { ToolHideRuleSection } from '@/features/thread-config/tool-hide-rule-section'
import {
  useCreateThreadConfig,
  useUpdateThreadConfig,
} from '@/lib/api/thread-config'
import type {
  ThreadConfig,
  ThreadConfigCreatePayload,
} from '@/lib/types/thread-config'
import { cn } from '@/lib/utils'

interface CreateThreadConfigFormProps {
  initialConfig?: ThreadConfig
  onSaved: (config: ThreadConfig) => void
  onCancel: () => void
  compact?: boolean
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function CreateThreadConfigForm({
  initialConfig,
  onSaved,
  onCancel,
  compact = false,
}: CreateThreadConfigFormProps) {
  const isEditing = Boolean(initialConfig)
  const createConfig = useCreateThreadConfig()
  const updateConfig = useUpdateThreadConfig()

  const [name, setName] = useState('')
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null)
  const [compressionPrompt, setCompressionPrompt] = useState<string | null>(null)
  const [compressionTokenLimit, setCompressionTokenLimit] = useState('')
  const [tokenLimit, setTokenLimit] = useState('')
  const [perToolTokenLimit, setPerToolTokenLimit] = useState('')
  const [autoHideRule, setAutoHideRule] = useState(false)
  const [toolHideRules, setToolHideRules] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialConfig) {
      setName('')
      setSystemPrompt(null)
      setCompressionPrompt(null)
      setCompressionTokenLimit('')
      setTokenLimit('')
      setPerToolTokenLimit('')
      setAutoHideRule(false)
      setToolHideRules([])
      setError(null)
      return
    }

    setName(initialConfig.name)
    setSystemPrompt(initialConfig.system_prompt)
    setCompressionPrompt(initialConfig.compression_prompt)
    setCompressionTokenLimit(
      initialConfig.compression_token_limit?.toString() ?? '',
    )
    setTokenLimit(initialConfig.token_limit?.toString() ?? '')
    setPerToolTokenLimit(initialConfig.per_tool_token_limit?.toString() ?? '')
    setAutoHideRule(initialConfig.auto_hide_rule)
    setToolHideRules(initialConfig.tool_hide_rules ?? [])
    setError(null)
  }, [initialConfig])

  const isPending = createConfig.isPending || updateConfig.isPending
  const labelClass = compact ? 'text-[10px]' : undefined
  const inputClass = compact ? 'h-8 text-xs' : undefined

  const buildPayload = (): ThreadConfigCreatePayload => ({
    name: name.trim(),
    system_prompt: systemPrompt,
    compression_prompt: compressionPrompt,
    compression_token_limit: parseOptionalInt(compressionTokenLimit),
    token_limit: parseOptionalInt(tokenLimit),
    per_tool_token_limit: parseOptionalInt(perToolTokenLimit),
    auto_hide_rule: autoHideRule,
    tool_hide_rules: toolHideRules,
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setError(null)
    const payload = buildPayload()

    try {
      if (isEditing && initialConfig) {
        const config = await updateConfig.mutateAsync({
          uuid: initialConfig.uuid,
          payload,
        })
        onSaved(config)
        return
      }

      const config = await createConfig.mutateAsync(payload)
      onSaved(config)
    } catch {
      setError('Could not save thread config')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="thread-config-name" className={labelClass}>
          Name
        </Label>
        <Input
          id="thread-config-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
          maxLength={100}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label className={labelClass}>System prompt</Label>
        <SystemPromptPicker
          value={systemPrompt}
          onChange={setSystemPrompt}
          compact={compact}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className={labelClass}>Compression prompt</Label>
        <CompressionPromptPicker
          value={compressionPrompt}
          onChange={setCompressionPrompt}
          compact={compact}
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 @md/inspector:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="thread-token-limit" className={labelClass}>
            Token limit
          </Label>
          <Input
            id="thread-token-limit"
            type="number"
            inputMode="numeric"
            value={tokenLimit}
            onChange={(event) => setTokenLimit(event.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="thread-compression-limit" className={labelClass}>
            Compression limit
          </Label>
          <Input
            id="thread-compression-limit"
            type="number"
            inputMode="numeric"
            value={compressionTokenLimit}
            onChange={(event) => setCompressionTokenLimit(event.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="thread-per-tool-limit" className={labelClass}>
            Per-tool limit
          </Label>
          <Input
            id="thread-per-tool-limit"
            type="number"
            inputMode="numeric"
            value={perToolTokenLimit}
            onChange={(event) => setPerToolTokenLimit(event.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-panel-inspector-fg">
        <input
          type="checkbox"
          checked={autoHideRule}
          onChange={(event) => setAutoHideRule(event.target.checked)}
          className="size-3.5 rounded border-panel-border"
        />
        Auto hide rule
      </label>

      <ToolHideRuleSection
        attachedIds={toolHideRules}
        onChange={setToolHideRules}
        compact={compact}
        disabled={isPending}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className={cn('flex justify-end gap-2', compact && 'pt-1')}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          size={compact ? 'sm' : 'default'}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} size={compact ? 'sm' : 'default'}>
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </>
          ) : isEditing ? (
            'Save changes'
          ) : (
            'Create'
          )}
        </Button>
      </div>
    </form>
  )
}
