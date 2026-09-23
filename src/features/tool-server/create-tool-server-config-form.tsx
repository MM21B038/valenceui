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
  useCreateMcpServerConfig,
  useMcpTransports,
  useUpdateMcpServerConfig,
} from '@/lib/api/mcp-server-config'
import {
  formatTransportLabel,
  isStdioTransport,
  type McpServerConfig,
} from '@/lib/types/mcp-server-config'
import { cn } from '@/lib/utils'

interface CreateToolServerConfigFormProps {
  initialConfig?: McpServerConfig
  onSaved: (config: McpServerConfig) => void
  onCancel: () => void
  compact?: boolean
}

function stringifyJsonField(value: unknown) {
  if (value == null) return ''
  return JSON.stringify(value, null, 2)
}

function parseJsonField(
  value: string,
  fieldName: string,
): Record<string, unknown> | unknown[] | null {
  if (!value.trim()) return null

  try {
    const parsed = JSON.parse(value) as unknown
    if (parsed !== null && typeof parsed !== 'object') {
      throw new Error(`Invalid JSON in ${fieldName}`)
    }
    return parsed as Record<string, unknown> | unknown[] | null
  } catch {
    throw new Error(`Invalid JSON in ${fieldName}`)
  }
}

function parseEnvField(value: string): Record<string, string> | null {
  const parsed = parseJsonField(value, 'env')
  if (!parsed || Array.isArray(parsed)) {
    if (parsed) throw new Error('Invalid JSON in env')
    return null
  }
  return parsed as Record<string, string>
}

export function CreateToolServerConfigForm({
  initialConfig,
  onSaved,
  onCancel,
  compact = false,
}: CreateToolServerConfigFormProps) {
  const isEditing = Boolean(initialConfig)
  const createConfig = useCreateMcpServerConfig()
  const updateConfig = useUpdateMcpServerConfig()
  const {
    data: transports = [],
    isLoading: isLoadingTransports,
    isError: isTransportsError,
  } = useMcpTransports()

  const [transport, setTransport] = useState('')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [command, setCommand] = useState('')
  const [args, setArgs] = useState('')
  const [env, setEnv] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (initialConfig) {
      setTransport(initialConfig.transport)
      setName(initialConfig.name)
      setUrl(initialConfig.url ?? '')
      setCommand(initialConfig.command ?? '')
      setArgs(stringifyJsonField(initialConfig.args))
      setEnv(stringifyJsonField(initialConfig.env))
      return
    }

    const first = transports[0]
    if (first && !transport) {
      setTransport(first)
    }
  }, [initialConfig, transports, transport])

  const isStdio = transport ? isStdioTransport(transport) : false
  const isPending = createConfig.isPending || updateConfig.isPending

  const labelClass = compact ? 'text-[10px]' : undefined
  const inputClass = compact ? 'h-8 text-xs' : undefined
  const selectSize = compact ? 'sm' : 'default'
  const selectItemClass = compact ? 'py-1.5 text-xs' : undefined
  const textareaClass = cn(
    'scrollbar-hidden w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30',
    compact ? 'min-h-[52px] text-[10px]' : 'min-h-[72px] text-xs',
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    try {
      const parsedArgs = parseJsonField(args, 'args')
      const parsedEnv = parseEnvField(env)

      const payload = {
        name: name.trim(),
        transport,
        url: isStdio ? null : url.trim() || null,
        command: isStdio ? command.trim() || null : null,
        args: parsedArgs,
        env: parsedEnv,
      }

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
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Could not save configuration.',
      )
    }
  }

  if (isLoadingTransports) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className={cn('animate-spin', compact ? 'size-4' : 'size-5')} />
      </div>
    )
  }

  if (isTransportsError || transports.length === 0) {
    return (
      <div className="space-y-3">
        <p className={cn('text-destructive', compact ? 'text-[10px]' : 'text-sm')}>
          Could not load transport options.
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
        <Label htmlFor="tool-server-name" className={labelClass}>Name</Label>
        <Input
          id="tool-server-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="my-mcp-server"
          className={inputClass}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tool-server-transport" className={labelClass}>Transport</Label>
        <Select value={transport} onValueChange={setTransport}>
          <SelectTrigger id="tool-server-transport" size={selectSize} className="w-full">
            <SelectValue placeholder="Choose transport" />
          </SelectTrigger>
          <SelectContent align="start" sideOffset={4}>
            {transports.map((value) => (
              <SelectItem
                key={value}
                value={value}
                textValue={formatTransportLabel(value)}
                className={selectItemClass}
              >
                {formatTransportLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isStdio ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="tool-server-command" className={labelClass}>Command</Label>
            <Input
              id="tool-server-command"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="npx"
              className={inputClass}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tool-server-args" className={labelClass}>Args (JSON)</Label>
            <textarea
              id="tool-server-args"
              value={args}
              onChange={(event) => setArgs(event.target.value)}
              placeholder='["-y", "@modelcontextprotocol/server-filesystem"]'
              className={textareaClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tool-server-env" className={labelClass}>Env (JSON)</Label>
            <textarea
              id="tool-server-env"
              value={env}
              onChange={(event) => setEnv(event.target.value)}
              placeholder='{"API_KEY": "..."}'
              className={textareaClass}
            />
          </div>
        </>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="tool-server-url" className={labelClass}>URL</Label>
          <Input
            id="tool-server-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://mcp.example.com"
            className={inputClass}
            required
          />
        </div>
      )}

      {formError ? (
        <p className={cn('text-destructive', compact ? 'text-[10px]' : 'text-sm')}>
          {formError}
        </p>
      ) : null}

      <div className={cn('flex gap-2', compact ? 'flex-col pt-1' : 'justify-end pt-2')}>
        <Button
          type="button"
          variant="outline"
          size={compact ? 'sm' : 'default'}
          className={compact ? 'h-7 text-xs' : undefined}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || !name.trim() || !transport}
          size={compact ? 'sm' : 'default'}
          className={cn(
            'bg-interactive text-interactive-fg hover:bg-interactive/90',
            compact && 'h-7 text-xs',
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
