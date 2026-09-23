import { Copy, LogOut, Server, Trash2, X } from 'lucide-react'
import { useMemo } from 'react'

import { StackMiniTile } from '@/features/canvas/nodes/stack-mini-tile'
import {
  getDumpedToolServers,
  STACK_PAGE_SIZE,
} from '@/lib/canvas/stack-dump'
import {
  padStackPageSlots,
  useStackPagination,
} from '@/lib/canvas/use-stack-pagination'
import {
  stackShiftForPanel,
  TOOL_SERVER_PANEL_WIDTH,
} from '@/lib/layout/inspector-layout'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

const STACK_SHIFT_PX = stackShiftForPanel(TOOL_SERVER_PANEL_WIDTH)

export function ServerStackExpanded() {
  const expandedStackId = useWorkflowStore((state) => state.expandedStackId)
  const toolServerModalNodeId = useWorkflowStore(
    (state) => state.toolServerModalNodeId,
  )
  const nodes = useWorkflowStore((state) => state.nodes)
  const closeExpandedStack = useWorkflowStore((state) => state.closeExpandedStack)
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
  const isEditingServer = Boolean(toolServerModalNodeId)

  if (!expandedStackId) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close stack"
        className="absolute inset-0 z-50 bg-black/30 backdrop-blur-[1px] transition-opacity duration-300"
        onClick={closeExpandedStack}
      />

      <div
        className={cn(
          'pointer-events-auto absolute top-1/2 z-[55] w-[min(92vw,360px)] -translate-x-1/2 -translate-y-1/2',
          'transition-[left,transform,opacity] duration-300 ease-out',
          !isEditingServer && 'animate-in fade-in zoom-in-95',
        )}
        style={{
          left: isEditingServer ? `calc(50% - ${STACK_SHIFT_PX}px)` : '50%',
        }}
      >
        <div className="overflow-hidden rounded-3xl border border-panel-border bg-panel-inspector/98 text-panel-inspector-fg shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-panel-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Server Stack</p>
              <p className="text-[11px] text-panel-muted">
                {servers.length} server{servers.length === 1 ? '' : 's'} dumped
                {configuredCount > 0
                  ? ` · ${configuredCount} configured`
                  : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={closeExpandedStack}
              className="flex size-7 items-center justify-center rounded-md text-panel-muted hover:bg-node hover:text-panel-inspector-fg"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-4 py-4">
            {servers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-panel-border px-4 py-10 text-center">
                <Server className="size-8 text-connector/70" />
                <p className="text-xs font-medium">Drop tool servers here</p>
                <p className="text-[10px] leading-snug text-panel-muted">
                  Drag a server onto the stack or add one from the structure bar while dropping on the stack.
                </p>
              </div>
            ) : (
              <div className="grid min-h-[148px] grid-cols-2 gap-3">
                {pageSlots.map((server, index) =>
                  server ? (
                    <div
                      key={server.id}
                      className="rounded-2xl border border-panel-border bg-node/70 p-2"
                    >
                      <button
                        type="button"
                        onClick={() => openToolServerModal(server.id)}
                        className={cn(
                          'w-full rounded-xl transition-colors duration-200',
                          toolServerModalNodeId === server.id
                            ? 'ring-2 ring-connector ring-offset-1 ring-offset-node/70'
                            : 'hover:bg-node/80',
                        )}
                      >
                        <StackMiniTile
                          server={server}
                          size="md"
                          className="min-h-[88px] border-0 bg-transparent shadow-none"
                        />
                      </button>
                      <div className="mt-2 grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => ejectServerFromStack(server.id)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-panel-border bg-node px-1 py-1.5 text-[9px] hover:border-connector"
                        >
                          <LogOut className="size-3" />
                          Eject
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateStackMember(server.id)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-panel-border bg-node px-1 py-1.5 text-[9px] hover:border-connector"
                        >
                          <Copy className="size-3" />
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNode(server.id)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-panel-border bg-node px-1 py-1.5 text-[9px] text-destructive hover:border-destructive"
                        >
                          <Trash2 className="size-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={`placeholder-${page}-${index}`}
                      className="min-h-[148px] rounded-2xl border border-transparent p-2 opacity-0"
                      aria-hidden
                    />
                  ),
                )}
              </div>
            )}

            {pageCount > 1 ? (
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {Array.from({ length: pageCount }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPage(index)}
                    className={cn(
                      'size-1.5 rounded-full transition-colors',
                      index === page ? 'bg-connector' : 'bg-panel-border',
                    )}
                    aria-label={`Page ${index + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
