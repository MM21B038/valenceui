import type { Edge } from '@xyflow/react'

import { apiClient } from '@/lib/api/client'
import {
  createAgentInterfaceStack,
  createAgentSkillStack,
  createDndComponent,
  createDndConnection,
  createServerStack,
  deleteDndComponent,
  deleteDndConnection,
  getAgentInterfaceStack,
  getAgentSkillStack,
  getServerStack,
} from '@/lib/api/dnd-workspace'
import type { AgentCard } from '@/lib/types/agent-card'
import type { AgentExecutor } from '@/lib/types/agent-executor'
import type { AgentInterface } from '@/lib/types/agent-interface'
import {
  formatAgentInterfaceEndpoint,
  formatProtocolBindingLabel,
} from '@/lib/types/agent-interface'
import type { AgentSkill } from '@/lib/types/agent-skill'
import type {
  DndComponent,
  DndComponentType,
  WorkspaceDetail,
  WorkspaceType,
} from '@/lib/types/dnd-workspace'
import type { LlmConfig } from '@/lib/types/llm-config'
import type { McpServerConfig } from '@/lib/types/mcp-server-config'
import type { ThreadConfig } from '@/lib/types/thread-config'
import type { ValenceNode, ValenceNodeType } from '@/lib/types/workflow'
import { resolveEdgeHandles } from '@/lib/canvas/connection-rules'

const FRONTEND_TO_DND: Record<ValenceNodeType, DndComponentType> = {
  llm: 'llm-config',
  toolServer: 'mcp-server',
  threadConfig: 'thread-config',
  agentSkill: 'agent-skill',
  agentInterface: 'agent-interface',
  agentCard: 'agent-card',
  agentExecutor: 'agent-executor',
  serverStack: 'server-stack',
  skillStack: 'agent-skill-stack',
  interfaceStack: 'agent-interface-stack',
}

const DND_TO_FRONTEND: Record<DndComponentType, ValenceNodeType> = {
  'llm-config': 'llm',
  'mcp-server': 'toolServer',
  'thread-config': 'threadConfig',
  'agent-skill': 'agentSkill',
  'agent-interface': 'agentInterface',
  'agent-card': 'agentCard',
  'agent-executor': 'agentExecutor',
  'server-stack': 'serverStack',
  'agent-skill-stack': 'skillStack',
  'agent-interface-stack': 'interfaceStack',
}

export function toDndComponentType(type: ValenceNodeType): DndComponentType {
  return FRONTEND_TO_DND[type]
}

export function toValenceNodeType(type: DndComponentType): ValenceNodeType {
  return DND_TO_FRONTEND[type]
}

function configIdFromNode(node: ValenceNode): string | null {
  if ('configId' in node.data && typeof node.data.configId === 'string') {
    return node.data.configId
  }
  return null
}

function paintColor(_node: ValenceNode): string {
  return '#47B9B9'
}

