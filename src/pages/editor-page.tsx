import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  type DragEndEvent,
  type DragStartEvent,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { ReactFlowProvider, useReactFlow } from '@xyflow/react'
import { useState } from 'react'

import { AppShell } from '@/components/layout/app-shell'
import { CanvasPaintPanel } from '@/components/theme/canvas-paint-panel'
import { FloatingPaintBrush } from '@/components/theme/floating-paint-brush'
import { PaintModeProvider } from '@/components/theme/paint-mode-provider'
import { ServerStackExpanded } from '@/features/canvas/server-stack-expanded'
import { WorkflowCanvas } from '@/features/canvas/workflow-canvas'
import { getStackIdAtPoint } from '@/lib/canvas/stack-dump'
import { LlmConfigPanel } from '@/features/llm/llm-config-panel'
import { ToolServerConfigPanel } from '@/features/tool-server/tool-server-config-panel'
import { ComponentRail } from '@/features/palette/component-rail'
import { PaletteDragPreview } from '@/features/palette/palette-drag-preview'
import type { ComponentType } from '@/features/palette/component-registry'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

export function EditorPage() {
  return (
    <AppShell>
      <PaintModeProvider>
        <ReactFlowProvider>
          <EditorWorkspace />
        </ReactFlowProvider>
      </PaintModeProvider>
    </AppShell>
  )
}

function EditorWorkspace() {
  const addLlmNode = useWorkflowStore((state) => state.addLlmNode)
  const addToolServerNode = useWorkflowStore((state) => state.addToolServerNode)
  const addToolServerToStack = useWorkflowStore((state) => state.addToolServerToStack)
  const nodes = useWorkflowStore((state) => state.nodes)
  const llmModalNodeId = useWorkflowStore((state) => state.llmModalNodeId)
  const toolServerModalNodeId = useWorkflowStore(
    (state) => state.toolServerModalNodeId,
  )
  const { screenToFlowPosition } = useReactFlow()
  const [activeType, setActiveType] = useState<ComponentType | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type as ComponentType | undefined
    if (type) setActiveType(type)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const type = event.active.data.current?.type as ComponentType | undefined
    setActiveType(null)

    if (!type || !event.over || event.over.id !== 'workflow-canvas') return

    const translated = event.active.rect.current.translated
    if (!translated) return

    const position = screenToFlowPosition({
      x: translated.left + translated.width / 2,
      y: translated.top + translated.height / 2,
    })

    if (type === 'llm') {
      addLlmNode(position)
    }

    if (type === 'toolServer') {
      const stackId = getStackIdAtPoint(position, nodes)
      if (stackId) {
        addToolServerToStack(stackId)
        return
      }

      addToolServerNode(position)
    }
  }

  const handleDragCancel = () => {
    setActiveType(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="relative h-full min-h-0 overflow-hidden">
        <CanvasPaintPanel />
        <FloatingPaintBrush />
        <ComponentRail />
        <CanvasDropZone isDragging={activeType !== null} />
        <ServerStackExpanded />
        {llmModalNodeId ? (
          <LlmConfigPanel />
        ) : toolServerModalNodeId ? (
          <ToolServerConfigPanel />
        ) : null}
      </div>

      <DragOverlay
        modifiers={[snapCenterToCursor]}
        dropAnimation={{ duration: 200, easing: 'ease-out' }}
        zIndex={1000}
      >
        {activeType ? <PaletteDragPreview type={activeType} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function CanvasDropZone({ isDragging }: { isDragging: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'workflow-canvas' })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-full w-full transition-shadow duration-200',
        isDragging && isOver && 'ring-2 ring-inset ring-connector/30',
      )}
    >
      <WorkflowCanvas />
    </div>
  )
}
