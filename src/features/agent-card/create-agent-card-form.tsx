import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateAgentCard, useUpdateAgentCard } from '@/lib/api/agent-card'
import { getAgentCardConnections } from '@/lib/canvas/connected-agent'
import type { AgentCard } from '@/lib/types/agent-card'
import { useWorkflowStore } from '@/stores/workflow-store'

interface CreateAgentCardFormProps {
  nodeId: string
  initialConfig?: AgentCard
  onSaved: (config: AgentCard) => void
  onCancel: () => void
}

export function CreateAgentCardForm({
  nodeId,
  initialConfig,
  onSaved,
  onCancel,
}: CreateAgentCardFormProps) {
  const createCard = useCreateAgentCard()
  const updateCard = useUpdateAgentCard()
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const connected = getAgentCardConnections(nodeId, nodes, edges)

  useEffect(() => {
    if (!initialConfig) return
    setName(initialConfig.name)
    setDescription(initialConfig.description ?? '')
    setVersion(initialConfig.version ?? '')
    setStreaming(initialConfig.streaming)
    setPushNotifications(initialConfig.push_notifications)
  }, [initialConfig])

  const isPending = createCard.isPending || updateCard.isPending

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const skills = initialConfig
      ? (initialConfig.skills ?? connected.skillIds)
      : connected.skillIds
    const supported_interfaces = initialConfig
      ? (initialConfig.supported_interfaces ?? connected.interfaceIds)
      : connected.interfaceIds

    if (!initialConfig && skills.length === 0 && supported_interfaces.length === 0) {
      // Allow empty; card can be updated later. No hard block.
    }

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        version: version.trim() || null,
        streaming,
        push_notifications: pushNotifications,
        skills: connected.skillIds.length > 0 ? connected.skillIds : skills,
        supported_interfaces:
          connected.interfaceIds.length > 0
            ? connected.interfaceIds
            : supported_interfaces,
      }

      const saved = initialConfig
        ? await updateCard.mutateAsync({
            uuid: initialConfig.uuid,
            payload,
          })
        : await createCard.mutateAsync(payload)

      onSaved(saved)
    } catch {
      setFormError('Could not save agent card.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-lg border border-panel-border bg-node/40 px-3 py-2 text-[10px] text-panel-muted">
        Linked skills: {connected.skillIds.length || 'none'} · Interfaces:{' '}
        {connected.interfaceIds.length || 'none'}
      </div>
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
        <Label className="text-[10px]">Version</Label>
        <Input
          className="h-8 text-xs"
          value={version}
          onChange={(event) => setVersion(event.target.value)}
          placeholder="1.0.0"
        />
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={streaming}
          onChange={(event) => setStreaming(event.target.checked)}
        />
        Streaming
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={pushNotifications}
          onChange={(event) => setPushNotifications(event.target.checked)}
        />
        Push notifications
      </label>
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
