import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type EdgeTypes,
  type IsValidConnection,
  type OnMove,
  type OnNodeDrag,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useMemo } from 'react'

import { getStackIdAtPoint } from '@/lib/canvas/stack-dump'
import type { ValenceNode } from '@/lib/types/workflow'

import { CanvasStructureBar } from '@/features/canvas/canvas-structure-bar'
import {
  ValenceFlowConnectionLine,
  ValenceFlowEdge,
} from '@/features/canvas/edges/valence-flow-edge'
import { nodeTypes } from '@/features/canvas/nodes'
import { isValidWorkflowConnection } from '@/lib/canvas/connection-rules'
import { useWorkflowStore } from '@/stores/workflow-store'

const edgeTypes: EdgeTypes = {
  valenceFlow: ValenceFlowEdge,
  default: ValenceFlowEdge,
}

const defaultEdgeOptions = {
  type: 'valenceFlow',
  animated: false,
}

export function WorkflowCanvas() {
  const nodes = useWorkflowStore((state) => state.nodes)
  const rawEdges = useWorkflowStore((state) => state.edges)
  const workspaceType = useWorkflowStore((state) => state.workspaceType)
  const edges = useMemo(
    () =>
      rawEdges.map((edge) =>
        edge.type === 'valenceFlow'
          ? edge
          : { ...edge, type: 'valenceFlow' as const },
      ),
    [rawEdges],
  )
  const viewport = useWorkflowStore((state) => state.viewport)
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange)
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange)
  const onConnect = useWorkflowStore((state) => state.onConnect)
  const setViewport = useWorkflowStore((state) => state.setViewport)
  const onNodesDelete = useWorkflowStore((state) => state.onNodesDelete)
  const dumpServerIntoStack = useWorkflowStore((state) => state.dumpServerIntoStack)
  const dumpSkillIntoStack = useWorkflowStore((state) => state.dumpSkillIntoStack)
  const dumpInterfaceIntoStack = useWorkflowStore(
    (state) => state.dumpInterfaceIntoStack,
  )

  const isValidConnection: IsValidConnection = useCallback(
    (connection) =>
      isValidWorkflowConnection(connection, nodes, edges, workspaceType),
    [nodes, edges, workspaceType],
  )

  const handleMoveEnd: OnMove = useCallback(
    (_event, nextViewport) => {
      setViewport(nextViewport)
    },
    [setViewport],
  )

  const handleNodeDragStop: OnNodeDrag<ValenceNode> = useCallback(
    (_event, node) => {
      if ('stackId' in node.data && node.data.stackId) return

      if (node.type === 'toolServer') {
        const stackId = getStackIdAtPoint(
          {
            x: node.position.x + 66,
            y: node.position.y + 56,
          },
          nodes,
          'serverStack',
        )
        if (stackId) dumpServerIntoStack(node.id, stackId)
        return
      }

      if (node.type === 'agentSkill') {
        const stackId = getStackIdAtPoint(
          {
            x: node.position.x + 66,
            y: node.position.y + 56,
          },
          nodes,
          'skillStack',
        )
        if (stackId) dumpSkillIntoStack(node.id, stackId)
        return
      }

      if (node.type === 'agentInterface') {
        const stackId = getStackIdAtPoint(
          {
            x: node.position.x + 66,
            y: node.position.y + 56,
          },
          nodes,
          'interfaceStack',
        )
        if (stackId) dumpInterfaceIntoStack(node.id, stackId)
      }
    },
    [dumpInterfaceIntoStack, dumpServerIntoStack, dumpSkillIntoStack, nodes],
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
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={ValenceFlowConnectionLine}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--workspace-dot)"
        />
        <Controls
          showInteractive={false}
          position="bottom-right"
          className="!bottom-[168px] !right-3 !m-0 overflow-hidden !rounded-xl !border !border-panel-border !bg-panel/95 !shadow-lg !backdrop-blur-sm"
        />
        <MiniMap
          pannable
          zoomable
          className="!bottom-3 !right-3 !m-0 !rounded-xl !border !border-panel-border !bg-node/90 !shadow-lg"
        />
        {workspaceType === 'agent-executor' ? <CanvasStructureBar /> : null}
      </ReactFlow>
    </div>
  )
}
