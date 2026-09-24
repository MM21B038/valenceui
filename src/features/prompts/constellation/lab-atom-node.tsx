import { Handle, Position, type NodeProps } from '@xyflow/react'
import { FileText, Sparkles } from 'lucide-react'

import type { AtomNodeData } from '@/lib/prompts/use-molecule-graph'
import { cn } from '@/lib/utils'

export function LabAtomNode({ data }: NodeProps) {
  const nodeData = data as AtomNodeData
  const isSkill = nodeData.kind === 'skill'
  const Icon = isSkill ? Sparkles : FileText

  return (
    <div className="group/labatom relative h-[108px] w-[118px]">
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-connector/50 !bg-connector"
      />

      <div
        className={cn(
          'absolute inset-0 node-shape-hex transition-all duration-300',
          nodeData.selected
            ? isSkill
              ? 'bg-interactive/50'
              : 'bg-connector/50'
            : isSkill
              ? 'bg-interactive/20'
              : 'bg-connector/20',
          nodeData.highlighted && 'animate-pulse',
        )}
        aria-hidden
      />

      <div
        className={cn(
          'absolute inset-[3px] node-shape-hex bg-node shadow-lg transition-all duration-300',
          nodeData.selected &&
            'shadow-[0_0_0_3px_color-mix(in_oklch,var(--connector)_35%,transparent),0_12px_28px_color-mix(in_oklch,var(--connector)_18%,transparent)]',
          nodeData.highlighted &&
            !nodeData.selected &&
            'shadow-[0_0_0_2px_color-mix(in_oklch,var(--interactive)_30%,transparent)]',
        )}
      >
        <div className="flex h-full flex-col items-center justify-center gap-1.5 px-3 text-center">
          <div
            className={cn(
              'flex size-8 items-center justify-center rounded-lg',
              isSkill ? 'bg-interactive/15 text-interactive' : 'bg-connector/15 text-connector',
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
                isSkill ? 'bg-interactive/10 text-interactive' : 'bg-connector/10 text-connector',
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
