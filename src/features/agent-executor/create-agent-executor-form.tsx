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
  useCreateAgentExecutor,
  useUpdateAgentExecutor,
} from '@/lib/api/agent-executor'
import { useSkills, useSystemPrompts } from '@/lib/api/prompt-entities'
import { getMissingAgentExecutorLinks } from '@/lib/canvas/connected-agent'
import type { AgentExecutor } from '@/lib/types/agent-executor'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

interface CreateAgentExecutorFormProps {
  nodeId: string
  initialConfig?: AgentExecutor
  onSaved: (config: AgentExecutor) => void
  onCancel: () => void
}

export function CreateAgentExecutorForm({
  nodeId,
  initialConfig,
  onSaved,
  onCancel,
}: CreateAgentExecutorFormProps) {
  const createExecutor = useCreateAgentExecutor()
  const updateExecutor = useUpdateAgentExecutor()
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
  const { data: systemPrompts = [] } = useSystemPrompts()
  const { data: skills = [] } = useSkills()

  const [name, setName] = useState('')
  const [host, setHost] = useState('127.0.0.1')
  const [port, setPort] = useState('8001')
  const [rpcUrl, setRpcUrl] = useState('')
  const [systemPromptId, setSystemPromptId] = useState('')
  const [skillIds, setSkillIds] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  const { connected, missing } = getMissingAgentExecutorLinks(
    nodeId,
    nodes,
    edges,
  )

  useEffect(() => {
    if (!initialConfig) return
    setName(initialConfig.name)
    setHost(initialConfig.host)
    setPort(String(initialConfig.port))
    setRpcUrl(initialConfig.rpc_url ?? '')
    setSystemPromptId(initialConfig.system_prompt)
    setSkillIds(initialConfig.skills ?? [])
  }, [initialConfig])

  const isPending = createExecutor.isPending || updateExecutor.isPending

  const toggleSkill = (uuid: string) => {
    setSkillIds((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!initialConfig && missing.length > 0) {
      setFormError(`Connect required nodes: ${missing.join(', ')}`)
      return
    }

    if (!systemPromptId) {
      setFormError('Select a system prompt.')
      return
    }

    const portNumber = Number(port)
    if (!Number.isFinite(portNumber) || portNumber <= 0) {
      setFormError('Port must be a positive number.')
      return
    }

    try {
      const payload = {
        name: name.trim(),
        host: host.trim(),
        port: portNumber,
        rpc_url: rpcUrl.trim() || null,
        llm_config: connected.llmConfigId ?? initialConfig?.llm_config ?? '',
        thread_config:
          connected.threadConfigId ?? initialConfig?.thread_config ?? '',
        mcp_servers:
          connected.mcpServerIds.length > 0
            ? connected.mcpServerIds
            : (initialConfig?.mcp_servers ?? []),
        agent_card: connected.agentCardId ?? initialConfig?.agent_card ?? '',
        system_prompt: systemPromptId,
        skills: skillIds,
        excluded_internal_tools: [] as string[],
      }

      if (!payload.llm_config || !payload.thread_config || !payload.agent_card) {
        setFormError('LLM, Thread Config, and Agent Card are required.')
        return
      }

      const saved = initialConfig
        ? await updateExecutor.mutateAsync({
            uuid: initialConfig.uuid,
            payload,
          })
        : await createExecutor.mutateAsync(payload)

      onSaved(saved)
    } catch {
      setFormError('Could not save agent executor.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-lg border border-panel-border bg-node/40 px-3 py-2 text-[10px] text-panel-muted">
        LLM: {connected.llmConfigId ? 'linked' : 'missing'} · Thread:{' '}
        {connected.threadConfigId ? 'linked' : 'missing'} · Card:{' '}
        {connected.agentCardId ? 'linked' : 'missing'} · MCP:{' '}
        {connected.mcpServerIds.length || 0}
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
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-[10px]">Host</Label>
          <Input
            className="h-8 text-xs"
            value={host}
            onChange={(event) => setHost(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px]">Port</Label>
          <Input
            className="h-8 text-xs"
            value={port}
            onChange={(event) => setPort(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px]">RPC URL</Label>
        <Input
          className="h-8 text-xs"
          value={rpcUrl}
          onChange={(event) => setRpcUrl(event.target.value)}
          placeholder="optional"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px]">System prompt</Label>
        <Select value={systemPromptId} onValueChange={setSystemPromptId}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select system prompt" />
          </SelectTrigger>
          <SelectContent>
            {systemPrompts.map((prompt) => (
              <SelectItem key={prompt.uuid} value={prompt.uuid} className="text-xs">
                {prompt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px]">Skills (multiselect)</Label>
        <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto rounded-md border border-panel-border p-2">
          {skills.length === 0 ? (
            <p className="text-[10px] text-panel-muted">No skills in library</p>
          ) : (
            skills.map((skill) => {
              const active = skillIds.includes(skill.uuid)
              return (
                <button
                  key={skill.uuid}
                  type="button"
                  onClick={() => toggleSkill(skill.uuid)}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px]',
                    active
                      ? 'border-connector bg-connector/15 text-connector'
                      : 'border-panel-border text-panel-muted',
                  )}
                >
                  {skill.name}
                </button>
              )
            })
          )}
        </div>
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
