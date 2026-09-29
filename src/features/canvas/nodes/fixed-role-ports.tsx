import { Position } from '@xyflow/react'
import type { LucideIcon } from 'lucide-react'

import { NodePort } from '@/features/canvas/nodes/node-port'
import {
  getConnectedPortIds,
  type FixedPortDef,
  type PortHandleId,
} from '@/lib/canvas/connection-rules'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

const HANDLE_OFFSET: Partial<Record<Position, string>> = {
  [Position.Left]: '!-translate-x-[16px]',
  [Position.Right]: '!translate-x-[16px]',
  [Position.Top]: '!-translate-y-[16px]',
  [Position.Bottom]: '!translate-y-[16px]',
}

interface FixedRolePortsProps {
  nodeId: string
  ports: readonly FixedPortDef[]
}

/** Labeled fixed ports — each slot accepts at most one edge. */
export function FixedRolePorts({ nodeId, ports }: FixedRolePortsProps) {
  const edges = useWorkflowStore((state) => state.edges)
  const connectedPorts = new Set(getConnectedPortIds(edges, nodeId))

  return (
    <>
      {ports.map((port) => {
        const isActive = connectedPorts.has(port.id as PortHandleId)
        const isConnectable = !isActive
        const offset = HANDLE_OFFSET[port.position]

        return (
          <div key={port.id} className="pointer-events-none absolute inset-0">
            <NodePort
              id={port.id}
              handleType="target"
              position={port.position}
              isActive={isActive}
              isConnectable={isConnectable}
              showVisual
              className={cn('!z-30 pointer-events-auto', offset)}
            />
            <NodePort
              id={port.id}
              handleType="source"
              position={port.position}
              isActive={isActive}
              isConnectable={isConnectable}
              showVisual={false}
              className={cn('!z-40 pointer-events-auto', offset)}
            />
          </div>
        )
      })}
    </>
  )
}

export function RoleBadge({
  label,
  active,
  title,
  children,
}: {
  label: string
  active: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <div
      title={title ?? label}
      aria-label={title ?? label}
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-lg border transition-colors',
        active
          ? 'border-connector bg-connector/20 text-connector'
          : 'border-panel-border/70 bg-panel-inspector/35 text-panel-muted',
      )}
    >
      {children}
    </div>
  )
}

export function RoleBadgeColumn({
  items,
}: {
  items: Array<{
    label: string
    active: boolean
    Icon: LucideIcon
  }>
}) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <RoleBadge key={item.label} label={item.label} active={item.active}>
          <item.Icon className="size-3.5" strokeWidth={2.25} />
        </RoleBadge>
      ))}
    </div>
  )
}

export function useFixedPortState(nodeId: string, portIds: readonly string[]) {
  const edges = useWorkflowStore((state) => state.edges)
  const connected = new Set(getConnectedPortIds(edges, nodeId))
  return Object.fromEntries(
    portIds.map((id) => [id, connected.has(id as PortHandleId)]),
  ) as Record<string, boolean>
}
