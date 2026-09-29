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
} from '@/lib/api/dnd-workspace'
import type {
  DndComponent,
  DndComponentType,
  WorkspaceDetail,
  WorkspaceType,
} from '@/lib/types/dnd-workspace'
import type { ValenceNode, ValenceNodeType } from '@/lib/types/workflow'

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

function paintColor(node: ValenceNode): string {
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

/** Hydrate React Flow nodes/edges from a workspace detail payload. */
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

  const edges: Edge[] = detail.connections.map((connection) => ({
    id: connection.uuid,
    source: connection.source.uuid,
    target: connection.target.uuid,
    type: 'valenceFlow',
    animated: false,
  }))

  return { nodes, edges }
}

export function componentSummary(component: DndComponent) {
  return {
    id: component.uuid,
    type: toValenceNodeType(component.type),
    configId: component.component_uuid,
  }
}
