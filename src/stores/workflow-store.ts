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

import {
  isValidWorkflowConnection,
  pruneConsumerServerEdgesForExecutorOwners,
} from '@/lib/canvas/connection-rules'
import { offsetPosition } from '@/lib/canvas/duplicate-node'
import {
  STACK_EJECT_OFFSET_X,
  STACK_EJECT_OFFSET_Y,
} from '@/lib/canvas/stack-dump'
import type { AgentCardNodeData } from '@/lib/types/agent-card'
import type { AgentExecutorNodeData } from '@/lib/types/agent-executor'
import type { AgentInterfaceNodeData } from '@/lib/types/agent-interface'
import type { AgentSkillNodeData } from '@/lib/types/agent-skill'
import type { WorkspaceType } from '@/lib/types/dnd-workspace'
import type { LlmNodeData } from '@/lib/types/llm-config'
import type { ToolServerNodeData } from '@/lib/types/mcp-server-config'
import type { ThreadConfigNodeData } from '@/lib/types/thread-config'
import type { ValenceNode, WorkflowGraph } from '@/lib/types/workflow'

type StackKind = 'serverStack' | 'skillStack' | 'interfaceStack'
type StackMemberType = 'toolServer' | 'agentSkill' | 'agentInterface'

interface WorkflowState {
  workflowId: string
  workflowName: string
  workspaceType: WorkspaceType
  nodes: ValenceNode[]
  edges: Edge[]
  viewport: Viewport
  llmModalNodeId: string | null
  toolServerModalNodeId: string | null
  threadConfigModalNodeId: string | null
  agentSkillModalNodeId: string | null
  agentInterfaceModalNodeId: string | null
  agentCardModalNodeId: string | null
  agentExecutorModalNodeId: string | null
  expandedStackId: string | null
  setWorkflowMeta: (id: string, name: string, type?: WorkspaceType) => void
  loadWorkspaceGraph: (options: {
    id: string
    name: string
    type: WorkspaceType
    nodes: ValenceNode[]
    edges: Edge[]
  }) => void
  resetWorkspace: (type: WorkspaceType, name?: string) => void
  setViewport: (viewport: Viewport) => void
  onNodesChange: (changes: NodeChange<ValenceNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addLlmNode: (position: { x: number; y: number }) => void
  addToolServerNode: (position: { x: number; y: number }) => void
  addThreadConfigNode: (position: { x: number; y: number }) => void
  addAgentSkillNode: (position: { x: number; y: number }) => void
  addAgentInterfaceNode: (position: { x: number; y: number }) => void
  addAgentCardNode: (position: { x: number; y: number }) => void
  addAgentExecutorNode: (position: { x: number; y: number }) => string
  addServerStack: (position: { x: number; y: number }) => void
  addSkillStack: (position: { x: number; y: number }) => void
  addInterfaceStack: (position: { x: number; y: number }) => void
  addToolServerToStack: (stackId: string) => string | null
  addAgentSkillToStack: (stackId: string) => string | null
  addAgentInterfaceToStack: (stackId: string) => string | null
  dumpServerIntoStack: (toolServerId: string, stackId: string) => void
  dumpSkillIntoStack: (skillId: string, stackId: string) => void
  dumpInterfaceIntoStack: (interfaceId: string, stackId: string) => void
  ejectServerFromStack: (toolServerId: string) => void
  ejectSkillFromStack: (skillId: string) => void
  ejectInterfaceFromStack: (interfaceId: string) => void
  openExpandedStack: (stackId: string) => void
  closeExpandedStack: () => void
  updateLlmNode: (nodeId: string, data: Partial<LlmNodeData>) => void
  updateToolServerNode: (nodeId: string, data: Partial<ToolServerNodeData>) => void
  updateThreadConfigNode: (
    nodeId: string,
    data: Partial<ThreadConfigNodeData>,
  ) => void
  updateAgentSkillNode: (
    nodeId: string,
    data: Partial<AgentSkillNodeData>,
  ) => void
  updateAgentInterfaceNode: (
    nodeId: string,
    data: Partial<AgentInterfaceNodeData>,
  ) => void
  updateAgentCardNode: (
    nodeId: string,
    data: Partial<AgentCardNodeData>,
  ) => void
  updateAgentExecutorNode: (
    nodeId: string,
    data: Partial<AgentExecutorNodeData>,
  ) => void
  openLlmModal: (nodeId: string) => void
  closeLlmModal: () => void
  openToolServerModal: (nodeId: string) => void
  closeToolServerModal: () => void
  openThreadConfigModal: (nodeId: string) => void
  closeThreadConfigModal: () => void
  openAgentSkillModal: (nodeId: string) => void
  closeAgentSkillModal: () => void
  openAgentInterfaceModal: (nodeId: string) => void
  closeAgentInterfaceModal: () => void
  openAgentCardModal: (nodeId: string) => void
  closeAgentCardModal: () => void
  openAgentExecutorModal: (nodeId: string) => void
  closeAgentExecutorModal: () => void
  duplicateNode: (nodeId: string) => string | null
  duplicateStackMember: (memberId: string) => string | null
  removeNode: (nodeId: string) => void
  onNodesDelete: (nodeIds: string[]) => void
  toWorkflowGraph: () => WorkflowGraph
}

const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 }

