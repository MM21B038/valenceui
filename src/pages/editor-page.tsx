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
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { CanvasPaintPanel } from '@/components/theme/canvas-paint-panel'
import { FloatingPaintBrush } from '@/components/theme/floating-paint-brush'
import { PaintModeProvider } from '@/components/theme/paint-mode-provider'
import { A2aAddAgentChrome } from '@/features/a2a/a2a-add-agent'
import { GroupStackExpanded } from '@/features/canvas/group-stack-expanded'
import { WorkflowCanvas } from '@/features/canvas/workflow-canvas'
import { getStackIdAtPoint } from '@/lib/canvas/stack-dump'
import { hydrateWorkspaceGraph } from '@/lib/canvas/workspace-graph'
import { AgentCardConfigPanel } from '@/features/agent-card/agent-card-config-panel'
import { AgentExecutorConfigPanel } from '@/features/agent-executor/agent-executor-config-panel'
import { AgentInterfaceConfigPanel } from '@/features/agent-interface/agent-interface-config-panel'
import { AgentSkillConfigPanel } from '@/features/agent-skill/agent-skill-config-panel'
import { LlmConfigPanel } from '@/features/llm/llm-config-panel'
import { ToolServerConfigPanel } from '@/features/tool-server/tool-server-config-panel'
import { ThreadConfigPanel } from '@/features/thread-config/thread-config-panel'
import { ComponentRail } from '@/features/palette/component-rail'
import { PaletteDragPreview } from '@/features/palette/palette-drag-preview'
import type { ComponentType } from '@/features/palette/component-registry'
import { useWorkspace } from '@/lib/api/dnd-workspace'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

export function EditorPage() {
  const { workspaceId } = useParams()
  const loadWorkspaceGraph = useWorkflowStore((state) => state.loadWorkspaceGraph)
  const workflowId = useWorkflowStore((state) => state.workflowId)
  const { data, isLoading, isError } = useWorkspace(workspaceId ?? '')
  const [isHydrating, setIsHydrating] = useState(false)
  const [hydrateError, setHydrateError] = useState(false)

  useEffect(() => {
    if (!data || !workspaceId) return
    // Read from the store directly so this effect does not re-run (and
    // cancel) when loadWorkspaceGraph updates workflowId.
    if (useWorkflowStore.getState().workflowId === data.uuid) return

    let cancelled = false
    setIsHydrating(true)
    setHydrateError(false)

    hydrateWorkspaceGraph(data)
      .then((graph) => {
        if (cancelled) return
        loadWorkspaceGraph({
          id: data.uuid,
          name: data.name,
          type: data.type,
          nodes: graph.nodes,
          edges: graph.edges,
        })
      })
      .catch(() => {
        if (!cancelled) setHydrateError(true)
      })
      .finally(() => {
        setIsHydrating(false)
      })

    return () => {
      cancelled = true
    }
  }, [data, workspaceId, loadWorkspaceGraph])

  const graphReady = Boolean(data && workflowId === data.uuid)
  const showLoading =
    Boolean(workspaceId) && (isLoading || isHydrating || (!graphReady && !hydrateError))
  const showError = Boolean(workspaceId) && (isError || hydrateError)

  return (
    <AppShell>
      <PaintModeProvider>
        <ReactFlowProvider>
          {showLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-panel-muted">
              Loading workspace…
            </div>
          ) : showError ? (
            <div className="flex h-full items-center justify-center text-sm text-destructive">
              Could not load workspace.
            </div>
          ) : (
            <EditorWorkspace />
          )}
        </ReactFlowProvider>
      </PaintModeProvider>
    </AppShell>
  )
}

function EditorWorkspace() {
  const workspaceType = useWorkflowStore((state) => state.workspaceType)
  const isA2a = workspaceType === 'a2a'

  if (isA2a) {
    return <A2aEditorWorkspace />
  }

  return <ExecutorEditorWorkspace />
}

function A2aEditorWorkspace() {
  const agentExecutorModalNodeId = useWorkflowStore(
    (state) => state.agentExecutorModalNodeId,
  )

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <CanvasPaintPanel />
      <FloatingPaintBrush />
      <div className="h-full w-full">
        <WorkflowCanvas />
      </div>
      <A2aAddAgentChrome />
      {agentExecutorModalNodeId ? <AgentExecutorConfigPanel /> : null}
    </div>
  )
}

