import { Copy, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface NodeHoverActionsProps {
  onDuplicate: (event: React.MouseEvent) => void
  onRemove: (event: React.MouseEvent) => void
  duplicateLabel?: string
  removeLabel?: string
}

const actionButtonClass = cn(
  'nodrag nopan flex size-6 items-center justify-center rounded-md border border-border bg-background shadow-md transition-all duration-150',
  'pointer-events-none opacity-0 group-hover/node:pointer-events-auto group-hover/node:opacity-100',
)

export function NodeHoverActions({
  onDuplicate,
  onRemove,
  duplicateLabel = 'Duplicate block',
  removeLabel = 'Remove block',
}: NodeHoverActionsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onDuplicate}
        className={cn(
          actionButtonClass,
          'absolute -top-2 -left-2 z-40 text-panel-muted hover:border-connector hover:bg-node hover:text-connector',
        )}
        aria-label={duplicateLabel}
      >
        <Copy className="size-3" />
      </button>

      <button
        type="button"
        onClick={onRemove}
        className={cn(
          actionButtonClass,
          'absolute -top-2 -right-2 z-40 text-destructive hover:border-destructive hover:bg-destructive hover:text-white',
        )}
        aria-label={removeLabel}
      >
        <Trash2 className="size-3" />
      </button>
    </>
  )
}
