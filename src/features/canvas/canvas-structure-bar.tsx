import { useReactFlow } from '@xyflow/react'
import { Layers } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useWorkflowStore } from '@/stores/workflow-store'

export function CanvasStructureBar() {
  const addServerStack = useWorkflowStore((state) => state.addServerStack)
  const { screenToFlowPosition } = useReactFlow()

  const handleAddStack = () => {
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    const position = screenToFlowPosition({
      x: centerX,
      y: centerY,
    })

    addServerStack({
      x: position.x - 94,
      y: position.y - 74,
    })
  }

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-panel-border bg-panel/95 px-2 py-1.5 text-panel-fg shadow-lg backdrop-blur-sm">
        <span className="px-1 text-[9px] font-medium uppercase tracking-wider text-panel-muted">
          Structure
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddStack}
          className="h-7 gap-1.5 border-panel-border bg-node px-2.5 text-[10px] text-node-fg hover:bg-node-header"
        >
          <Layers className="size-3.5 text-connector" />
          Server Stack
        </Button>
      </div>
    </div>
  )
}
