import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Network,
  Plus,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { StackAddServerSlot } from '@/features/canvas/stack-add-server-slot'
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
import {
  INSPECTOR_PANEL_INSET,
  STACK_PANEL_GAP,
} from '@/lib/layout/inspector-layout'
import type { ValenceNode } from '@/lib/types/workflow'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

function memberTitle(node: ValenceNode) {
  if (node.type === 'toolServer') return node.data.name ?? 'Tool Server'
  if (node.type === 'agentSkill') return node.data.name ?? 'Agent Skill'
  if (node.type === 'agentInterface') {
    const host = node.data.host
    const port = node.data.port
    if (host) return port != null ? `${host}:${port}` : String(host)
    return 'Interface'
  }
  return 'Member'
}

function isConfigured(node: ValenceNode) {
  if (node.type === 'toolServer' || node.type === 'agentSkill') {
    return Boolean(node.data.configId && node.data.name)
  }
  if (node.type === 'agentInterface') {
    return Boolean(node.data.configId)
  }
  return false
}

function MemberCard({
  node,
  isActive,
  onConfigure,
  onEject,
  onDuplicate,
  onDelete,
}: {
  node: ValenceNode
  isActive: boolean
  onConfigure: () => void
  onEject: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'flex min-h-[148px] flex-col rounded-2xl border bg-node/50 p-3',
        isActive ? 'border-connector' : 'border-panel-border',
      )}
    >
      <button
        type="button"
        onClick={onConfigure}
        className="flex flex-1 flex-col items-start text-left"
      >
        <p className="text-xs font-semibold text-panel-inspector-fg">
          {memberTitle(node)}
        </p>
        <p className="mt-1 text-[10px] text-panel-muted">
          {isConfigured(node) ? 'Configured' : 'Needs setup'}
        </p>
      </button>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-[10px]"
          onClick={onEject}
        >
          Eject
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-[10px]"
          onClick={onDuplicate}
        >
          Duplicate
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-[10px] text-destructive"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

