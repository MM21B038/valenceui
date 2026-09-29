import { useReactFlow } from '@xyflow/react'
import { Bot, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ExecutorPickerList } from '@/features/a2a/executor-picker-list'
import { Button } from '@/components/ui/button'
import { useAgentExecutors } from '@/lib/api/agent-executor'
import type {
  AgentExecutor,
  AgentExecutorListItem,
} from '@/lib/types/agent-executor'
import { useWorkflowStore } from '@/stores/workflow-store'

const NODE_WIDTH = 200
const NODE_HEIGHT = 88
const PLACE_OFFSET = 36

export function A2aAddAgentChrome() {
  const nodes = useWorkflowStore((state) => state.nodes)
  const addAgentExecutorNode = useWorkflowStore(
    (state) => state.addAgentExecutorNode,
  )
  const updateAgentExecutorNode = useWorkflowStore(
    (state) => state.updateAgentExecutorNode,
  )
  const { screenToFlowPosition } = useReactFlow()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data: configs = [], isLoading, isError } = useAgentExecutors()

  useEffect(() => {
    if (!pickerOpen) setSearch('')
  }, [pickerOpen])

  const isEmpty = nodes.length === 0

  const placeBound = (config: AgentExecutor | AgentExecutorListItem) => {
    const existing = nodes.filter((node) => node.type === 'agentExecutor')
    let position: { x: number; y: number }

    if (existing.length === 0) {
      const center = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
      position = {
        x: center.x - NODE_WIDTH / 2,
        y: center.y - NODE_HEIGHT / 2,
      }
    } else {
      const last = existing[existing.length - 1]
      position = {
        x: last.position.x + PLACE_OFFSET,
        y: last.position.y + PLACE_OFFSET,
      }
    }

    const id = addAgentExecutorNode(position)
    updateAgentExecutorNode(id, {
      configId: config.uuid,
      name: config.name,
      host: config.host,
      port: config.port,
      label: config.name,
    })
    setPickerOpen(false)
  }

  return (
    <>
      {isEmpty && !pickerOpen ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-4 px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-panel-border bg-panel/90 shadow-lg backdrop-blur-sm">
              <Bot className="size-6 text-connector" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold tracking-tight text-panel-fg">
                Connect agents
              </p>
              <p className="text-sm leading-snug text-panel-muted">
                Place existing executors on the canvas, then wire them together.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="size-3.5" />
              Add agent
            </Button>
          </div>
        </div>
      ) : null}

      {!isEmpty ? (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
          <Button
            type="button"
            size="sm"
            className="gap-1.5 rounded-full px-4 shadow-lg"
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="size-3.5" />
            Add agent
          </Button>
        </div>
      ) : null}

      {pickerOpen ? (
        <>
          <button
            type="button"
            aria-label="Close picker"
            className="absolute inset-0 z-30 bg-black/20"
            onClick={() => setPickerOpen(false)}
          />
          <div className="pointer-events-auto absolute top-1/2 left-1/2 z-40 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-panel-border bg-panel-inspector/95 text-panel-inspector-fg shadow-xl backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3 border-b border-panel-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Add agent</p>
                <p className="text-xs text-panel-muted">
                  Choose an executor to place on the canvas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-panel-muted transition-colors hover:bg-node hover:text-panel-inspector-fg"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-[min(420px,60vh)] overflow-y-auto px-4 py-3">
              <ExecutorPickerList
                configs={configs}
                isLoading={isLoading}
                isError={isError}
                search={search}
                onSearchChange={setSearch}
                onSelect={placeBound}
                emptyLabel="No executors available."
              />
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
