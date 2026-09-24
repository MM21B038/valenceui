import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Plus,
  Server,
  X,
} from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { StackAddServerSlot } from '@/features/canvas/stack-add-server-slot'
import { StackServerCard } from '@/features/canvas/stack-server-card'
import {
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
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

export function ServerStackExpanded() {
  const expandedStackId = useWorkflowStore((state) => state.expandedStackId)
  const toolServerModalNodeId = useWorkflowStore(
    (state) => state.toolServerModalNodeId,
  )
  const nodes = useWorkflowStore((state) => state.nodes)
  const closeExpandedStack = useWorkflowStore((state) => state.closeExpandedStack)
  const addToolServerToStack = useWorkflowStore((state) => state.addToolServerToStack)
  const ejectServerFromStack = useWorkflowStore((state) => state.ejectServerFromStack)
  const duplicateStackMember = useWorkflowStore((state) => state.duplicateStackMember)
  const removeNode = useWorkflowStore((state) => state.removeNode)
  const openToolServerModal = useWorkflowStore((state) => state.openToolServerModal)

  const servers = useMemo(
    () =>
      expandedStackId ? getDumpedToolServers(expandedStackId, nodes) : [],
    [expandedStackId, nodes],
  )

  const { page, pageCount, setPage } = useStackPagination(
    servers.length,
    expandedStackId,
  )
  const pageServers = servers.slice(
    page * STACK_PAGE_SIZE,
    page * STACK_PAGE_SIZE + STACK_PAGE_SIZE,
  )
  const pageSlots = padStackPageSlots(pageServers)
  const configuredCount = servers.filter((server) => server.data.configId).length
  const needsSetupCount = servers.length - configuredCount
  const isEditingServer = Boolean(toolServerModalNodeId)
  const isLastPage = page === pageCount - 1
  const canAddOnCurrentPage = isLastPage && pageServers.length < STACK_PAGE_SIZE

  const handleAddServer = () => {
    if (!expandedStackId) return

    const newId = addToolServerToStack(expandedStackId)
    if (!newId) return

    setPage(Math.floor(servers.length / STACK_PAGE_SIZE))
    openToolServerModal(newId)
  }

  if (!expandedStackId) return null

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
          !isEditingServer && 'animate-in fade-in zoom-in-95',
        )}
        style={{
          left: isEditingServer
            ? `calc(50% - (var(--inspector-panel-width) + ${INSPECTOR_PANEL_INSET}px + ${STACK_PANEL_GAP}px) / 2)`
            : '50%',
        }}
      >
        <div className="overflow-hidden rounded-3xl border border-panel-border bg-panel-inspector/98 text-panel-inspector-fg shadow-2xl">
          <div className="border-b border-panel-border bg-node/30 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-connector/20 to-interactive/20 text-connector ring-1 ring-connector/20">
                <Layers className="size-4.5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight">
                      Server Stack
                    </p>
                    <p className="mt-0.5 text-[11px] text-panel-muted">
                      Group MCP servers for a single LLM connection
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
                    {servers.length} total
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
                onClick={handleAddServer}
                className="h-8 flex-1 gap-1.5 bg-connector text-[11px] text-white hover:bg-connector/90"
              >
                <Plus className="size-3.5" />
                Add server
              </Button>
            </div>
          </div>

          <div className="px-4 py-4">
            {servers.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-panel-border bg-node/40 px-5 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-connector/10 text-connector">
                  <Server className="size-5" />
                </div>
                <p className="mt-3 text-sm font-semibold">No servers yet</p>
                <p className="mt-1 max-w-[240px] text-[11px] leading-relaxed text-panel-muted">
                  Add an MCP server to this stack, or drag one from the canvas
                  onto the stack node.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddServer}
                  className="mt-4 h-8 gap-1.5 bg-connector text-[11px] text-white hover:bg-connector/90"
                >
                  <Plus className="size-3.5" />
                  Add your first server
                </Button>
              </div>
            ) : (
              <div className="grid min-h-[148px] grid-cols-2 gap-3">
                {pageSlots.map((server, index) => {
                  if (server) {
                    return (
                      <StackServerCard
                        key={server.id}
                        server={server}
                        isActive={toolServerModalNodeId === server.id}
                        onConfigure={() => openToolServerModal(server.id)}
                        onEject={() => ejectServerFromStack(server.id)}
                        onDuplicate={() => duplicateStackMember(server.id)}
                        onDelete={() => removeNode(server.id)}
                      />
                    )
                  }

                  if (canAddOnCurrentPage) {
                    return (
                      <StackAddServerSlot
                        key={`add-${page}-${index}`}
                        onClick={handleAddServer}
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

                <div className="flex items-center gap-2">
                  {Array.from({ length: pageCount }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setPage(index)}
                      className={cn(
                        'size-1.5 rounded-full transition-all',
                        index === page
                          ? 'w-4 bg-connector'
                          : 'bg-panel-border hover:bg-panel-muted',
                      )}
                      aria-label={`Page ${index + 1}`}
                    />
                  ))}
                  <span className="text-[10px] text-panel-muted">
                    {page + 1} / {pageCount}
                  </span>
                </div>

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

          <div className="border-t border-panel-border bg-node/20 px-4 py-2.5">
            <p className="text-center text-[10px] leading-relaxed text-panel-muted">
              Click a server to configure · Drag from canvas to dump in · Eject
              returns a server to the canvas
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
