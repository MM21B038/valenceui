import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { CircleCheck, Loader2, Trash2 } from 'lucide-react'

import { ThemePalettePicker } from '@/components/theme/theme-palette-picker'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  useDeleteWorkspace,
  useRunWorkspace,
  useStopRemoveWorkspace,
  useStopWorkspace,
  useUpdateWorkspace,
} from '@/lib/api/dnd-workspace'
import type { WorkspaceContainerResult } from '@/lib/types/dnd-workspace'
import { useWorkspaceAutosave } from '@/lib/canvas/use-workspace-autosave'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/stores/workflow-store'

interface AppShellProps {
  children: React.ReactNode
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/** Parse executor UUID from container name `{workspaceId}_{executorUuid}`. */
function executorUuidFromContainerName(
  workspaceId: string,
  containerName: string | null | undefined,
): string | null {
  if (!containerName) return null
  const prefix = `${workspaceId}_`
  if (!containerName.startsWith(prefix)) return null
  const executorUuid = containerName.slice(prefix.length)
  return executorUuid || null
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const workflowId = useWorkflowStore((state) => state.workflowId)
  const workflowName = useWorkflowStore((state) => state.workflowName)
  const workspaceType = useWorkflowStore((state) => state.workspaceType)
  const nodes = useWorkflowStore((state) => state.nodes)
  const setWorkflowMeta = useWorkflowStore((state) => state.setWorkflowMeta)
  const resetWorkspace = useWorkflowStore((state) => state.resetWorkspace)
  const updateAgentExecutorNode = useWorkflowStore(
    (state) => state.updateAgentExecutorNode,
  )
  const [actionError, setActionError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(workflowName)
  const [deleting, setDeleting] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)

  const runWorkspace = useRunWorkspace()
  const stopWorkspace = useStopWorkspace()
  const stopRemoveWorkspace = useStopRemoveWorkspace()

  const isPersisted = workflowId !== 'local-draft'
  const updateWorkspace = useUpdateWorkspace()
  const deleteWorkspace = useDeleteWorkspace()
  const {
    saving,
    saveError: graphSaveError,
    saveNow,
    discardUnsavedGraph,
    resumeAutosave,
    autosavePhase,
  } = useWorkspaceAutosave()
  const saveError = graphSaveError ?? actionError

  const configuredExecutors = nodes.filter(
    (node) =>
      node.type === 'agentExecutor' &&
      typeof node.data.configId === 'string' &&
      node.data.configId,
  )

  useEffect(() => {
    if (!editingName) setNameDraft(workflowName)
  }, [workflowName, editingName])

  const applyContainerStatuses = (result: WorkspaceContainerResult) => {
    for (const container of result.containers) {
      const executorUuid = executorUuidFromContainerName(
        workflowId,
        container.container_name ?? container.uuid,
      )
      if (!executorUuid) continue
      const node = configuredExecutors.find(
        (item) => String(item.data.configId) === executorUuid,
      )
      if (node) {
        updateAgentExecutorNode(node.id, {
          containerStatus: container.status,
        })
      }
    }
  }

  const commitName = async () => {
    const next = nameDraft.trim()
    setEditingName(false)
    if (!next || next === workflowName) {
      setNameDraft(workflowName)
      return
    }
    const previousName = workflowName
    setWorkflowMeta(workflowId, next)
    if (isPersisted) {
      try {
        await updateWorkspace.mutateAsync({
          uuid: workflowId,
          payload: { name: next },
        })
      } catch {
        setActionError('Could not rename workspace.')
        setWorkflowMeta(workflowId, previousName)
        setNameDraft(previousName)
      }
    }
  }

  const handleDelete = async () => {
    if (!isPersisted) return
    if (
      !window.confirm(
        `Delete workspace "${workflowName}"? This cannot be undone.`,
      )
    ) {
      return
    }
    setDeleting(true)
    setActionError(null)
    discardUnsavedGraph()
    try {
      await deleteWorkspace.mutateAsync(workflowId)
      resetWorkspace(workspaceType)
      navigate('/')
    } catch {
      resumeAutosave()
      setActionError('Could not delete workspace.')
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = () => {
    setActionError(null)
    saveNow()
  }

  const handleRun = async () => {
    setRunError(null)
    if (!isPersisted) {
      setRunError('Save the workspace first.')
      return
    }
    if (configuredExecutors.length === 0) {
      setRunError('Bind an agent executor first.')
      return
    }

    try {
      const result = await runWorkspace.mutateAsync(workflowId)
      applyContainerStatuses(result)
    } catch (error) {
      setRunError(apiErrorMessage(error, 'Run failed.'))
    }
  }

  const handleStop = async () => {
    setRunError(null)
    if (!isPersisted) {
      setRunError('Save the workspace first.')
      return
    }

    try {
      const result = await stopWorkspace.mutateAsync(workflowId)
      applyContainerStatuses(result)
    } catch (error) {
      setRunError(apiErrorMessage(error, 'Stop failed.'))
    }
  }

  const handleStopRemove = async () => {
    setRunError(null)
    if (!isPersisted) {
      setRunError('Save the workspace first.')
      return
    }
    if (
      !window.confirm(
        'Stop and remove workspace container(s)? The config is kept.',
      )
    ) {
      return
    }

    try {
      const result = await stopRemoveWorkspace.mutateAsync(workflowId)
      applyContainerStatuses(result)
    } catch (error) {
      setRunError(apiErrorMessage(error, 'Stop & remove failed.'))
    }
  }

  const lifecyclePending =
    runWorkspace.isPending ||
    stopWorkspace.isPending ||
    stopRemoveWorkspace.isPending

  const lifecycleDisabled = lifecyclePending || !isPersisted

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center justify-between border-b border-panel-border bg-chrome px-4 text-chrome-fg">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-node-icon text-sm font-bold text-node-icon-fg">
              V
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Valence</p>
              <p className="text-xs text-chrome-muted">Workflow Studio</p>
            </div>
          </Link>
          <Separator orientation="vertical" className="h-6 bg-panel-border" />
          <div className="flex items-center gap-2">
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                maxLength={30}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={() => void commitName()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                  if (event.key === 'Escape') {
                    setNameDraft(workflowName)
                    setEditingName(false)
                  }
                }}
                className="h-7 w-[180px] rounded-md border border-chrome-fg/30 bg-chrome px-2 text-sm font-medium text-chrome-fg outline-none focus:border-connector"
                aria-label="Workspace name"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="rounded-md px-1.5 py-0.5 text-sm font-medium hover:bg-chrome-fg/10"
                title="Click to rename"
              >
                {workflowName}
              </button>
            )}
            <Badge
              variant="outline"
              className="border-connector/40 text-chrome-fg"
            >
              {workspaceType === 'a2a' ? 'A2A' : 'Executor'}
            </Badge>
            {!isPersisted ? (
              <Badge
                variant="outline"
                className="border-chrome-fg/30 text-chrome-muted"
              >
                Draft
              </Badge>
            ) : autosavePhase !== 'off' ? (
              <span
                className="inline-flex items-center gap-1"
                title={
                  autosavePhase === 'saving'
                    ? 'Saving'
                    : autosavePhase === 'saved'
                      ? 'Saved'
                      : 'Unsaved changes'
                }
                aria-label={
                  autosavePhase === 'saving'
                    ? 'Saving'
                    : autosavePhase === 'saved'
                      ? 'Saved'
                      : 'Unsaved changes'
                }
              >
                <span
                  className={cn(
                    'size-2 rounded-full',
                    autosavePhase === 'saved'
                      ? 'bg-green-500'
                      : autosavePhase === 'saving'
                        ? 'animate-pulse bg-green-500/60'
                        : 'bg-chrome-muted',
                  )}
                />
                {autosavePhase === 'saving' ? (
                  <Loader2 className="size-3.5 animate-spin text-green-500" />
                ) : (
                  <CircleCheck
                    className={cn(
                      'size-3.5',
                      autosavePhase === 'saved'
                        ? 'text-green-500'
                        : 'text-chrome-muted',
                    )}
                  />
                )}
              </span>
            ) : null}
            {saveError || runError ? (
              <span className="max-w-[220px] truncate text-[10px] text-destructive">
                {runError ?? saveError}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemePalettePicker />
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="border-chrome-fg/25 bg-transparent text-chrome-fg hover:bg-interactive hover:text-interactive-fg"
            asChild
          >
            <Link to="/prompts">Prompts</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-chrome-fg/25 bg-transparent text-chrome-fg hover:bg-interactive hover:text-interactive-fg"
            asChild
          >
            <Link to="/">Home</Link>
          </Button>
          <Button
            size="sm"
            className="bg-interactive text-interactive-fg hover:bg-interactive/90"
            onClick={handleSave}
            disabled={saving || deleting || lifecyclePending}
            title={
              isPersisted
                ? 'Save now. Changes also autosave after 10 seconds.'
                : 'Create a workspace from Home first.'
            }
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {isPersisted ? (
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/40 bg-transparent text-destructive hover:bg-destructive hover:text-white"
              onClick={() => void handleDelete()}
              disabled={deleting || saving || lifecyclePending}
              title="Delete workspace"
            >
              <Trash2 className="size-3.5" />
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="border-chrome-fg/25 bg-transparent text-chrome-fg hover:bg-interactive hover:text-interactive-fg"
            onClick={() => void handleStop()}
            disabled={lifecycleDisabled}
            title={
              isPersisted
                ? 'Stop workspace containers'
                : 'Save the workspace first'
            }
          >
            {stopWorkspace.isPending ? 'Stopping…' : 'Stop'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/40 bg-transparent text-destructive hover:bg-destructive hover:text-white"
            onClick={() => void handleStopRemove()}
            disabled={lifecycleDisabled}
            title={
              isPersisted
                ? 'Stop and remove workspace containers'
                : 'Save the workspace first'
            }
          >
            {stopRemoveWorkspace.isPending ? 'Removing…' : 'Stop & remove'}
          </Button>
          <Button
            size="sm"
            className="bg-connector text-node-fg hover:bg-connector/90"
            onClick={() => void handleRun()}
            disabled={
              lifecycleDisabled || configuredExecutors.length === 0
            }
            title={
              !isPersisted
                ? 'Save the workspace first'
                : configuredExecutors.length === 0
                  ? 'Bind an agent executor first'
                  : 'Run workspace containers'
            }
          >
            {runWorkspace.isPending ? 'Running…' : 'Run'}
          </Button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