function createNodeId() {
  return `node_${crypto.randomUUID()}`
}

function clearModals() {
  return {
    llmModalNodeId: null as string | null,
    toolServerModalNodeId: null as string | null,
    threadConfigModalNodeId: null as string | null,
    agentSkillModalNodeId: null as string | null,
    agentInterfaceModalNodeId: null as string | null,
    agentCardModalNodeId: null as string | null,
    agentExecutorModalNodeId: null as string | null,
  }
}

function cloneMemberData<T extends { stackId?: string }>(
  data: T,
  stackId: string,
): T {
  const { stackId: _removed, ...rest } = data
  return { ...(rest as T), stackId }
}

function addMemberToStack(
  get: () => WorkflowState,
  set: (
    partial:
      | Partial<WorkflowState>
      | ((state: WorkflowState) => Partial<WorkflowState>),
  ) => void,
  stackId: string,
  stackKind: StackKind,
  memberType: StackMemberType,
  label: string,
) {
  const state = get()
  const stack = state.nodes.find(
    (node) => node.id === stackId && node.type === stackKind,
  )
  if (!stack) return null

  const memberId = createNodeId()
  const stackPosition = stack.position

  set({
    nodes: [
      ...state.nodes.map((node) =>
        node.id === stackId && node.type === stackKind
          ? {
              ...node,
              data: {
                ...node.data,
                memberIds: [...node.data.memberIds, memberId],
              },
            }
          : node,
      ),
      {
        id: memberId,
        type: memberType,
        position: { x: stackPosition.x, y: stackPosition.y },
        hidden: true,
        deletable: true,
        data: { label, stackId },
      } as ValenceNode,
    ],
  })

  return memberId
}

function dumpMemberIntoStack(
  get: () => WorkflowState,
  set: (
    partial:
      | Partial<WorkflowState>
      | ((state: WorkflowState) => Partial<WorkflowState>),
  ) => void,
  memberId: string,
  stackId: string,
  stackKind: StackKind,
  memberType: StackMemberType,
) {
  const state = get()
  const member = state.nodes.find(
    (node) => node.id === memberId && node.type === memberType,
  )
  const stack = state.nodes.find(
    (node) => node.id === stackId && node.type === stackKind,
  )

  if (!member || !stack) return
  if ('stackId' in member.data && member.data.stackId) return
  if (stack.data.memberIds.includes(memberId)) return

  set({
    nodes: state.nodes.map((node) => {
      if (node.id === stackId && node.type === stackKind) {
        return {
          ...node,
          data: {
            ...node.data,
            memberIds: [...node.data.memberIds, memberId],
          },
        }
      }

      if (node.id === memberId && node.type === memberType) {
        return {
          ...node,
          hidden: true,
          data: { ...node.data, stackId },
        }
      }

      return node
    }),
    edges: state.edges.filter(
      (edge) => edge.source !== memberId && edge.target !== memberId,
    ),
  })
}

