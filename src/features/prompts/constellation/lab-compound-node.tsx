import { Handle, Position, type NodeProps } from '@xyflow/react'
import { AtSign, Layers, Minimize2 } from 'lucide-react'

import type { CompoundNodeData } from '@/lib/prompts/use-molecule-graph'
import { cn } from '@/lib/utils'

export function LabCompoundNode({ data }: NodeProps) {
  const nodeData = data as CompoundNodeData
  const Icon = nodeData.kind === 'system-prompt' ? Layers : Minimize2

  return (
    <div className="group/labcompound relative w-[200px]">
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2.5 !border-interactive/50 !bg-interactive"
      />

      <div
        className={cn(
          'relative overflow-hidden rounded-[1.75rem] border-2 bg-node/80 shadow-xl backdrop-blur-sm transition-all duration-300',
          nodeData.selected
            ? 'border-interactive shadow-[0_0_0_4px_color-mix(in_oklch,var(--interactive)_20%,transparent),0_16px_40px_color-mix(in_oklch,var(--interactive)_12%,transparent)]'
            : 'border-panel-border hover:border-interactive/40',
          nodeData.highlighted &&
            !nodeData.selected &&
            'border-connector/50 shadow-[0_0_24px_color-mix(in_oklch,var(--connector)_15%,transparent)]',
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-interactive/8 via-transparent to-connector/8" />

        <div className="relative p-4">
          <div className="flex items-start gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-interactive/15 text-interactive">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-node-fg">{nodeData.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[9px] leading-relaxed text-panel-muted">
                {nodeData.preview || 'Empty compound'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-interactive/10 px-2 py-0.5 text-[9px] font-medium text-interactive">
              <AtSign className="size-2.5" />
              {nodeData.refCount} bond{nodeData.refCount === 1 ? '' : 's'}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-panel-muted">
              {nodeData.kind === 'system-prompt' ? 'System' : 'Compress'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
