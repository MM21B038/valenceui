import { Handle, Position, type NodeProps } from '@xyflow/react'
import { FileText, Sparkles } from 'lucide-react'

import type { AtomNodeData } from '@/lib/prompts/use-molecule-graph'
import { cn } from '@/lib/utils'

export function LabAtomNode({ data }: NodeProps) {
  const nodeData = data as AtomNodeData & { dragging?: boolean }
  const isSkill = nodeData.kind === 'skill'
  const Icon = isSkill ? Sparkles : FileText
  const dragging = Boolean(nodeData.dragging)

  return (
    <div
      className={cn(
        'group/labatom relative h-[108px] w-[118px] will-change-transform',
        dragging && 'cursor-grabbing',
      )}
    >
      <Handle
        type="source"
        position={Position.Right}
        className="!pointer-events-none !size-2 !border-connector/50 !bg-connector !opacity-0"
      />

      <div
        className={cn(
          'absolute inset-0 node-shape-hex',
          // Never transition transform — it fights React Flow drag.
          'transition-[background-color,box-shadow,opacity,filter] duration-200 ease-out',
          nodeData.selected
            ? isSkill
              ? 'bg-interactive/50'
              : 'bg-connector/50'
            : isSkill
              ? 'bg-interactive/20'
              : 'bg-connector/20',
          nodeData.highlighted && !dragging && 'animate-pulse',
          dragging && 'opacity-90 brightness-105',
        )}
        aria-hidden
      />

      <div
        className={cn(
          'absolute inset-[3px] node-shape-hex bg-node shadow-lg',
          'transition-[box-shadow,filter] duration-200 ease-out',
          nodeData.selected &&
            'shadow-[0_0_0_3px_color-mix(in_oklch,var(--connector)_35%,transparent),0_12px_28px_color-mix(in_oklch,var(--connector)_18%,transparent)]',
          nodeData.highlighted &&
            !nodeData.selected &&
            'shadow-[0_0_0_2px_color-mix(in_oklch,var(--interactive)_30%,transparent)]',
          dragging &&
            'shadow-[0_18px_40px_color-mix(in_oklch,var(--connector)_28%,transparent),0_0_0_2px_color-mix(in_oklch,var(--connector)_25%,transparent)]',
        )}
      >
        <div className="flex h-full flex-col items-center justify-center gap-1.5 px-3 text-center">
          <div
            className={cn(
              'flex size-8 items-center justify-center rounded-lg',
              isSkill
                ? 'bg-interactive/15 text-interactive'
                : 'bg-connector/15 text-connector',
            )}
          >
            <Icon className="size-4" />
          </div>
          <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-node-fg">
            {nodeData.name}
          </p>
          {nodeData.bondCount > 0 ? (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[8px] font-medium',
                isSkill
                  ? 'bg-interactive/10 text-interactive'
                  : 'bg-connector/10 text-connector',
              )}
            >
              {nodeData.bondCount} bond{nodeData.bondCount === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
