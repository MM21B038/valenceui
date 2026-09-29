import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'

import { ThemePalettePicker } from '@/components/theme/theme-palette-picker'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  useDeleteWorkspace,
  useUpdateWorkspace,
  useWorkspace,
} from '@/lib/api/dnd-workspace'
import { persistWorkspaceGraph } from '@/lib/canvas/workspace-graph'
import { useWorkflowStore } from '@/stores/workflow-store'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const workflowId = useWorkflowStore((state) => state.workflowId)
  const workflowName = useWorkflowStore((state) => state.workflowName)
  const workspaceType = useWorkflowStore((state) => state.workspaceType)
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
  const setWorkflowMeta = useWorkflowStore((state) => state.setWorkflowMeta)
  const resetWorkspace = useWorkflowStore((state) => state.resetWorkspace)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(workflowName)
  const [deleting, setDeleting] = useState(false)

  const isPersisted = workflowId !== 'local-draft'
  const { data: previous } = useWorkspace(isPersisted ? workflowId : '')
  const updateWorkspace = useUpdateWorkspace()
  const deleteWorkspace = useDeleteWorkspace()

  useEffect(() => {
    if (!editingName) setNameDraft(workflowName)
  }, [workflowName, editingName])

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
        setSaveError('Could not rename workspace.')
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
    setSaveError(null)
    try {
      await deleteWorkspace.mutateAsync(workflowId)
      resetWorkspace(workspaceType)
      navigate('/')
    } catch {
      setSaveError('Could not delete workspace.')
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async () => {
    if (!isPersisted) {
      setSaveError('Create a workspace from Home first.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await persistWorkspaceGraph({
        workspaceUuid: workflowId,
        workspaceType,
        name: workflowName,
        nodes,
        edges,
        previous: previous ?? null,
      })
    } catch {
      setSaveError('Save failed.')
    } finally {
      setSaving(false)
    }
  }

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
            ) : null}
            {saveError ? (
              <span className="text-[10px] text-destructive">{saveError}</span>
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
            disabled={saving || deleting}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {isPersisted ? (
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/40 bg-transparent text-destructive hover:bg-destructive hover:text-white"
              onClick={() => void handleDelete()}
              disabled={deleting || saving}
              title="Delete workspace"
            >
              <Trash2 className="size-3.5" />
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          ) : null}
          <Button
            size="sm"
            className="bg-connector text-node-fg hover:bg-connector/90"
          >
            Run
          </Button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
