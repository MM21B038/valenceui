import { Copy, LogOut, Server, Trash2 } from 'lucide-react'

import { formatTransportLabel } from '@/lib/types/mcp-server-config'
import type { ValenceNode } from '@/lib/types/workflow'
import { cn } from '@/lib/utils'

interface StackServerCardProps {
  server: ValenceNode & { type: 'toolServer' }
  isActive: boolean
  onConfigure: () => void
  onEject: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function CardAction({
  label,
  onClick,
  destructive,
  children,
}: {
  label: string
  onClick: () => void
  destructive?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
        destructive
          ? 'text-destructive/80 hover:bg-destructive/10 hover:text-destructive'
          : 'text-panel-muted hover:bg-node hover:text-panel-inspector-fg',
      )}
    >
      {children}
    </button>
  )
}

export function StackServerCard({
  server,
  isActive,
  onConfigure,
  onEject,
  onDuplicate,
  onDelete,
}: StackServerCardProps) {
  const isConfigured = Boolean(server.data.configId && server.data.name)

  return (
    <div
      className={cn(
        'flex min-h-[148px] flex-col overflow-hidden rounded-2xl border bg-node/60 transition-all duration-200',
        isActive
          ? 'border-connector shadow-[0_0_0_1px_var(--connector)]'
          : 'border-panel-border hover:border-connector/40',
      )}
    >
      <button
        type="button"
        onClick={onConfigure}
        className="flex flex-1 items-start gap-3 p-3 text-left transition-colors hover:bg-node/80"
      >
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-interactive/90 to-connector text-node-icon-fg shadow-sm',
            !isConfigured && 'opacity-80',
          )}
        >
          <Server className="size-4" />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-xs font-semibold text-node-fg">
            {isConfigured ? server.data.name : 'Unconfigured server'}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {isConfigured ? (
              <span className="rounded-md bg-node-header px-1.5 py-0.5 text-[9px] font-medium text-panel-muted">
                {formatTransportLabel(server.data.transport ?? '')}
              </span>
            ) : null}
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[9px] font-medium',
                isConfigured
                  ? 'bg-connector/15 text-connector'
                  : 'bg-panel-border/60 text-panel-muted',
              )}
            >
              {isConfigured ? 'Ready' : 'Needs setup'}
            </span>
          </div>
          {!isConfigured ? (
            <p className="mt-2 text-[10px] leading-snug text-panel-muted">
              Click to choose an MCP server
            </p>
          ) : null}
        </div>
      </button>

      <div className="flex divide-x divide-panel-border border-t border-panel-border">
        <CardAction label="Eject from stack" onClick={onEject}>
          <LogOut className="size-3" />
          Eject
        </CardAction>
        <CardAction label="Duplicate server" onClick={onDuplicate}>
          <Copy className="size-3" />
          Copy
        </CardAction>
        <CardAction label="Delete server" onClick={onDelete} destructive>
          <Trash2 className="size-3" />
          Delete
        </CardAction>
      </div>
    </div>
  )
}
