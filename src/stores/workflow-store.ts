import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type Viewport,
} from '@xyflow/react'
import { create } from 'zustand'

import { isValidWorkflowConnection } from '@/lib/canvas/connection-rules'
import { offsetPosition } from '@/lib/canvas/duplicate-node'
import {
  STACK_EJECT_OFFSET_X,
  STACK_EJECT_OFFSET_Y,
} from '@/lib/canvas/stack-dump'
import type { LlmNodeData } from '@/lib/types/llm-config'
import type { ToolServerNodeData } from '@/lib/types/mcp-server-config'
import type { ValenceNode, WorkflowGraph } from '@/lib/types/workflow'

interface WorkflowState {
  workflowId: string
  workflowName: string
  nodes: ValenceNode[]
  edges: Edge[]
  viewport: Viewport
  llmModalNodeId: string | null
  toolServerModalNodeId: string | null
  expandedStackId: string | null
  setWorkflowMeta: (id: string, name: string) => void
  setViewport: (viewport: Viewport) => void
  onNodesChange: (changes: NodeChange<ValenceNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addLlmNode: (position: { x: number; y: number }) => void
  addToolServerNode: (position: { x: number; y: number }) => void
  addServerStack: (position: { x: number; y: number }) => void
  addToolServerToStack: (stackId: string) => string | null
  dumpServerIntoStack: (toolServerId: string, stackId: string) => void
  ejectServerFromStack: (toolServerId: string) => void
  openExpandedStack: (stackId: string) => void
  closeExpandedStack: () => void
  updateLlmNode: (nodeId: string, data: Partial<LlmNodeData>) => void
  updateToolServerNode: (nodeId: string, data: Partial<ToolServerNodeData>) => void
  openLlmModal: (nodeId: string) => void
  closeLlmModal: () => void
  openToolServerModal: (nodeId: string) => void
  closeToolServerModal: () => void
  duplicateNode: (nodeId: string) => string | null
  duplicateStackMember: (toolServerId: string) => string | null
  removeNode: (nodeId: string) => void
  onNodesDelete: (nodeIds: string[]) => void
  toWorkflowGraph: () => WorkflowGraph
}

const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 }

function createNodeId() {
  return `node_${crypto.randomUUID()}`
}