function ejectMemberFromStack(
  get: () => WorkflowState,
  set: (
    partial:
      | Partial<WorkflowState>
      | ((state: WorkflowState) => Partial<WorkflowState>),
  ) => void,
  memberId: string,
  memberType: StackMemberType,
  stackKind: StackKind,
) {
  const state = get()
  const member = state.nodes.find(
    (node) => node.id === memberId && node.type === memberType,
  )
  if (!member || !('stackId' in member.data) || !member.data.stackId) return

  const stackId = member.data.stackId as string
  const stack = state.nodes.find((node) => node.id === stackId)
  const stackPosition = stack?.position ?? { x: 0, y: 0 }
  const ejectedCount =
    stack?.type === stackKind ? stack.data.memberIds.length : 0

  set({
    nodes: state.nodes.map((node) => {
      if (node.id === stackId && node.type === stackKind) {
        return {
          ...node,
          data: {
            ...node.data,
            memberIds: node.data.memberIds.filter((id) => id !== memberId),
          },
        }
      }

      if (node.id === memberId && node.type === memberType) {
        const { stackId: _removed, ...rest } = node.data as {
          stackId?: string
        } & Record<string, unknown>
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
}

function clearModalIfRemoved(
  current: string | null,
  removedSet: Set<string>,
) {
  return removedSet.has(current ?? '') ? null : current
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflowId: 'local-draft',
  workflowName: 'Untitled Workspace',
  workspaceType: 'agent-executor',
  nodes: [],
  edges: [],
  viewport: defaultViewport,
  ...clearModals(),
  expandedStackId: null,

  setWorkflowMeta: (id, name, type) =>
    set({
      workflowId: id,
      workflowName: name,
      ...(type ? { workspaceType: type } : {}),
    }),

  loadWorkspaceGraph: ({ id, name, type, nodes, edges }) =>
    set({
      workflowId: id,
      workflowName: name,
      workspaceType: type,
      nodes,
      edges,
      viewport: defaultViewport,
      ...clearModals(),
      expandedStackId: null,
    }),

  resetWorkspace: (type, name) =>
    set({
      workflowId: 'local-draft',
      workflowName:
        name ??
        (type === 'a2a' ? 'Untitled A2A Workspace' : 'Untitled Executor Workspace'),
      workspaceType: type,
      nodes: [],
      edges: [],
      viewport: defaultViewport,
      ...clearModals(),
      expandedStackId: null,
    }),

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
      llmModalNodeId: clearModalIfRemoved(state.llmModalNodeId, removedSet),
      toolServerModalNodeId: clearModalIfRemoved(
        state.toolServerModalNodeId,
        removedSet,
      ),
      threadConfigModalNodeId: clearModalIfRemoved(
        state.threadConfigModalNodeId,
        removedSet,
      ),
      agentSkillModalNodeId: clearModalIfRemoved(
        state.agentSkillModalNodeId,
        removedSet,
      ),
      agentInterfaceModalNodeId: clearModalIfRemoved(
        state.agentInterfaceModalNodeId,
        removedSet,
      ),
      agentCardModalNodeId: clearModalIfRemoved(
        state.agentCardModalNodeId,
        removedSet,
      ),
      agentExecutorModalNodeId: clearModalIfRemoved(
        state.agentExecutorModalNodeId,
        removedSet,
      ),
    })
  },

  onEdgesChange: (changes) =>
    set({
      edges: applyEdgeChanges(changes, get().edges),
    }),

  onConnect: (connection: Connection) => {
    const state = get()
    if (
      !isValidWorkflowConnection(
        connection,
        state.nodes,
        state.edges,
        state.workspaceType,
      )
    ) {
      return
    }

    const nextEdges =
      state.workspaceType === 'a2a'
        ? addEdge(
            {
              ...connection,
              sourceHandle: connection.sourceHandle ?? 'port-out',
              targetHandle: connection.targetHandle ?? 'port-in',
              type: 'valenceFlow',
              animated: false,
            },
            state.edges,
          )
        : pruneConsumerServerEdgesForExecutorOwners(
            addEdge(
              {
                ...connection,
                type: 'valenceFlow',
                animated: false,
              },
              state.edges,
            ),
            state.nodes,
          )

    set({ edges: nextEdges })
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

  addThreadConfigNode: (position) =>
    set({
      nodes: [
        ...get().nodes,
        {
          id: createNodeId(),
          type: 'threadConfig',
          position,
          deletable: true,
          data: { label: 'Thread Config' },
        },
      ],
    }),

  addAgentSkillNode: (position) =>
    set({
      nodes: [
        ...get().nodes,
        {
          id: createNodeId(),
          type: 'agentSkill',
          position,
          deletable: true,
          data: { label: 'Agent Skill' },
        },
      ],
    }),

  addAgentInterfaceNode: (position) =>
    set({
      nodes: [
        ...get().nodes,
        {
          id: createNodeId(),
          type: 'agentInterface',
          position,
          deletable: true,
          data: { label: 'Agent Interface' },
        },
      ],
    }),

  addAgentCardNode: (position) =>
    set({
      nodes: [
        ...get().nodes,
        {
          id: createNodeId(),
          type: 'agentCard',
          position,
          deletable: true,
          data: { label: 'Agent Card' },
        },
      ],
    }),

  addAgentExecutorNode: (position) => {
    const id = createNodeId()
    set({
      nodes: [
        ...get().nodes,
        {
          id,
          type: 'agentExecutor',
          position,
          deletable: true,
          data: { label: 'Agent Executor' },
        },
      ],
    })
    return id
  },

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

  addSkillStack: (position) =>
    set({
      nodes: [
        ...get().nodes,
        {
          id: createNodeId(),
          type: 'skillStack',
          position,
          deletable: true,
          data: { label: 'Skill Stack', memberIds: [] },
        },
      ],
    }),

  addInterfaceStack: (position) =>
    set({
      nodes: [
        ...get().nodes,
        {
          id: createNodeId(),
          type: 'interfaceStack',
          position,
          deletable: true,
          data: { label: 'Interface Stack', memberIds: [] },
        },
      ],
    }),

  addToolServerToStack: (stackId) =>
    addMemberToStack(get, set, stackId, 'serverStack', 'toolServer', 'Tool Server'),

  addAgentSkillToStack: (stackId) =>
    addMemberToStack(get, set, stackId, 'skillStack', 'agentSkill', 'Agent Skill'),

  addAgentInterfaceToStack: (stackId) =>
    addMemberToStack(
      get,
      set,
      stackId,
      'interfaceStack',
      'agentInterface',
      'Agent Interface',
    ),

  dumpServerIntoStack: (toolServerId, stackId) =>
    dumpMemberIntoStack(
      get,
      set,
      toolServerId,
      stackId,
      'serverStack',
      'toolServer',
    ),

  dumpSkillIntoStack: (skillId, stackId) =>
    dumpMemberIntoStack(get, set, skillId, stackId, 'skillStack', 'agentSkill'),

  dumpInterfaceIntoStack: (interfaceId, stackId) =>
    dumpMemberIntoStack(
      get,
      set,
      interfaceId,
      stackId,
      'interfaceStack',
      'agentInterface',
    ),

  ejectServerFromStack: (toolServerId) =>
    ejectMemberFromStack(get, set, toolServerId, 'toolServer', 'serverStack'),

  ejectSkillFromStack: (skillId) =>
    ejectMemberFromStack(get, set, skillId, 'agentSkill', 'skillStack'),

  ejectInterfaceFromStack: (interfaceId) =>
    ejectMemberFromStack(
      get,
      set,
      interfaceId,
      'agentInterface',
      'interfaceStack',
    ),

  openExpandedStack: (stackId) =>
    set({
      expandedStackId: stackId,
      ...clearModals(),
    }),

  closeExpandedStack: () =>
    set({
      expandedStackId: null,
      toolServerModalNodeId: null,
      agentSkillModalNodeId: null,
      agentInterfaceModalNodeId: null,
    }),

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

  updateThreadConfigNode: (nodeId, data) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.type === 'threadConfig'
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
    }),

  updateAgentSkillNode: (nodeId, data) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.type === 'agentSkill'
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
    }),

  updateAgentInterfaceNode: (nodeId, data) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.type === 'agentInterface'
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
    }),

  updateAgentCardNode: (nodeId, data) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.type === 'agentCard'
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
    }),

  updateAgentExecutorNode: (nodeId, data) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId && node.type === 'agentExecutor'
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
    }),

  openLlmModal: (nodeId) =>
    set({ ...clearModals(), llmModalNodeId: nodeId }),

  closeLlmModal: () => set({ llmModalNodeId: null }),

  openToolServerModal: (nodeId) =>
    set({ ...clearModals(), toolServerModalNodeId: nodeId }),

  closeToolServerModal: () => set({ toolServerModalNodeId: null }),

  openThreadConfigModal: (nodeId) =>
    set({ ...clearModals(), threadConfigModalNodeId: nodeId }),

  closeThreadConfigModal: () => set({ threadConfigModalNodeId: null }),

  openAgentSkillModal: (nodeId) =>
    set({ ...clearModals(), agentSkillModalNodeId: nodeId }),

  closeAgentSkillModal: () => set({ agentSkillModalNodeId: null }),

  openAgentInterfaceModal: (nodeId) =>
    set({ ...clearModals(), agentInterfaceModalNodeId: nodeId }),

  closeAgentInterfaceModal: () => set({ agentInterfaceModalNodeId: null }),

  openAgentCardModal: (nodeId) =>
    set({ ...clearModals(), agentCardModalNodeId: nodeId }),

  closeAgentCardModal: () => set({ agentCardModalNodeId: null }),

  openAgentExecutorModal: (nodeId) =>
    set({ ...clearModals(), agentExecutorModalNodeId: nodeId }),

  closeAgentExecutorModal: () => set({ agentExecutorModalNodeId: null }),

  duplicateNode: (nodeId) => {
    const state = get()
    const node = state.nodes.find((item) => item.id === nodeId)
    if (!node || node.hidden) return null

    const deselectNodes = state.nodes.map((item) => ({
      ...item,
      selected: false,
    }))
    const position = offsetPosition(node.position)

    const simpleTypes = [
      'llm',
      'toolServer',
      'threadConfig',
      'agentSkill',
      'agentInterface',
      'agentCard',
      'agentExecutor',
    ] as const

    if (
      simpleTypes.includes(node.type as (typeof simpleTypes)[number]) &&
      !(
        (node.type === 'toolServer' ||
          node.type === 'agentSkill' ||
          node.type === 'agentInterface') &&
        'stackId' in node.data &&
        node.data.stackId
      )
    ) {
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

    const stackKinds: StackKind[] = [
      'serverStack',
      'skillStack',
      'interfaceStack',
    ]
    if (stackKinds.includes(node.type as StackKind)) {
      const stackKind = node.type as StackKind
      const memberType: StackMemberType =
        stackKind === 'serverStack'
          ? 'toolServer'
          : stackKind === 'skillStack'
            ? 'agentSkill'
            : 'agentInterface'

      const newStackId = createNodeId()
      const newMemberIds: string[] = []
      const memberNodes: ValenceNode[] = []

      for (const memberId of node.data.memberIds) {
        const member = state.nodes.find(
          (item) => item.id === memberId && item.type === memberType,
        )
        if (!member) continue

        const newMemberId = createNodeId()
        newMemberIds.push(newMemberId)
        memberNodes.push({
          id: newMemberId,
          type: memberType,
          position: node.position,
          hidden: true,
          deletable: true,
          data: cloneMemberData(member.data, newStackId),
        } as ValenceNode)
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

  duplicateStackMember: (memberId) => {
    const state = get()
    const member = state.nodes.find((item) => item.id === memberId)
    if (!member) return null
    if (
      member.type !== 'toolServer' &&
      member.type !== 'agentSkill' &&
      member.type !== 'agentInterface'
    ) {
      return null
    }
    if (!member.data.stackId) return null

    const stackId = member.data.stackId
    const stack = state.nodes.find((item) => item.id === stackId)
    if (!stack) return null

    const newId = createNodeId()

    set({
      nodes: [
        ...state.nodes.map((item) => {
          if (
            item.id === stackId &&
            (item.type === 'serverStack' ||
              item.type === 'skillStack' ||
              item.type === 'interfaceStack')
          ) {
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
          type: member.type,
          position: member.position,
          hidden: true,
          deletable: true,
          data: cloneMemberData(member.data, stackId),
        } as ValenceNode,
      ],
    })

    return newId
  },

  removeNode: (nodeId) => {
    const state = get()
    const removedNode = state.nodes.find((node) => node.id === nodeId)
    const isStack =
      removedNode?.type === 'serverStack' ||
      removedNode?.type === 'skillStack' ||
      removedNode?.type === 'interfaceStack'
    const removedMemberIds = isStack ? removedNode.data.memberIds : []
    const removedMemberSet = new Set(removedMemberIds)

    let nodes = state.nodes.filter(
      (node) => node.id !== nodeId && !removedMemberSet.has(node.id),
    )

    if (
      removedNode &&
      (removedNode.type === 'toolServer' ||
        removedNode.type === 'agentSkill' ||
        removedNode.type === 'agentInterface') &&
      removedNode.data.stackId
    ) {
      const stackId = removedNode.data.stackId
      nodes = nodes.map((node) =>
        node.id === stackId &&
        (node.type === 'serverStack' ||
          node.type === 'skillStack' ||
          node.type === 'interfaceStack')
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
      llmModalNodeId:
        state.llmModalNodeId === nodeId ? null : state.llmModalNodeId,
      toolServerModalNodeId:
        state.toolServerModalNodeId === nodeId
          ? null
          : state.toolServerModalNodeId,
      threadConfigModalNodeId:
        state.threadConfigModalNodeId === nodeId
          ? null
          : state.threadConfigModalNodeId,
      agentSkillModalNodeId:
        state.agentSkillModalNodeId === nodeId
          ? null
          : state.agentSkillModalNodeId,
      agentInterfaceModalNodeId:
        state.agentInterfaceModalNodeId === nodeId
          ? null
          : state.agentInterfaceModalNodeId,
      agentCardModalNodeId:
        state.agentCardModalNodeId === nodeId
          ? null
          : state.agentCardModalNodeId,
      agentExecutorModalNodeId:
        state.agentExecutorModalNodeId === nodeId
          ? null
          : state.agentExecutorModalNodeId,
      expandedStackId:
        state.expandedStackId === nodeId ? null : state.expandedStackId,
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
      llmModalNodeId: clearModalIfRemoved(state.llmModalNodeId, removedSet),
      toolServerModalNodeId: clearModalIfRemoved(
        state.toolServerModalNodeId,
        removedSet,
      ),
      threadConfigModalNodeId: clearModalIfRemoved(
        state.threadConfigModalNodeId,
        removedSet,
      ),
      agentSkillModalNodeId: clearModalIfRemoved(
        state.agentSkillModalNodeId,
        removedSet,
      ),
      agentInterfaceModalNodeId: clearModalIfRemoved(
        state.agentInterfaceModalNodeId,
        removedSet,
      ),
      agentCardModalNodeId: clearModalIfRemoved(
        state.agentCardModalNodeId,
        removedSet,
      ),
      agentExecutorModalNodeId: clearModalIfRemoved(
        state.agentExecutorModalNodeId,
        removedSet,
      ),
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
