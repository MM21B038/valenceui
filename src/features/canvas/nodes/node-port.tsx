import { Handle, Position, type HandleProps } from '@xyflow/react'

import { cn } from '@/lib/utils'

const POSITION_STYLES: Record<Position, string> = {
  [Position.Top]: '!top-0 !left-1/2 !-translate-x-1/2 !-translate-y-[9px]',
  [Position.Right]: '!right-0 !top-1/2 !translate-x-[9px] !-translate-y-1/2',
  [Position.Bottom]: '!bottom-0 !left-1/2 !-translate-x-1/2 !translate-y-[9px]',
  [Position.Left]: '!left-0 !top-1/2 !-translate-x-[9px] !-translate-y-1/2',
}

interface NodePortProps extends Omit<HandleProps, 'type' | 'position'> {
  handleType: 'source' | 'target'
  position: Position
  isActive?: boolean
  isConnectable?: boolean
  /** When false the handle is visually hidden but may still accept pointer events. */
  showVisual?: boolean
}

export function NodePort({
  handleType,
  position,
  isActive = false,
  isConnectable = true,
  showVisual = true,
  className,
  ...props
}: NodePortProps) {
  return (
    <Handle
      type={handleType}
      position={position}
      isConnectable={isConnectable}
      className={cn(
        '!size-2.5 !rounded-full !border-2 !border-node !transition-all duration-150',
        POSITION_STYLES[position],
        showVisual
          ? isActive
            ? '!bg-connector !opacity-100 !shadow-[0_0_0_4px_color-mix(in_oklch,var(--connector)_40%,transparent)]'
            : '!bg-node-header hover:!scale-125 hover:!bg-connector/90'
          : '!border-transparent !bg-transparent !shadow-none',
        className,
      )}
      {...props}
    />
  )
}