function cloneToolServerData(
  data: ToolServerNodeData,
  stackId: string,
): ToolServerNodeData {
  const { stackId: _removed, ...rest } = data
  return { ...rest, stackId }
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflowId: 'local-draft',
  workflowName: 'Untitled Workflow',
  nodes: [],
  edges: [],
  viewport: defaultViewport,
  llmModalNodeId: null,
  toolServerModalNodeId: null,
  expandedStackId: null,

  setWorkflowMeta: (id, name) => set({ workflowId: id, workflowName: name }),

  setViewport: (viewport) => set({ viewport }),

  onNodesChange: (changes) => {
    const removedIds = changes
      .filter((change) => change.type === 'remove')
      .map((change) => change.id)

    const nodes = applyNodeChanges(changes, get().nodes)
    const state = get()

    if (removedIds.length === 0) {
      set({ nodes })
      return
    }

    const removedSet = new Set(removedIds)
    set({
      nodes,
      edges: state.edges.filter(
        (edge) => !removedSet.has(edge.source) && !removedSet.has(edge.target),
      ),
      llmModalNodeId: removedSet.has(state.llmModalNodeId ?? '')
        ? null
        : state.llmModalNodeId,
      toolServerModalNodeId: removedSet.has(state.toolServerModalNodeId ?? '')
        ? null
        : state.toolServerModalNodeId,
    })
  },

  onEdgesChange: (changes) =>
    set({
      edges: applyEdgeChanges(changes, get().edges),
    }),

  onConnect: (connection: Connection) => {
    const state = get()
    if (!isValidWorkflowConnection(connection, state.nodes, state.edges)) return

    set({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: { strokeWidth: 2, stroke: 'var(--connector)' },
        },
        state.edges,
      ),
    })
  },

  addLlmNode: (position) =>
    set({
      nodes: [
        ...get().nodes,
        {
          id: createNodeId(),
          type: 'llm',
          position,
          deletable: true,
          data: { label: 'LLM' },
        },
      ],
    }),

  addToolServerNode: (position) =>
    set({
      nodes: [
        ...get().nodes,
        {
          id: createNodeId(),
          type: 'toolServer',
          position,
          deletable: true,
          data: { label: 'Tool Server' },
        },
      ],
    }),

  addServerStack: (position) =>
    set({
      nodes: [
        ...get().nodes,
        {
          id: createNodeId(),
          type: 'serverStack',
          position,
          deletable: true,
          data: { label: 'Server Stack', memberIds: [] },
        },
      ],
    }),

  addToolServerToStack: (stackId) => {
    const state = get()
    const stack = state.nodes.find(
      (node) => node.id === stackId && node.type === 'serverStack',
    )
    if (!stack) return null

    const toolServerId = createNodeId()
    const stackPosition = stack.position

    set({
      nodes: [
        ...state.nodes.map((node) =>
          node.id === stackId && node.type === 'serverStack'
            ? {
                ...node,
                data: {
                  ...node.data,
                  memberIds: [...node.data.memberIds, toolServerId],
                },
              }
            : node,
        ),
        {
          id: toolServerId,
          type: 'toolServer',
          position: { x: stackPosition.x, y: stackPosition.y },
          hidden: true,
          deletable: true,
          data: { label: 'Tool Server', stackId },
        },
      ],
    })

    return toolServerId
  },

  dumpServerIntoStack: (toolServerId, stackId) => {
    const state = get()
    const toolServer = state.nodes.find(
      (node) => node.id === toolServerId && node.type === 'toolServer',
    )
    const stack = state.nodes.find(
      (node): node is ValenceNode & { type: 'serverStack' } =>
        node.id === stackId && node.type === 'serverStack',
    )

    if (!toolServer || !stack || toolServer.data.stackId) return
    if (stack.data.memberIds.includes(toolServerId)) return

    set({
      nodes: state.nodes.map((node) => {
        if (node.id === stackId && node.type === 'serverStack') {
          return {
            ...node,
            data: {
              ...node.data,
              memberIds: [...node.data.memberIds, toolServerId],
            },
          }
        }

        if (node.id === toolServerId && node.type === 'toolServer') {
          return {
            ...node,
            hidden: true,
            data: { ...node.data, stackId },
          }
        }

        return node
      }),
      edges: state.edges.filter(
        (edge) => edge.source !== toolServerId && edge.target !== toolServerId,
      ),
    })
  },

  ejectServerFromStack: (toolServerId) => {
    const state = get()
    const toolServer = state.nodes.find(
      (node) => node.id === toolServerId && node.type === 'toolServer',
    )
    if (!toolServer?.data.stackId) return

    const stackId = toolServer.data.stackId
    const stack = state.nodes.find((node) => node.id === stackId)
    const stackPosition = stack?.position ?? { x: 0, y: 0 }
    const ejectedCount = stack?.type === 'serverStack'
      ? stack.data.memberIds.length
      : 0

    set({
      nodes: state.nodes.map((node) => {
        if (node.id === stackId && node.type === 'serverStack') {
          return {
            ...node,
            data: {
              ...node.data,
              memberIds: node.data.memberIds.filter((id) => id !== toolServerId),
            },
          }
        }

        if (node.id === toolServerId && node.type === 'toolServer') {
          const { stackId: _removed, ...rest } = node.data
          return {
            ...node,
            hidden: false,
            position: {
              x: stackPosition.x + STACK_EJECT_OFFSET_X,
              y: stackPosition.y + ejectedCount * STACK_EJECT_OFFSET_Y,
            },
            data: rest,
          }
        }

        return node
      }),
    })
  },

  openExpandedStack: (stackId) =>
    set({ expandedStackId: stackId, llmModalNodeId: null, toolServerModalNodeId: null }),

  closeExpandedStack: () =>
    set({ expandedStackId: null, toolServerModalNodeId: null }),

  updateLlmNode: (nodeId, data) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.type === 'llm'
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
    }),

  updateToolServerNode: (nodeId, data) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.type === 'toolServer'
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
    }),

  openLlmModal: (nodeId) =>
    set({ llmModalNodeId: nodeId, toolServerModalNodeId: null }),

  closeLlmModal: () => set({ llmModalNodeId: null }),

  openToolServerModal: (nodeId) =>
    set({ toolServerModalNodeId: nodeId, llmModalNodeId: null }),

  closeToolServerModal: () => set({ toolServerModalNodeId: null }),

  duplicateNode: (nodeId) => {
    const state = get()
    const node = state.nodes.find((item) => item.id === nodeId)
    if (!node || node.hidden) return null

    const deselectNodes = state.nodes.map((item) => ({ ...item, selected: false }))
    const position = offsetPosition(node.position)

    if (node.type === 'llm') {
      const newId = createNodeId()
      set({
        nodes: [
          ...deselectNodes,
          {
            ...node,
            id: newId,
            position,
            selected: true,
            data: { ...node.data },
          },
        ],
      })
      return newId
    }

    if (node.type === 'toolServer' && !node.data.stackId) {
      const newId = createNodeId()
      set({
        nodes: [
          ...deselectNodes,
          {
            ...node,
            id: newId,
            position,
            selected: true,
            data: { ...node.data },
          },
        ],
      })
      return newId
    }

    if (node.type === 'serverStack') {
      const newStackId = createNodeId()
      const newMemberIds: string[] = []
      const memberNodes: ValenceNode[] = []

      for (const memberId of node.data.memberIds) {
        const member = state.nodes.find(
          (item) => item.id === memberId && item.type === 'toolServer',
        )
        if (!member) continue

        const newMemberId = createNodeId()
        newMemberIds.push(newMemberId)
        memberNodes.push({
          id: newMemberId,
          type: 'toolServer',
          position: node.position,
          hidden: true,
          deletable: true,
          data: cloneToolServerData(member.data, newStackId),
        })
      }

      set({
        nodes: [
          ...deselectNodes,
          {
            ...node,
            id: newStackId,
            position,
            selected: true,
            data: {
              ...node.data,
              memberIds: newMemberIds,
            },
          },
          ...memberNodes,
        ],
      })
      return newStackId
    }

    return null
  },

  duplicateStackMember: (toolServerId) => {
    const state = get()
    const toolServer = state.nodes.find(
      (item): item is ValenceNode & { type: 'toolServer' } =>
        item.id === toolServerId && item.type === 'toolServer',
    )
    if (!toolServer?.data.stackId) return null

    const stackId = toolServer.data.stackId

    const newId = createNodeId()

    set({
      nodes: [
        ...state.nodes.map((item) => {
          if (item.id === stackId && item.type === 'serverStack') {
            return {
              ...item,
              data: {
                ...item.data,
                memberIds: [...item.data.memberIds, newId],
              },
            }
          }
          return item
        }),
        {
          id: newId,
          type: 'toolServer',
          position: toolServer.position,
          hidden: true,
          deletable: true,
          data: cloneToolServerData(toolServer.data, stackId),
        },
      ],
    })

    return newId
  },

  removeNode: (nodeId) => {
    const state = get()
    const removedNode = state.nodes.find((node) => node.id === nodeId)
    const removedMemberIds =
      removedNode?.type === 'serverStack' ? removedNode.data.memberIds : []
    const removedMemberSet = new Set(removedMemberIds)

    let nodes = state.nodes.filter(
      (node) => node.id !== nodeId && !removedMemberSet.has(node.id),
    )

    if (removedNode?.type === 'toolServer' && removedNode.data.stackId) {
      nodes = nodes.map((node) =>
        node.id === removedNode.data.stackId && node.type === 'serverStack'
          ? {
              ...node,
              data: {
                ...node.data,
                memberIds: node.data.memberIds.filter((id) => id !== nodeId),
              },
            }
          : node,
      )
    }

    set({
      nodes,
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
      llmModalNodeId: state.llmModalNodeId === nodeId ? null : state.llmModalNodeId,
      toolServerModalNodeId:
        state.toolServerModalNodeId === nodeId ? null : state.toolServerModalNodeId,
      expandedStackId: state.expandedStackId === nodeId ? null : state.expandedStackId,
    })
  },

  onNodesDelete: (nodeIds) => {
    if (nodeIds.length === 0) return

    const removedSet = new Set(nodeIds)
    const state = get()

    set({
      edges: state.edges.filter(
        (edge) => !removedSet.has(edge.source) && !removedSet.has(edge.target),
      ),
      llmModalNodeId: removedSet.has(state.llmModalNodeId ?? '')
        ? null
        : state.llmModalNodeId,
      toolServerModalNodeId: removedSet.has(state.toolServerModalNodeId ?? '')
        ? null
        : state.toolServerModalNodeId,
    })
  },

  toWorkflowGraph: () => {
    const state = get()
    return {
      id: state.workflowId,
      name: state.workflowName,
      nodes: state.nodes,
      edges: state.edges,
      viewport: state.viewport,
    }
  },
}))