/** Persist current canvas graph into an existing workspace (replace graph). */
export async function persistWorkspaceGraph(options: {
  workspaceUuid: string
  workspaceType: WorkspaceType
  name: string
  nodes: ValenceNode[]
  edges: Edge[]
  previous?: WorkspaceDetail | null
}) {
  const { workspaceUuid, name, nodes, edges, previous } = options

  // Drop previous graph entities (components cascade not automatic via M2M)
  if (previous) {
    await Promise.all(
      previous.connections.map((connection) =>
        deleteDndConnection(connection.uuid).catch(() => undefined),
      ),
    )
    await Promise.all(
      previous.components.map((component) =>
        deleteDndComponent(component.uuid).catch(() => undefined),
      ),
    )
  }

  const visibleNodes = nodes.filter((node) => {
    if ('stackId' in node.data && node.data.stackId) return false
    return true
  })

  const nodeIdToComponentId = new Map<string, string>()

  for (const node of visibleNodes) {
    let entityUuid = configIdFromNode(node)

    if (node.type === 'serverStack') {
      const memberIds = node.data.memberIds ?? []
      const serverUuids = memberIds
        .map((id) => nodes.find((item) => item.id === id))
        .filter((item) => item?.type === 'toolServer')
        .map((item) =>
          item && 'configId' in item.data ? item.data.configId : undefined,
        )
        .filter((id): id is string => Boolean(id))
      const stack = await createServerStack(serverUuids)
      entityUuid = stack.uuid
    }

    if (node.type === 'skillStack') {
      const memberIds = node.data.memberIds ?? []
      const skillUuids = memberIds
        .map((id) => nodes.find((item) => item.id === id))
        .filter((item) => item?.type === 'agentSkill')
        .map((item) =>
          item && 'configId' in item.data ? item.data.configId : undefined,
        )
        .filter((id): id is string => Boolean(id))
      const stack = await createAgentSkillStack(skillUuids)
      entityUuid = stack.uuid
    }

    if (node.type === 'interfaceStack') {
      const memberIds = node.data.memberIds ?? []
      const interfaceUuids = memberIds
        .map((id) => nodes.find((item) => item.id === id))
        .filter((item) => item?.type === 'agentInterface')
        .map((item) =>
          item && 'configId' in item.data ? item.data.configId : undefined,
        )
        .filter((id): id is string => Boolean(id))
      const stack = await createAgentInterfaceStack(interfaceUuids)
      entityUuid = stack.uuid
    }

    const created = await createDndComponent({
      type: toDndComponentType(node.type as ValenceNodeType),
      position_x: node.position.x,
      position_y: node.position.y,
      color_code: paintColor(node),
      component_uuid: entityUuid,
    })
    nodeIdToComponentId.set(node.id, created.uuid)
  }

  const connectionIds: string[] = []
  for (const edge of edges) {
    const source = nodeIdToComponentId.get(edge.source)
    const target = nodeIdToComponentId.get(edge.target)
    if (!source || !target) continue
    const connection = await createDndConnection({ source, target })
    connectionIds.push(connection.uuid)
  }

  const { data } = await apiClient.patch<WorkspaceDetail>(
    `/workspace/${workspaceUuid}/`,
    {
      name,
      components: [...nodeIdToComponentId.values()],
      connections: connectionIds,
    },
  )

  return data
}

function labelForType(type: ValenceNodeType): string {
  switch (type) {
    case 'llm':
      return 'LLM'
    case 'toolServer':
      return 'Tool Server'
    case 'threadConfig':
      return 'Thread Config'
    case 'agentSkill':
      return 'Agent Skill'
    case 'agentInterface':
      return 'Agent Interface'
    case 'agentCard':
      return 'Agent Card'
    case 'agentExecutor':
      return 'Agent Executor'
    case 'serverStack':
      return 'Server Stack'
    case 'skillStack':
      return 'Skill Stack'
    case 'interfaceStack':
      return 'Interface Stack'
  }
}

function memberNodeId() {
  return `node_${crypto.randomUUID()}`
}

async function fetchEntity<T>(path: string): Promise<T | null> {
  try {
    const { data } = await apiClient.get<T>(path)
    return data
  } catch {
    return null
  }
}

/** Shallow map of workspace placement → React Flow graph (no config fetches). */
export function workspaceDetailToGraph(detail: WorkspaceDetail): {
  nodes: ValenceNode[]
  edges: Edge[]
} {
  const nodes: ValenceNode[] = detail.components.map((component) => {
    const type = toValenceNodeType(component.type)
    const base = {
      id: component.uuid,
      type,
      position: { x: component.position_x, y: component.position_y },
      deletable: true,
    }

    const configId = component.component_uuid ?? undefined

    if (type === 'serverStack' || type === 'skillStack' || type === 'interfaceStack') {
      return {
        ...base,
        type,
        data: {
          label: labelForType(type),
          memberIds: [] as string[],
          stackEntityId: configId,
        },
      } as ValenceNode
    }

    if (type === 'llm') {
      return {
        ...base,
        type: 'llm',
        data: { label: labelForType(type), configId, model: undefined },
      }
    }

    if (type === 'toolServer') {
      return {
        ...base,
        type: 'toolServer',
        data: { label: labelForType(type), configId, name: undefined },
      }
    }

    if (type === 'threadConfig') {
      return {
        ...base,
        type: 'threadConfig',
        data: { label: labelForType(type), configId, name: undefined },
      }
    }

    if (type === 'agentSkill') {
      return {
        ...base,
        type: 'agentSkill',
        data: { label: labelForType(type), configId, name: undefined },
      }
    }

    if (type === 'agentInterface') {
      return {
        ...base,
        type: 'agentInterface',
        data: { label: labelForType(type), configId },
      }
    }

    if (type === 'agentCard') {
      return {
        ...base,
        type: 'agentCard',
        data: { label: labelForType(type), configId, name: undefined },
      }
    }

    return {
      ...base,
      type: 'agentExecutor',
      data: {
        label: labelForType(type),
        configId,
        name: undefined,
      },
    }
  })

  const edges: Edge[] = detail.connections.map((connection) => {
    const sourceType = toValenceNodeType(connection.source.type)
    const targetType = toValenceNodeType(connection.target.type)
    const { sourceHandle, targetHandle } = resolveEdgeHandles({
      sourceType,
      targetType,
      sourcePosition: {
        x: connection.source.position_x,
        y: connection.source.position_y,
      },
      targetPosition: {
        x: connection.target.position_x,
        y: connection.target.position_y,
      },
    })

    return {
      id: connection.uuid,
      source: connection.source.uuid,
      target: connection.target.uuid,
      sourceHandle,
      targetHandle,
      type: 'valenceFlow',
      animated: false,
    }
  })

  return { nodes, edges }
}

