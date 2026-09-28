import { Loader2, Server, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import {
  toolHideRuleKeys,
  useToolHideRulesByServers,
} from '@/lib/api/tool-hide-rule'
import type { ToolHideRule } from '@/lib/types/tool-hide-rule'
import type { ValenceNode } from '@/lib/types/workflow'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

export interface CanvasMcpServerOption {
  configId: string
  name: string
  source: 'single' | 'stack'
  stackLabel?: string
  nodeId: string
}

/** Collect configured MCP servers from standalone nodes and stack members. */
export function getCanvasMcpServers(nodes: ValenceNode[]): CanvasMcpServerOption[] {
  const byConfigId = new Map<string, CanvasMcpServerOption>()

  for (const node of nodes) {
    if (node.type === 'toolServer' && node.data.configId && !node.data.stackId) {
      byConfigId.set(node.data.configId, {
        configId: node.data.configId,
        name: node.data.name ?? node.data.label ?? 'Tool Server',
        source: 'single',
        nodeId: node.id,
      })
    }
  }

  for (const node of nodes) {
    if (node.type !== 'serverStack') continue
    const stackLabel = node.data.label || 'Server Stack'

    for (const memberId of node.data.memberIds) {
      const member = nodes.find(
        (item) => item.id === memberId && item.type === 'toolServer',
      )
      if (!member || member.type !== 'toolServer' || !member.data.configId) {
        continue
      }

      const existing = byConfigId.get(member.data.configId)
      if (existing && existing.source === 'single') continue

      byConfigId.set(member.data.configId, {
        configId: member.data.configId,
        name: member.data.name ?? member.data.label ?? 'Tool Server',
        source: 'stack',
        stackLabel,
        nodeId: member.id,
      })
    }
  }

  return Array.from(byConfigId.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  )
}

interface ToolHideRuleSectionProps {
  attachedIds: string[]
  onChange: (ids: string[]) => void
  compact?: boolean
  disabled?: boolean
}

export function ToolHideRuleSection({
  attachedIds,
  onChange,
  compact = false,
  disabled = false,
}: ToolHideRuleSectionProps) {
  const nodes = useWorkflowStore((state) => state.nodes)
  const canvasServers = useMemo(() => getCanvasMcpServers(nodes), [nodes])

  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([])

  const { rules, isLoading } = useToolHideRulesByServers(selectedServerIds)
  const attachedSet = useMemo(() => new Set(attachedIds), [attachedIds])

  const attachedDetailQueries = useQueries({
    queries: attachedIds.map((uuid) => ({
      queryKey: toolHideRuleKeys.detail(uuid),
      queryFn: async () => {
        const { data } = await apiClient.get<ToolHideRule>(
          `/tool-hide-rule/${uuid}/`,
        )
        return data
      },
      enabled: Boolean(uuid),
      staleTime: 60_000,
    })),
  })

  const attachedRules = useMemo(() => {
    const fromDetails = attachedDetailQueries
      .map((query) => query.data)
      .filter((rule): rule is ToolHideRule => Boolean(rule))

    if (fromDetails.length === attachedIds.length && attachedIds.length > 0) {
      return fromDetails
    }

    if (fromDetails.length > 0) return fromDetails

    return rules.filter((rule) => attachedSet.has(rule.uuid))
  }, [attachedDetailQueries, attachedIds.length, rules, attachedSet])

  const serverLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const server of canvasServers) {
      map.set(
        server.configId,
        server.source === 'stack' && server.stackLabel
          ? `${server.name} · ${server.stackLabel}`
          : server.name,
      )
    }
    return map
  }, [canvasServers])

  const toggleServer = (configId: string) => {
    setSelectedServerIds((current) =>
      current.includes(configId)
        ? current.filter((id) => id !== configId)
        : [...current, configId],
    )
  }

  const toggleRule = (uuid: string) => {
    if (attachedSet.has(uuid)) {
      onChange(attachedIds.filter((id) => id !== uuid))
      return
    }
    onChange([...attachedIds, uuid])
  }

  const detachRule = (uuid: string) => {
    onChange(attachedIds.filter((id) => id !== uuid))
  }

  const singles = canvasServers.filter((server) => server.source === 'single')
  const stacked = canvasServers.filter((server) => server.source === 'stack')

  return (
    <div className="space-y-3 rounded-xl border border-panel-border/70 bg-panel-inspector/20 p-3">
      <div>
        <p
          className={cn(
            'font-medium text-panel-inspector-fg',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          Tool hide rules
        </p>
        <p className="text-[10px] text-panel-muted">
          Pick MCP servers from this canvas, then select their hide rules
        </p>
      </div>

      {canvasServers.length === 0 ? (
        <p className="text-[11px] text-panel-muted">
          Add a configured Tool Server or Server Stack to the canvas to choose
          hide rules.
        </p>
      ) : (
        <div className="space-y-2">
          {singles.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-panel-muted">
                Servers
              </p>
              <div className="flex flex-wrap gap-1.5">
                {singles.map((server) => {
                  const active = selectedServerIds.includes(server.configId)
                  return (
                    <button
                      key={server.configId}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleServer(server.configId)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-colors',
                        active
                          ? 'border-connector bg-connector/15 text-panel-inspector-fg'
                          : 'border-panel-border/70 text-panel-muted hover:border-connector/40 hover:text-panel-inspector-fg',
                      )}
                    >
                      <Server className="size-3" />
                      <span className="max-w-[9rem] truncate">{server.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {stacked.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-panel-muted">
                Stack members
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stacked.map((server) => {
                  const active = selectedServerIds.includes(server.configId)
                  return (
                    <button
                      key={`${server.stackLabel}-${server.configId}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleServer(server.configId)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-colors',
                        active
                          ? 'border-connector bg-connector/15 text-panel-inspector-fg'
                          : 'border-panel-border/70 text-panel-muted hover:border-connector/40 hover:text-panel-inspector-fg',
                      )}
                    >
                      <Server className="size-3" />
                      <span className="max-w-[10rem] truncate">
                        {server.name}
                        {server.stackLabel ? (
                          <span className="text-panel-muted">
                            {' '}
                            · {server.stackLabel}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedServerIds.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-panel-muted">
            Rules for selected servers
          </p>

          {isLoading ? (
            <div className="flex justify-center py-3 text-panel-muted">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-[11px] text-panel-muted">
              No hide rules found for the selected servers.
            </p>
          ) : (
            <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-0.5">
              {rules.map((rule) => {
                const checked = attachedSet.has(rule.uuid)
                return (
                  <li key={rule.uuid}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-2 rounded-lg border px-2 py-1.5 transition-colors',
                        checked
                          ? 'border-connector/50 bg-node/50'
                          : 'border-panel-border/50 hover:bg-node/30',
                        disabled && 'pointer-events-none opacity-60',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleRule(rule.uuid)}
                        className="mt-0.5 size-3.5 rounded border-panel-border"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-panel-inspector-fg">
                          {rule.name}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[10px] text-panel-muted">
                          {rule.message}
                        </span>
                        <span className="mt-0.5 block text-[9px] text-panel-muted">
                          {serverLabelById.get(rule.server) ?? rule.server}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-1.5 border-t border-panel-border/50 pt-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-panel-muted">
          Attached ({attachedIds.length})
        </p>
        {attachedIds.length === 0 ? (
          <p className="text-[11px] text-panel-muted">No rules attached yet.</p>
        ) : (
          <ul className="space-y-1">
            {attachedRules.map((rule) => (
              <li
                key={rule.uuid}
                className="flex items-center justify-between gap-2 rounded-md bg-node/40 px-2 py-1"
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-panel-inspector-fg">
                    {rule.name}
                  </p>
                  <p className="truncate text-[9px] text-panel-muted">
                    {serverLabelById.get(rule.server) ?? rule.server}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-destructive"
                  onClick={() => detachRule(rule.uuid)}
                  disabled={disabled}
                  aria-label={`Detach ${rule.name}`}
                >
                  <X className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
