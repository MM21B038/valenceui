import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
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
  useCreateLlmConfig,
  useLlmProviders,
  useUpdateLlmConfig,
} from '@/lib/api/llm-config'
import {
  formatProviderLabel,
  getProviderDescription,
  type LlmConfig,
} from '@/lib/types/llm-config'
import { cn } from '@/lib/utils'

interface CreateLlmConfigFormProps {
  initialConfig?: LlmConfig
  onSaved: (config: LlmConfig) => void
  onCancel: () => void
  compact?: boolean
}

export function CreateLlmConfigForm({
  initialConfig,
  onSaved,
  onCancel,
  compact = false,
}: CreateLlmConfigFormProps) {
  const isEditing = Boolean(initialConfig)
  const createConfig = useCreateLlmConfig()
  const updateConfig = useUpdateLlmConfig()
  const {
    data: providers = [],
    isLoading: isLoadingProviders,
    isError: isProvidersError,
  } = useLlmProviders()

  const [provider, setProvider] = useState('')
  const [model, setModel] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    if (initialConfig) {
      setProvider(initialConfig.provider)
      setModel(initialConfig.model)
      setBaseUrl(initialConfig.base_url ?? '')
      setApiKey('')
      return
    }

    const first = providers[0]
    if (first && !provider) {
      setProvider(first)
    }
  }, [initialConfig, providers, provider])

  const isPending = createConfig.isPending || updateConfig.isPending

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (isEditing && initialConfig) {
      const payload: {
        provider: string
        model: string
        base_url: string | null
        api_key?: string | null
      } = {
        provider,
        model,
        base_url: baseUrl || null,
      }

      if (apiKey.trim()) {
        payload.api_key = apiKey
      }

      const config = await updateConfig.mutateAsync({
        uuid: initialConfig.uuid,
        payload,
      })

      onSaved(config)
      return
    }

    const config = await createConfig.mutateAsync({
      provider,
      model,
      base_url: baseUrl || null,
      api_key: apiKey || null,
    })

    onSaved(config)
  }

  const labelClass = compact ? 'text-[10px]' : undefined
  const inputClass = compact ? 'h-8 text-xs' : undefined
  const selectSize = compact ? 'sm' : 'default'
  const selectItemClass = compact ? 'py-1.5 text-xs' : undefined

  if (isLoadingProviders) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className={cn('animate-spin', compact ? 'size-4' : 'size-5')} />
      </div>
    )
  }

  if (isProvidersError || providers.length === 0) {
    return (
      <div className="space-y-3">
        <p className={cn('text-destructive', compact ? 'text-[10px]' : 'text-sm')}>
          Could not load provider options.
        </p>
        <Button
          type="button"
          variant="outline"
          size={compact ? 'sm' : 'default'}
          className={compact ? 'h-7 w-full text-xs' : undefined}
          onClick={onCancel}
        >
          Back
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-2.5' : 'space-y-4'}>
      <div className="space-y-1.5">
        <Label htmlFor="provider" className={labelClass}>Provider</Label>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger id="provider" size={selectSize} className="w-full">
            <SelectValue placeholder="Choose provider" />
          </SelectTrigger>
          <SelectContent align="start" sideOffset={4}>
            {providers.map((value) => {
              const description = getProviderDescription(value)

              return (
                <SelectItem
                  key={value}
                  value={value}
                  textValue={formatProviderLabel(value)}
                  className={cn(selectItemClass, description && 'items-start py-2')}
                >
                  <div className="flex min-w-0 flex-col gap-0.5 pr-1">
                    <span className="font-medium leading-tight">
                      {formatProviderLabel(value)}
                    </span>
                    {description ? (
                      <span className="text-[10px] leading-tight text-muted-foreground">
                        {description}
                      </span>
                    ) : null}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="model" className={labelClass}>Model</Label>
        <Input
          id="model"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          placeholder="gpt-4o-mini"
          className={inputClass}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="base_url" className={labelClass}>Base URL</Label>
        <Input
          id="base_url"
          type="url"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="Optional"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="api_key" className={labelClass}>API Key</Label>
        <Input
          id="api_key"
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={isEditing ? 'Leave blank to keep current' : 'Optional'}
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div className={cn('flex gap-2', compact ? 'flex-col pt-1' : 'pt-2')}>
        <Button
          type="button"
          variant="outline"
          size={compact ? 'sm' : 'default'}
          className={compact ? 'h-7 text-xs' : 'flex-1'}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || !model.trim() || !provider}
          size={compact ? 'sm' : 'default'}
          className={cn(
            'bg-interactive text-interactive-fg hover:bg-interactive/90',
            compact ? 'h-7 text-xs' : 'flex-1',
          )}
        >
          {isPending
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
              ? 'Save'
              : 'Create'}
        </Button>
      </div>
    </form>
  )
}
