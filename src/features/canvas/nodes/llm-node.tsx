import { type NodeProps } from '@xyflow/react'
import { BrainCircuit } from 'lucide-react'

import { NodeHoverActions } from '@/features/canvas/nodes/node-hover-actions'
import { NodePorts } from '@/features/canvas/nodes/node-ports'
import type { LlmNodeData } from '@/lib/types/llm-config'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

export function LlmNode({ id, data, selected }: NodeProps) {
  const nodeData = data as LlmNodeData
  const openLlmModal = useWorkflowStore((state) => state.openLlmModal)
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const removeNode = useWorkflowStore((state) => state.removeNode)

  const hasConfig = Boolean(nodeData.configId && nodeData.model)

  const handleOpenConfig = () => {
    openLlmModal(id)
  }

  const handleDuplicate = (event: React.MouseEvent) => {
    event.stopPropagation()
    duplicateNode(id)
  }

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation()
    removeNode(id)
  }

  return (
    <div className="group/node relative size-[120px]">
      <div className="absolute -inset-8 z-0" aria-hidden />

      <NodePorts nodeId={id} />

      <NodeHoverActions
        onDuplicate={handleDuplicate}
        onRemove={handleRemove}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenConfig}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleOpenConfig()
          }
        }}
        className={cn(
          'relative z-10 flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-full border-2 bg-node p-2.5 text-center shadow-md transition-all duration-150',
          selected
            ? 'border-connector shadow-[0_0_0_4px_color-mix(in_oklch,var(--connector)_22%,transparent),0_8px_24px_color-mix(in_oklch,var(--connector)_18%,transparent)]'
            : 'border-connector/30 hover:border-connector/60',
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-connector/90 to-interactive text-node-icon-fg shadow-sm">
          <BrainCircuit className="size-[18px]" />
        </div>

        <div className="w-full min-w-0 px-2">
          {hasConfig ? (
            <>
              <p className="truncate text-[11px] font-semibold leading-tight text-node-fg">
                {nodeData.model}
              </p>
              <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                {nodeData.provider}
              </p>
            </>
          ) : (
            <>
              <p className="truncate text-[9px] font-bold uppercase tracking-widest text-connector">
                LLM
              </p>
              <p className="mt-0.5 text-[8px] leading-tight text-muted-foreground">
                Tap to configure
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