export function GroupStackExpanded() {
  const expandedStackId = useWorkflowStore((state) => state.expandedStackId)
  const toolServerModalNodeId = useWorkflowStore(
    (state) => state.toolServerModalNodeId,
  )
  const agentSkillModalNodeId = useWorkflowStore(
    (state) => state.agentSkillModalNodeId,
  )
  const agentInterfaceModalNodeId = useWorkflowStore(
    (state) => state.agentInterfaceModalNodeId,
  )
  const nodes = useWorkflowStore((state) => state.nodes)
  const closeExpandedStack = useWorkflowStore((state) => state.closeExpandedStack)
  const addToolServerToStack = useWorkflowStore(
    (state) => state.addToolServerToStack,
  )
  const addAgentSkillToStack = useWorkflowStore(
    (state) => state.addAgentSkillToStack,
  )
  const addAgentInterfaceToStack = useWorkflowStore(
    (state) => state.addAgentInterfaceToStack,
  )
  const ejectServerFromStack = useWorkflowStore(
    (state) => state.ejectServerFromStack,
  )
  const ejectSkillFromStack = useWorkflowStore(
    (state) => state.ejectSkillFromStack,
  )
  const ejectInterfaceFromStack = useWorkflowStore(
    (state) => state.ejectInterfaceFromStack,
  )
  const duplicateStackMember = useWorkflowStore(
    (state) => state.duplicateStackMember,
  )
  const removeNode = useWorkflowStore((state) => state.removeNode)
  const openToolServerModal = useWorkflowStore(
    (state) => state.openToolServerModal,
  )
  const openAgentSkillModal = useWorkflowStore(
    (state) => state.openAgentSkillModal,
  )
  const openAgentInterfaceModal = useWorkflowStore(
    (state) => state.openAgentInterfaceModal,
  )

  const stack = nodes.find((node) => node.id === expandedStackId)
  const stackKind = stack?.type

  const members = useMemo(() => {
    if (!expandedStackId || !stackKind) return []
    if (stackKind === 'serverStack') {
      return getDumpedToolServers(expandedStackId, nodes)
    }
    if (stackKind === 'skillStack') {
      return getDumpedAgentSkills(expandedStackId, nodes)
    }
    if (stackKind === 'interfaceStack') {
      return getDumpedAgentInterfaces(expandedStackId, nodes)
    }
    return []
  }, [expandedStackId, nodes, stackKind])

  const { page, pageCount, setPage } = useStackPagination(
    members.length,
    expandedStackId,
  )
  const pageMembers = members.slice(
    page * STACK_PAGE_SIZE,
    page * STACK_PAGE_SIZE + STACK_PAGE_SIZE,
  )
  const pageSlots = padStackPageSlots(pageMembers)
  const configuredCount = members.filter((member) => isConfigured(member)).length
  const needsSetupCount = members.length - configuredCount

  const activeMemberId =
    toolServerModalNodeId ??
    agentSkillModalNodeId ??
    agentInterfaceModalNodeId
  const isEditing = Boolean(activeMemberId)
  const isLastPage = page === pageCount - 1
  const canAddOnCurrentPage = isLastPage && pageMembers.length < STACK_PAGE_SIZE

  if (!expandedStackId || !stackKind) return null
  if (
    stackKind !== 'serverStack' &&
    stackKind !== 'skillStack' &&
    stackKind !== 'interfaceStack'
  ) {
    return null
  }

  const meta: Record<
    'serverStack' | 'skillStack' | 'interfaceStack',
    { title: string; subtitle: string; addLabel: string; Icon: LucideIcon }
  > = {
    serverStack: {
      title: 'Server Stack',
      subtitle: 'Group MCP servers for a single connection',
      addLabel: 'Add server',
      Icon: Layers,
    },
    skillStack: {
      title: 'Skill Stack',
      subtitle: 'Group agent skills for an agent card',
      addLabel: 'Add skill',
      Icon: Sparkles,
    },
    interfaceStack: {
      title: 'Interface Stack',
      subtitle: 'Group interfaces for an agent card',
      addLabel: 'Add interface',
      Icon: Network,
    },
  }

  const current = meta[stackKind]

  const handleAdd = () => {
    if (!expandedStackId) return
    let newId: string | null = null
    if (stackKind === 'serverStack') {
      newId = addToolServerToStack(expandedStackId)
      if (newId) openToolServerModal(newId)
    } else if (stackKind === 'skillStack') {
      newId = addAgentSkillToStack(expandedStackId)
      if (newId) openAgentSkillModal(newId)
    } else {
      newId = addAgentInterfaceToStack(expandedStackId)
      if (newId) openAgentInterfaceModal(newId)
    }
    if (!newId) return
    setPage(Math.floor(members.length / STACK_PAGE_SIZE))
  }

  const handleConfigure = (node: ValenceNode) => {
    if (node.type === 'toolServer') openToolServerModal(node.id)
    else if (node.type === 'agentSkill') openAgentSkillModal(node.id)
    else if (node.type === 'agentInterface') openAgentInterfaceModal(node.id)
  }

  const handleEject = (node: ValenceNode) => {
    if (node.type === 'toolServer') ejectServerFromStack(node.id)
    else if (node.type === 'agentSkill') ejectSkillFromStack(node.id)
    else if (node.type === 'agentInterface') ejectInterfaceFromStack(node.id)
  }

  const Icon = current.Icon

  return (
    <>
      <button
        type="button"
        aria-label="Close stack"
        className="absolute inset-0 z-50 bg-black/35 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={closeExpandedStack}
      />

      <div
        className={cn(
          'pointer-events-auto absolute top-1/2 z-[55] w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2',
          'transition-[left,transform,opacity] duration-300 ease-out',
          !isEditing && 'animate-in fade-in zoom-in-95',
        )}
        style={{
          left: isEditing
            ? `calc(50% - (var(--inspector-panel-width) + ${INSPECTOR_PANEL_INSET}px + ${STACK_PANEL_GAP}px) / 2)`
            : '50%',
        }}
      >
        <div className="overflow-hidden rounded-3xl border border-panel-border bg-panel-inspector/98 text-panel-inspector-fg shadow-2xl">
          <div className="border-b border-panel-border bg-node/30 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-connector/20 to-interactive/20 text-connector ring-1 ring-connector/20">
                <Icon className="size-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight">
                      {current.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-panel-muted">
                      {current.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeExpandedStack}
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-panel-muted transition-colors hover:bg-node hover:text-panel-inspector-fg"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-interactive px-2 py-0.5 text-[10px] font-semibold text-interactive-fg">
                    {members.length} total
                  </span>
                  {configuredCount > 0 ? (
                    <span className="rounded-full bg-connector/15 px-2 py-0.5 text-[10px] font-medium text-connector">
                      {configuredCount} ready
                    </span>
                  ) : null}
                  {needsSetupCount > 0 ? (
                    <span className="rounded-full bg-panel-border/80 px-2 py-0.5 text-[10px] font-medium text-panel-muted">
                      {needsSetupCount} need setup
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                className="h-8 flex-1 gap-1.5 bg-connector text-[11px] text-white hover:bg-connector/90"
              >
                <Plus className="size-3.5" />
                {current.addLabel}
              </Button>
            </div>
          </div>

          <div className="px-4 py-4">
            {members.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-panel-border bg-node/40 px-5 py-10 text-center">
                <p className="text-sm font-semibold">Empty stack</p>
                <p className="mt-1 max-w-[240px] text-[11px] leading-relaxed text-panel-muted">
                  Add a member, or drag one from the canvas onto the stack node.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAdd}
                  className="mt-4 h-8 gap-1.5 bg-connector text-[11px] text-white hover:bg-connector/90"
                >
                  <Plus className="size-3.5" />
                  {current.addLabel}
                </Button>
              </div>
            ) : (
              <div className="grid min-h-[148px] grid-cols-2 gap-3">
                {pageSlots.map((member, index) => {
                  if (member) {
                    return (
                      <MemberCard
                        key={member.id}
                        node={member}
                        isActive={activeMemberId === member.id}
                        onConfigure={() => handleConfigure(member)}
                        onEject={() => handleEject(member)}
                        onDuplicate={() => duplicateStackMember(member.id)}
                        onDelete={() => removeNode(member.id)}
                      />
                    )
                  }

                  if (canAddOnCurrentPage) {
                    return (
                      <StackAddServerSlot
                        key={`add-${page}-${index}`}
                        onClick={handleAdd}
                      />
                    )
                  }

                  return (
                    <div
                      key={`placeholder-${page}-${index}`}
                      className="min-h-[148px] rounded-2xl border border-transparent p-2 opacity-0"
                      aria-hidden
                    />
                  )
                })}
              </div>
            )}

            {pageCount > 1 ? (
              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-panel-border bg-node/40 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="flex size-7 items-center justify-center rounded-lg text-panel-muted transition-colors hover:bg-node hover:text-panel-inspector-fg disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-[10px] text-panel-muted">
                  {page + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
                  disabled={page >= pageCount - 1}
                  className="flex size-7 items-center justify-center rounded-lg text-panel-muted transition-colors hover:bg-node hover:text-panel-inspector-fg disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
