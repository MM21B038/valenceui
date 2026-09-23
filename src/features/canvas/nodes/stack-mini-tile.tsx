import { Server } from 'lucide-react'

import { formatTransportLabel } from '@/lib/types/mcp-server-config'
import type { ValenceNode } from '@/lib/types/workflow'
import { cn } from '@/lib/utils'

interface StackMiniTileProps {
  server: ValenceNode & { type: 'toolServer' }
  size?: 'sm' | 'md'
  className?: string
}

export function StackMiniTile({ server, size = 'sm', className }: StackMiniTileProps) {
  const isConfigured = Boolean(server.data.configId && server.data.name)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border bg-node/90 text-center shadow-sm',
        size === 'sm' ? 'gap-0.5 p-1' : 'gap-1 p-2',
        isConfigured
          ? 'border-connector/40'
          : 'border-panel-border/80 border-dashed',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-gradient-to-br from-interactive/90 to-connector text-node-icon-fg',
          size === 'sm' ? 'size-5' : 'size-7',
        )}
      >
        <Server className={size === 'sm' ? 'size-2.5' : 'size-3.5'} />
      </div>
      <p
        className={cn(
          'w-full truncate font-semibold leading-tight text-node-fg',
          size === 'sm' ? 'text-[7px]' : 'text-[9px]',
        )}
      >
        {isConfigured ? server.data.name : 'Server'}
      </p>
      {isConfigured ? (
        <p className={cn('w-full truncate text-panel-muted', size === 'sm' ? 'text-[6px]' : 'text-[8px]')}>
          {formatTransportLabel(server.data.transport ?? '')}
        </p>
      ) : (
        <p className={cn('text-panel-muted', size === 'sm' ? 'text-[6px]' : 'text-[8px]')}>
          Setup needed
        </p>
      )}
    </div>
  )
}
