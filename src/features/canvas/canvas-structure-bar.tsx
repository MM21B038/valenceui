import { useReactFlow } from '@xyflow/react'
import { Layers, Network, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useWorkflowStore } from '@/stores/workflow-store'

export function CanvasStructureBar() {
  const addServerStack = useWorkflowStore((state) => state.addServerStack)
  const addSkillStack = useWorkflowStore((state) => state.addSkillStack)
  const addInterfaceStack = useWorkflowStore((state) => state.addInterfaceStack)
  const { screenToFlowPosition } = useReactFlow()

  const centerPosition = () => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })
    return { x: position.x - 94, y: position.y - 74 }
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
          onClick={() => addServerStack(centerPosition())}
          className="h-7 gap-1.5 border-panel-border bg-node px-2.5 text-[10px] text-node-fg hover:bg-node-header"
        >
          <Layers className="size-3.5 text-connector" />
          Server Stack
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSkillStack(centerPosition())}
          className="h-7 gap-1.5 border-panel-border bg-node px-2.5 text-[10px] text-node-fg hover:bg-node-header"
        >
          <Sparkles className="size-3.5 text-connector" />
          Skill Stack
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addInterfaceStack(centerPosition())}
          className="h-7 gap-1.5 border-panel-border bg-node px-2.5 text-[10px] text-node-fg hover:bg-node-header"
        >
          <Network className="size-3.5 text-connector" />
          Interface Stack
        </Button>
      </div>
    </div>
  )
}