async function hydrateRegularNode(node: ValenceNode): Promise<ValenceNode> {
  const configId =
    'configId' in node.data && typeof node.data.configId === 'string'
      ? node.data.configId
      : undefined
  if (!configId) return node

  if (node.type === 'llm') {
    const config = await fetchEntity<LlmConfig>(`/llm-config/${configId}/`)
    if (!config) return node
    return {
      ...node,
      data: {
        ...node.data,
        provider: config.provider,
        model: config.model,
        baseUrl: config.base_url,
        label: config.model,
      },
    }
  }

  if (node.type === 'toolServer') {
    const config = await fetchEntity<McpServerConfig>(
      `/mcp-server-config/${configId}/`,
    )
    if (!config) return node
    return {
      ...node,
      data: {
        ...node.data,
        name: config.name,
        transport: config.transport,
        label: config.name,
      },
    }
  }

  if (node.type === 'threadConfig') {
    const config = await fetchEntity<ThreadConfig>(`/thread-config/${configId}`)
    if (!config) return node
    return {
      ...node,
      data: {
        ...node.data,
        name: config.name,
        label: config.name,
      },
    }
  }

  if (node.type === 'agentSkill') {
    const config = await fetchEntity<AgentSkill>(`/agent-skill/${configId}/`)
    if (!config) return node
    return {
      ...node,
      data: {
        ...node.data,
        name: config.name,
        label: config.name,
      },
    }
  }

  if (node.type === 'agentInterface') {
    const config = await fetchEntity<AgentInterface>(
      `/agent-interface/${configId}/`,
    )
    if (!config) return node
    const endpoint = formatAgentInterfaceEndpoint(config.host, config.port)
    return {
      ...node,
      data: {
        ...node.data,
        host: config.host,
        port: config.port,
        protocol_binding: config.protocol_binding,
        label:
          endpoint ?? formatProtocolBindingLabel(config.protocol_binding),
      },
    }
  }

  if (node.type === 'agentCard') {
    const config = await fetchEntity<AgentCard>(`/agent-card/${configId}/`)
    if (!config) return node
    return {
      ...node,
      data: {
        ...node.data,
        name: config.name,
        version: config.version,
        label: config.name,
      },
    }
  }

  if (node.type === 'agentExecutor') {
    const config = await fetchEntity<AgentExecutor>(
      `/agent-executor/${configId}/`,
    )
    if (!config) return node
    return {
      ...node,
      data: {
        ...node.data,
        name: config.name,
        host: config.host,
        port: config.port,
        label: config.name,
      },
    }
  }

  return node
}

async function hydrateServerStack(node: ValenceNode & { type: 'serverStack' }): Promise<{
  stack: ValenceNode
  members: ValenceNode[]
}> {
  const stackEntityId = node.data.stackEntityId
  if (!stackEntityId) return { stack: node, members: [] }

  try {
    const stackEntity = await getServerStack(stackEntityId)
    const members = await Promise.all(
      stackEntity.servers.map(async (serverUuid) => {
        const memberId = memberNodeId()
        const config = await fetchEntity<McpServerConfig>(
          `/mcp-server-config/${serverUuid}/`,
        )
        return {
          id: memberId,
          type: 'toolServer' as const,
          position: { x: node.position.x, y: node.position.y },
          hidden: true,
          deletable: true,
          data: {
            label: config?.name ?? 'Tool Server',
            configId: serverUuid,
            name: config?.name,
            transport: config?.transport,
            stackId: node.id,
          },
        } satisfies ValenceNode
      }),
    )

    return {
      stack: {
        ...node,
        data: {
          ...node.data,
          memberIds: members.map((member) => member.id),
          stackEntityId,
        },
      },
      members,
    }
  } catch {
    return { stack: node, members: [] }
  }
}

