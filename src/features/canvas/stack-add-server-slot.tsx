import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

interface StackAddServerSlotProps {
  onClick: () => void
  className?: string
}

export function StackAddServerSlot({ onClick, className }: StackAddServerSlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[148px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-connector/35 bg-connector/5 p-4 text-center transition-all duration-200',
        'hover:border-connector/60 hover:bg-connector/10',
        className,
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-xl border border-connector/30 bg-node text-connector">
        <Plus className="size-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-node-fg">Add server</p>
        <p className="mt-0.5 text-[10px] text-panel-muted">Create and configure</p>
      </div>
    </button>
  )
}
