import { Bot, Loader2 } from 'lucide-react'

import type {
  AgentExecutor,
  AgentExecutorListItem,
} from '@/lib/types/agent-executor'
import { cn } from '@/lib/utils'

interface ExecutorPickerListProps {
  configs: AgentExecutorListItem[]
  isLoading: boolean
  isError: boolean
  search: string
  onSearchChange: (value: string) => void
  selectedId?: string
  onSelect: (config: AgentExecutor | AgentExecutorListItem) => void
  emptyLabel?: string
}

export function ExecutorPickerList({
  configs,
  isLoading,
  isError,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  emptyLabel = 'No executors match.',
}: ExecutorPickerListProps) {
  const filtered = configs.filter((config) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      config.name.toLowerCase().includes(q) ||
      config.host.toLowerCase().includes(q) ||
      String(config.port).includes(q)
    )
  })

  return (
    <div className="space-y-3">
      <input
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
        placeholder="Search executors…"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {isLoading ? (
        <div className="flex justify-center py-10 text-panel-muted">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-xs text-destructive">API unreachable.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((config) => (
            <button
              key={config.uuid}
              type="button"
              onClick={() => onSelect(config)}
              className={cn(
                'flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border p-3',
                selectedId === config.uuid
                  ? 'border-connector bg-connector/10'
                  : 'border-panel-border bg-node/40',
              )}
            >
              <Bot className="size-5 text-connector" />
              <p className="w-full truncate text-xs font-semibold">
                {config.name}
              </p>
              <p className="text-[10px] text-panel-muted">
                {config.host}:{config.port}
              </p>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="col-span-2 text-center text-xs text-panel-muted">
              {emptyLabel}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
