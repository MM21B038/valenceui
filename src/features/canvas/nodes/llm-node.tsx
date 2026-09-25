import { type NodeProps } from '@xyflow/react'
import { BrainCircuit } from 'lucide-react'

import { usePaintMode } from '@/components/theme/paint-mode-provider'
import { useTheme } from '@/components/theme/theme-provider'
import { NodeHoverActions } from '@/features/canvas/nodes/node-hover-actions'
import { NodePorts } from '@/features/canvas/nodes/node-ports'
import type { LlmNodeData } from '@/lib/types/llm-config'
import {
  componentBorderMutedStyle,
  componentPaintBorderStyle,
  componentIconGradientStyle,
  componentSelectedRingStyle,
  componentSurfaceStyle,
  componentVar,
} from '@/lib/theme/component-block-styles'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

export function LlmNode({ id, data, selected }: NodeProps) {
  const nodeData = data as LlmNodeData
  const openLlmModal = useWorkflowStore((state) => state.openLlmModal)
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const removeNode = useWorkflowStore((state) => state.removeNode)

  const { componentGradients } = useTheme()
  const { isPaintMode, hoverTarget, applyToComponent } = usePaintMode()
  const hasPaint = Boolean(componentGradients.llm)
  const hasConfig = Boolean(nodeData.configId && nodeData.model)

  const handleOpenConfig = () => {
    if (isPaintMode) {
      applyToComponent('llm')
      return
    }
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
        data-paint-target="llm"
        onClick={handleOpenConfig}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleOpenConfig()
          }
        }}
        style={{
          ...componentSurfaceStyle('llm'),
          ...(selected
            ? componentSelectedRingStyle('llm')
            : hasPaint
              ? componentPaintBorderStyle('llm')
              : componentBorderMutedStyle('llm')),
        }}
        className={cn(
          'paint-mode-target relative z-10 flex size-full flex-col items-center justify-center gap-1.5 rounded-full p-2.5 text-center shadow-md transition-all duration-150',
          !hasPaint && !selected && 'border-2',
          !selected && 'hover:opacity-95',
          isPaintMode && 'paint-mode-armed',
          hoverTarget === 'llm' && 'paint-drop-target',
        )}
      >
        <div
          className="flex size-10 items-center justify-center rounded-full shadow-sm"
          style={componentIconGradientStyle('llm')}
        >
          <BrainCircuit className="size-[18px]" />
        </div>

        <div className="w-full min-w-0 px-2">
          {hasConfig ? (
            <>
              <p
                className="truncate text-[11px] font-semibold leading-tight"
                style={{ color: componentVar('llm', 'foreground') }}
              >
                {nodeData.model}
              </p>
              <p
                className="mt-0.5 truncate text-[9px]"
                style={{ color: componentVar('llm', 'muted') }}
              >
                {nodeData.provider}
              </p>
            </>
          ) : (
            <>
              <p
                className="truncate text-[9px] font-bold uppercase tracking-widest"
                style={{ color: componentVar('llm', 'label') }}
              >
                LLM
              </p>
              <p
                className="mt-0.5 text-[8px] leading-tight"
                style={{ color: componentVar('llm', 'muted') }}
              >
                {isPaintMode ? 'Drop to paint' : 'Tap to configure'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