async function hydrateSkillStack(node: ValenceNode & { type: 'skillStack' }): Promise<{
  stack: ValenceNode
  members: ValenceNode[]
}> {
  const stackEntityId = node.data.stackEntityId
  if (!stackEntityId) return { stack: node, members: [] }

  try {
    const stackEntity = await getAgentSkillStack(stackEntityId)
    const members = await Promise.all(
      stackEntity.agent_skills.map(async (skillUuid) => {
        const memberId = memberNodeId()
        const config = await fetchEntity<AgentSkill>(
          `/agent-skill/${skillUuid}/`,
        )
        return {
          id: memberId,
          type: 'agentSkill' as const,
          position: { x: node.position.x, y: node.position.y },
          hidden: true,
          deletable: true,
          data: {
            label: config?.name ?? 'Agent Skill',
            configId: skillUuid,
            name: config?.name,
            stackId: node.id,
          },
        } satisfies ValenceNode
      }),
    )

    return {
      stack: {
        ...node,
        data: {
          ...node.data,
          memberIds: members.map((member) => member.id),
          stackEntityId,
        },
      },
      members,
    }
  } catch {
    return { stack: node, members: [] }
  }
}

async function hydrateInterfaceStack(
  node: ValenceNode & { type: 'interfaceStack' },
): Promise<{
  stack: ValenceNode
  members: ValenceNode[]
}> {
  const stackEntityId = node.data.stackEntityId
  if (!stackEntityId) return { stack: node, members: [] }

  try {
    const stackEntity = await getAgentInterfaceStack(stackEntityId)
    const members = await Promise.all(
      stackEntity.agent_interfaces.map(async (interfaceUuid) => {
        const memberId = memberNodeId()
        const config = await fetchEntity<AgentInterface>(
          `/agent-interface/${interfaceUuid}/`,
        )
        const endpoint = formatAgentInterfaceEndpoint(
          config?.host,
          config?.port,
        )
        return {
          id: memberId,
          type: 'agentInterface' as const,
          position: { x: node.position.x, y: node.position.y },
          hidden: true,
          deletable: true,
          data: {
            label:
              endpoint ??
              (config
                ? formatProtocolBindingLabel(config.protocol_binding)
                : 'Agent Interface'),
            configId: interfaceUuid,
            host: config?.host,
            port: config?.port,
            protocol_binding: config?.protocol_binding,
            stackId: node.id,
          },
        } satisfies ValenceNode
      }),
    )

    return {
      stack: {
        ...node,
        data: {
          ...node.data,
          memberIds: members.map((member) => member.id),
          stackEntityId,
        },
      },
      members,
    }
  } catch {
    return { stack: node, members: [] }
  }
}

/**
 * Resolve each DnD component's `component_uuid` into integrated config fields
 * (and expand stack members into hidden canvas nodes).
 */
export async function hydrateWorkspaceGraph(detail: WorkspaceDetail): Promise<{
  nodes: ValenceNode[]
  edges: Edge[]
}> {
  const { nodes: baseNodes, edges } = workspaceDetailToGraph(detail)

  const results = await Promise.all(
    baseNodes.map(async (node) => {
      if (node.type === 'serverStack') {
        return hydrateServerStack(node)
      }
      if (node.type === 'skillStack') {
        return hydrateSkillStack(node)
      }
      if (node.type === 'interfaceStack') {
        return hydrateInterfaceStack(node)
      }
      return {
        stack: await hydrateRegularNode(node),
        members: [] as ValenceNode[],
      }
    }),
  )

  const nodes: ValenceNode[] = []
  for (const result of results) {
    nodes.push(result.stack)
  }
  for (const result of results) {
    nodes.push(...result.members)
  }

  return { nodes, edges }
}

export function componentSummary(component: DndComponent) {
  return {
    id: component.uuid,
    type: toValenceNodeType(component.type),
    configId: component.component_uuid,
  }
}
