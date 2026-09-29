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
  useCreateAgentInterface,
  useUpdateAgentInterface,
} from '@/lib/api/agent-interface'
import {
  PROTOCOL_BINDINGS,
  formatProtocolBindingLabel,
  type AgentInterface,
} from '@/lib/types/agent-interface'

interface CreateAgentInterfaceFormProps {
  initialConfig?: AgentInterface
  onSaved: (config: AgentInterface) => void
  onCancel: () => void
}

export function CreateAgentInterfaceForm({
  initialConfig,
  onSaved,
  onCancel,
}: CreateAgentInterfaceFormProps) {
  const createInterface = useCreateAgentInterface()
  const updateInterface = useUpdateAgentInterface()
  const [host, setHost] = useState('127.0.0.1')
  const [port, setPort] = useState('8000')
  const [protocolBinding, setProtocolBinding] = useState('JSONRPC')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialConfig) return
    setHost(initialConfig.host || '127.0.0.1')
    setPort(String(initialConfig.port ?? 8000))
    setProtocolBinding(initialConfig.protocol_binding || 'JSONRPC')
  }, [initialConfig])

  const isPending = createInterface.isPending || updateInterface.isPending

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const trimmedHost = host.trim()
    const parsedPort = Number(port)
    if (!trimmedHost) {
      setFormError('Host is required.')
      return
    }
    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      setFormError('Port must be an integer between 1 and 65535.')
      return
    }

    try {
      const payload = {
        host: trimmedHost,
        port: parsedPort,
        protocol_binding: protocolBinding,
      }
      const saved = initialConfig
        ? await updateInterface.mutateAsync({
            uuid: initialConfig.uuid,
            payload,
          })
        : await createInterface.mutateAsync(payload)
      onSaved(saved)
    } catch {
      setFormError('Could not save agent interface.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-[10px]">Host</Label>
        <Input
          className="h-8 text-xs"
          value={host}
          onChange={(event) => setHost(event.target.value)}
          placeholder="127.0.0.1"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px]">Port</Label>
        <Input
          className="h-8 text-xs"
          type="number"
          min={1}
          max={65535}
          value={port}
          onChange={(event) => setPort(event.target.value)}
          placeholder="8000"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px]">Protocol binding</Label>
        <Select value={protocolBinding} onValueChange={setProtocolBinding}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROTOCOL_BINDINGS.map((binding) => (
              <SelectItem key={binding} value={binding} className="text-xs">
                {formatProtocolBindingLabel(binding)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {formError ? (
        <p className="text-xs text-destructive">{formError}</p>
      ) : null}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Save'}
        </Button>
      </div>
    </form>
  )
}
