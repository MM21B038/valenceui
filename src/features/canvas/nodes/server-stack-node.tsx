import { type NodeProps } from '@xyflow/react'
import { Layers } from 'lucide-react'
import { useMemo } from 'react'

import { NodeHoverActions } from '@/features/canvas/nodes/node-hover-actions'
import { StackMiniTile } from '@/features/canvas/nodes/stack-mini-tile'
import { NodePorts } from '@/features/canvas/nodes/node-ports'
import {
  STACK_PAGE_SIZE,
  getDumpedToolServers,
} from '@/lib/canvas/stack-dump'
import {
  padStackPageSlots,
  useStackPagination,
} from '@/lib/canvas/use-stack-pagination'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

export function ServerStackNode({ id, selected }: NodeProps) {
  const nodes = useWorkflowStore((state) => state.nodes)
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const removeNode = useWorkflowStore((state) => state.removeNode)
  const openExpandedStack = useWorkflowStore((state) => state.openExpandedStack)

  const servers = useMemo(() => getDumpedToolServers(id, nodes), [id, nodes])
  const { page, pageCount } = useStackPagination(servers.length, null, true)
  const pageServers = servers.slice(
    page * STACK_PAGE_SIZE,
    page * STACK_PAGE_SIZE + STACK_PAGE_SIZE,
  )
  const pageSlots = padStackPageSlots(pageServers)

  const handleDuplicate = (event: React.MouseEvent) => {
    event.stopPropagation()
    duplicateNode(id)
  }

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation()
    removeNode(id)
  }

  const handleOpen = () => {
    openExpandedStack(id)
  }

  return (
    <div className="group/node relative h-[148px] w-[188px]">
      <div className="absolute -inset-10 z-0" aria-hidden />

      <NodePorts nodeId={id} />

      <NodeHoverActions
        onDuplicate={handleDuplicate}
        onRemove={handleRemove}
        duplicateLabel="Duplicate stack"
        removeLabel="Remove stack"
      />

      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'relative z-10 flex size-full cursor-pointer flex-col rounded-[1.75rem] border-2 border-dashed bg-node/40 p-2.5 text-left transition-all duration-150',
          selected
            ? 'border-connector bg-node/70 shadow-[0_0_0_4px_color-mix(in_oklch,var(--connector)_18%,transparent)]'
            : 'border-connector/35 hover:border-connector/55 hover:bg-node/55',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex size-7 items-center justify-center rounded-xl bg-node-header text-connector shadow-sm">
              <Layers className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[9px] font-bold uppercase tracking-widest text-connector">
                Stack
              </p>
              <p className="text-[8px] text-panel-muted">Drop servers here</p>
            </div>
          </div>
          <span className="rounded-full bg-interactive px-1.5 py-0.5 text-[8px] font-semibold text-interactive-fg">
            {servers.length}
          </span>
        </div>

        <div className="mt-2 min-h-0 flex-1">
          {servers.length === 0 ? (
            <div className="flex h-full min-h-[72px] items-center justify-center rounded-2xl border border-dashed border-panel-border/80 bg-node/50 px-2 text-center">
              <p className="text-[8px] leading-snug text-panel-muted">
                Drag tool servers in to dump them
              </p>
            </div>
          ) : (
            <div className="grid h-full min-h-[72px] grid-cols-2 grid-rows-1 gap-1.5">
              {pageSlots.map((server, index) =>
                server ? (
                  <StackMiniTile key={server.id} server={server} />
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
              />
            ))}
          </div>
        ) : null}
      </button>
    </div>
  )
}
