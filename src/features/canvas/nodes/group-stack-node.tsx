import { type NodeProps } from '@xyflow/react'
import { Layers, Network, Sparkles, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'

import { usePaintMode } from '@/components/theme/paint-mode-provider'
import { useTheme } from '@/components/theme/theme-provider'
import { NodeHoverActions } from '@/features/canvas/nodes/node-hover-actions'
import { NodePorts } from '@/features/canvas/nodes/node-ports'
import {
  getDumpedAgentInterfaces,
  getDumpedAgentSkills,
  getDumpedToolServers,
  STACK_PAGE_SIZE,
} from '@/lib/canvas/stack-dump'
import {
  padStackPageSlots,
  useStackPagination,
} from '@/lib/canvas/use-stack-pagination'
import type { ThemedComponentType } from '@/lib/theme/derive-component-tokens'
import {
  componentIconGradientStyle,
  componentVar,
} from '@/lib/theme/component-block-styles'
import type { ValenceNode } from '@/lib/types/workflow'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

type StackKind = 'serverStack' | 'skillStack' | 'interfaceStack'

function getMembers(kind: StackKind, id: string, nodes: ValenceNode[]) {
  if (kind === 'serverStack') return getDumpedToolServers(id, nodes)
  if (kind === 'skillStack') return getDumpedAgentSkills(id, nodes)
  return getDumpedAgentInterfaces(id, nodes)
}

function memberLabel(node: ValenceNode) {
  if (node.type === 'toolServer') {
    return node.data.name ?? 'Server'
  }
  if (node.type === 'agentSkill') {
    return node.data.name ?? 'Skill'
  }
  if (node.type === 'agentInterface') {
    const host = node.data.host
    const port = node.data.port
    if (host) return port != null ? `${host}:${port}` : String(host)
    return 'Interface'
  }
  return 'Item'
}

function StackMemberTile({
  node,
  themeType,
}: {
  node: ValenceNode
  themeType: ThemedComponentType
}) {
  return (
    <div
      className="flex min-h-[36px] flex-col items-center justify-center rounded-xl border px-1 py-1 text-center"
      style={{
        backgroundColor: componentVar(themeType, 'surface'),
        borderColor: componentVar(themeType, 'border-muted'),
        color: componentVar(themeType, 'foreground'),
      }}
    >
      <p className="w-full truncate text-[7px] font-semibold leading-tight">
        {memberLabel(node)}
      </p>
    </div>
  )
}

function GroupStackNodeView({
  id,
  selected,
  kind,
  themeType,
  title,
  emptyHint,
  Icon,
}: {
  id: string
  selected?: boolean
  kind: StackKind
  themeType: ThemedComponentType
  title: string
  emptyHint: string
  Icon: LucideIcon
}) {
  const nodes = useWorkflowStore((state) => state.nodes)
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const removeNode = useWorkflowStore((state) => state.removeNode)
  const openExpandedStack = useWorkflowStore((state) => state.openExpandedStack)

  const { componentGradients } = useTheme()
  const { isPaintMode, hoverTarget, applyToComponent } = usePaintMode()
  const hasPaint = Boolean(componentGradients[themeType])

  const members = useMemo(() => getMembers(kind, id, nodes), [kind, id, nodes])
  const { page, pageCount } = useStackPagination(members.length, null, true)
  const pageMembers = members.slice(
    page * STACK_PAGE_SIZE,
    page * STACK_PAGE_SIZE + STACK_PAGE_SIZE,
  )
  const pageSlots = padStackPageSlots(pageMembers)

  const accent = componentVar(themeType, 'border')
  const accentSoft = componentVar(themeType, 'border-muted')
  const paintFrom = componentVar(themeType, 'icon-from')
  const paintTo = componentVar(themeType, 'icon-to')

  const handleOpen = () => {
    if (isPaintMode) {
      applyToComponent(themeType)
      return
    }
    openExpandedStack(id)
  }

  return (
    <div className="group/node relative h-[148px] w-[188px]">
      <div className="absolute -inset-10 z-0" aria-hidden />
      <NodePorts nodeId={id} />
      <NodeHoverActions
        onDuplicate={(event) => {
          event.stopPropagation()
          duplicateNode(id)
        }}
        onRemove={(event) => {
          event.stopPropagation()
          removeNode(id)
        }}
        duplicateLabel="Duplicate stack"
        removeLabel="Remove stack"
      />
      <button
        type="button"
        data-paint-target={themeType}
        onClick={handleOpen}
        style={
          hasPaint
            ? {
                backgroundColor: selected
                  ? `color-mix(in oklch, ${paintTo} 22%, transparent)`
                  : `color-mix(in oklch, ${paintFrom} 14%, transparent)`,
                borderColor: selected ? accent : accentSoft,
                boxShadow: selected
                  ? `0 0 0 4px color-mix(in oklch, ${paintTo} 18%, transparent)`
                  : undefined,
              }
            : undefined
        }
        className={cn(
          'paint-mode-target relative z-10 flex size-full cursor-pointer flex-col rounded-[1.75rem] border-2 border-dashed p-2.5 text-left transition-all duration-150',
          !hasPaint &&
            (selected
              ? 'border-connector bg-node/70 shadow-[0_0_0_4px_color-mix(in_oklch,var(--connector)_18%,transparent)]'
              : 'border-connector/35 bg-node/40 hover:border-connector/55 hover:bg-node/55'),
          isPaintMode && 'paint-mode-armed',
          hoverTarget === themeType && 'paint-drop-target',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <div
              className={cn(
                'flex size-7 items-center justify-center rounded-xl shadow-sm',
                !hasPaint && 'bg-node-header text-connector',
              )}
              style={
                hasPaint ? componentIconGradientStyle(themeType) : undefined
              }
            >
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  'truncate text-[9px] font-bold uppercase tracking-widest',
                  !hasPaint && 'text-connector',
                )}
                style={
                  hasPaint
                    ? { color: componentVar(themeType, 'label') }
                    : undefined
                }
              >
                {title}
              </p>
              <p
                className={cn('text-[8px]', !hasPaint && 'text-panel-muted')}
                style={
                  hasPaint
                    ? { color: componentVar(themeType, 'muted') }
                    : undefined
                }
              >
                {isPaintMode ? 'Drop to paint' : emptyHint}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-interactive px-1.5 py-0.5 text-[8px] font-semibold text-interactive-fg">
            {members.length}
          </span>
        </div>

        <div className="mt-2 min-h-0 flex-1">
          {members.length === 0 ? (
            <div
              className={cn(
                'flex h-full min-h-[72px] items-center justify-center rounded-2xl border border-dashed px-2 text-center',
                !hasPaint && 'border-panel-border/80 bg-node/50',
              )}
              style={
                hasPaint
                  ? {
                      borderColor: accentSoft,
                      backgroundColor: `color-mix(in oklch, ${paintFrom} 10%, transparent)`,
                    }
                  : undefined
              }
            >
              <p
                className={cn(
                  'text-[8px] leading-snug',
                  !hasPaint && 'text-panel-muted',
                )}
                style={
                  hasPaint
                    ? { color: componentVar(themeType, 'muted') }
                    : undefined
                }
              >
                Drag items in to group them
              </p>
            </div>
          ) : (
            <div className="grid h-full min-h-[72px] grid-cols-2 grid-rows-1 gap-1.5">
              {pageSlots.map((member, index) =>
                member ? (
                  <StackMemberTile
                    key={member.id}
                    node={member}
                    themeType={
                      kind === 'serverStack'
                        ? 'toolServer'
                        : kind === 'skillStack'
                          ? 'agentSkill'
                          : 'agentInterface'
                    }
                  />
                ) : (
                  <div
                    key={`placeholder-${page}-${index}`}
                    className="min-h-[36px] rounded-xl border border-transparent p-1 opacity-0"
                    aria-hidden
                  />
                ),
              )}
            </div>
          )}
        </div>

        {pageCount > 1 ? (
          <div className="mt-1.5 flex justify-center gap-1">
            {Array.from({ length: pageCount }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  'size-1 rounded-full',
                  index === page ? 'bg-connector' : 'bg-panel-border',
                )}
                style={
                  hasPaint && index === page
                    ? { backgroundColor: accent }
                    : undefined
                }
              />
            ))}
          </div>
        ) : null}
      </button>
    </div>
  )
}

export function ServerStackNode({ id, selected }: NodeProps) {
  return (
    <GroupStackNodeView
      id={id}
      selected={selected}
      kind="serverStack"
      themeType="serverStack"
      title="Stack"
      emptyHint="Drop servers here"
      Icon={Layers}
    />
  )
}

export function SkillStackNode({ id, selected }: NodeProps) {
  return (
    <GroupStackNodeView
      id={id}
      selected={selected}
      kind="skillStack"
      themeType="skillStack"
      title="Skills"
      emptyHint="Drop skills here"
      Icon={Sparkles}
    />
  )
}

export function InterfaceStackNode({ id, selected }: NodeProps) {
  return (
    <GroupStackNodeView
      id={id}
      selected={selected}
      kind="interfaceStack"
      themeType="interfaceStack"
      title="Interfaces"
      emptyHint="Drop interfaces here"
      Icon={Network}
    />
  )
}
