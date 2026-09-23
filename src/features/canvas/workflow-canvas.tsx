import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type IsValidConnection,
  type OnMove,
  type OnNodeDrag,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback } from 'react'

import { getStackIdForToolServerNode } from '@/lib/canvas/stack-dump'
import type { ValenceNode } from '@/lib/types/workflow'

import { CanvasStructureBar } from '@/features/canvas/canvas-structure-bar'
import { nodeTypes } from '@/features/canvas/nodes'
import { isValidWorkflowConnection } from '@/lib/canvas/connection-rules'
import { useWorkflowStore } from '@/stores/workflow-store'

const defaultEdgeOptions = {
  animated: true,
  style: { strokeWidth: 2, stroke: 'var(--connector)' },
}

export function WorkflowCanvas() {
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
  const viewport = useWorkflowStore((state) => state.viewport)
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange)
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange)
  const onConnect = useWorkflowStore((state) => state.onConnect)
  const setViewport = useWorkflowStore((state) => state.setViewport)
  const onNodesDelete = useWorkflowStore((state) => state.onNodesDelete)
  const dumpServerIntoStack = useWorkflowStore((state) => state.dumpServerIntoStack)

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => isValidWorkflowConnection(connection, nodes, edges),
    [nodes, edges],
  )

  const handleMoveEnd: OnMove = useCallback(
    (_event, nextViewport) => {
      setViewport(nextViewport)
    },
    [setViewport],
  )

  const handleNodeDragStop: OnNodeDrag<ValenceNode> = useCallback(
    (_event, node) => {
      if (node.type !== 'toolServer' || node.data.stackId) return

      const stackId = getStackIdForToolServerNode(node, nodes)
      if (!stackId) return

      dumpServerIntoStack(node.id, stackId)
    },
    [dumpServerIntoStack, nodes],
  )

  return (
    <div
      className="h-full w-full bg-workspace [background-image:radial-gradient(circle_at_1px_1px,var(--workspace-dot)_1px,transparent_0)] [background-size:24px_24px]"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultViewport={viewport}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onMoveEnd={handleMoveEnd}
        onNodeDragStop={handleNodeDragStop}
        onNodesDelete={(deleted) => onNodesDelete(deleted.map((node) => node.id))}
        deleteKeyCode={['Backspace', 'Delete']}
        defaultEdgeOptions={defaultEdgeOptions}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--workspace-dot)"
        />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable className="!border-border !bg-node/90" />
        <CanvasStructureBar />
      </ReactFlow>
    </div>
  )
}
