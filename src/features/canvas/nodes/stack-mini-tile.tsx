import { Server } from 'lucide-react'

import { useTheme } from '@/components/theme/theme-provider'
import { formatTransportLabel } from '@/lib/types/mcp-server-config'
import type { ValenceNode } from '@/lib/types/workflow'
import {
  componentBorderMutedStyle,
  componentPaintBorderStyle,
  componentIconGradientStyle,
  componentSurfaceStyle,
  componentVar,
} from '@/lib/theme/component-block-styles'
import { cn } from '@/lib/utils'

interface StackMiniTileProps {
  server: ValenceNode & { type: 'toolServer' }
  size?: 'sm' | 'md'
  className?: string
}

export function StackMiniTile({ server, size = 'sm', className }: StackMiniTileProps) {
  const { componentGradients } = useTheme()
  const hasPaint = Boolean(componentGradients.toolServer)
  const isConfigured = Boolean(server.data.configId && server.data.name)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border text-center shadow-sm',
        size === 'sm' ? 'gap-0.5 p-1' : 'gap-1 p-2',
        !isConfigured && 'border-dashed',
        className,
      )}
      style={{
        ...componentSurfaceStyle('toolServer'),
        ...(isConfigured || hasPaint
          ? componentPaintBorderStyle('toolServer')
          : componentBorderMutedStyle('toolServer')),
        opacity: 0.9,
      }}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-lg',
          size === 'sm' ? 'size-5' : 'size-7',
        )}
        style={componentIconGradientStyle('toolServer')}
      >
        <Server className={size === 'sm' ? 'size-2.5' : 'size-3.5'} />
      </div>
      <p
        className={cn(
          'w-full truncate font-semibold leading-tight',
          size === 'sm' ? 'text-[7px]' : 'text-[9px]',
        )}
        style={{ color: componentVar('toolServer', 'foreground') }}
      >
        {isConfigured ? server.data.name : 'Server'}
      </p>
      {isConfigured ? (
        <p
          className={cn('w-full truncate', size === 'sm' ? 'text-[6px]' : 'text-[8px]')}
          style={{ color: componentVar('toolServer', 'muted') }}
        >
          {formatTransportLabel(server.data.transport ?? '')}
        </p>
      ) : (
        <p
          className={size === 'sm' ? 'text-[6px]' : 'text-[8px]'}
          style={{ color: componentVar('toolServer', 'muted') }}
        >
          Setup needed
        </p>
      )}
    </div>
  )
}