function ExecutorEditorWorkspace() {
  const addLlmNode = useWorkflowStore((state) => state.addLlmNode)
  const addToolServerNode = useWorkflowStore((state) => state.addToolServerNode)
  const addThreadConfigNode = useWorkflowStore(
    (state) => state.addThreadConfigNode,
  )
  const addAgentSkillNode = useWorkflowStore((state) => state.addAgentSkillNode)
  const addAgentInterfaceNode = useWorkflowStore(
    (state) => state.addAgentInterfaceNode,
  )
  const addAgentCardNode = useWorkflowStore((state) => state.addAgentCardNode)
  const addAgentExecutorNode = useWorkflowStore(
    (state) => state.addAgentExecutorNode,
  )
  const addToolServerToStack = useWorkflowStore(
    (state) => state.addToolServerToStack,
  )
  const addAgentSkillToStack = useWorkflowStore(
    (state) => state.addAgentSkillToStack,
  )
  const addAgentInterfaceToStack = useWorkflowStore(
    (state) => state.addAgentInterfaceToStack,
  )
  const openToolServerModal = useWorkflowStore(
    (state) => state.openToolServerModal,
  )
  const openAgentSkillModal = useWorkflowStore(
    (state) => state.openAgentSkillModal,
  )
  const openAgentInterfaceModal = useWorkflowStore(
    (state) => state.openAgentInterfaceModal,
  )
  const nodes = useWorkflowStore((state) => state.nodes)
  const llmModalNodeId = useWorkflowStore((state) => state.llmModalNodeId)
  const toolServerModalNodeId = useWorkflowStore(
    (state) => state.toolServerModalNodeId,
  )
  const threadConfigModalNodeId = useWorkflowStore(
    (state) => state.threadConfigModalNodeId,
  )
  const agentSkillModalNodeId = useWorkflowStore(
    (state) => state.agentSkillModalNodeId,
  )
  const agentInterfaceModalNodeId = useWorkflowStore(
    (state) => state.agentInterfaceModalNodeId,
  )
  const agentCardModalNodeId = useWorkflowStore(
    (state) => state.agentCardModalNodeId,
  )
  const agentExecutorModalNodeId = useWorkflowStore(
    (state) => state.agentExecutorModalNodeId,
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
      return
    }

    if (type === 'toolServer') {
      const stackId = getStackIdAtPoint(position, nodes, 'serverStack')
      if (stackId) {
        const id = addToolServerToStack(stackId)
        if (id) openToolServerModal(id)
        return
      }
      addToolServerNode(position)
      return
    }

    if (type === 'threadConfig') {
      addThreadConfigNode(position)
      return
    }

    if (type === 'agentSkill') {
      const stackId = getStackIdAtPoint(position, nodes, 'skillStack')
      if (stackId) {
        const id = addAgentSkillToStack(stackId)
        if (id) openAgentSkillModal(id)
        return
      }
      addAgentSkillNode(position)
      return
    }

    if (type === 'agentInterface') {
      const stackId = getStackIdAtPoint(position, nodes, 'interfaceStack')
      if (stackId) {
        const id = addAgentInterfaceToStack(stackId)
        if (id) openAgentInterfaceModal(id)
        return
      }
      addAgentInterfaceNode(position)
      return
    }

    if (type === 'agentCard') {
      addAgentCardNode(position)
      return
    }

    if (type === 'agentExecutor') {
      addAgentExecutorNode(position)
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
        <GroupStackExpanded />
        {llmModalNodeId ? (
          <LlmConfigPanel />
        ) : toolServerModalNodeId ? (
          <ToolServerConfigPanel />
        ) : threadConfigModalNodeId ? (
          <ThreadConfigPanel />
        ) : agentSkillModalNodeId ? (
          <AgentSkillConfigPanel />
        ) : agentInterfaceModalNodeId ? (
          <AgentInterfaceConfigPanel />
        ) : agentCardModalNodeId ? (
          <AgentCardConfigPanel />
        ) : agentExecutorModalNodeId ? (
          <AgentExecutorConfigPanel />
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
