import { ArrowRight, Bot, Network, Trash2, Workflow, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useTheme } from '@/components/theme/theme-provider'
import { ThemePalettePicker } from '@/components/theme/theme-palette-picker'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateWorkspace,
  useDeleteWorkspace,
  useWorkspaces,
} from '@/lib/api/dnd-workspace'
import { colorRoles, resolvePalette } from '@/lib/theme/brand'
import type { WorkspaceType } from '@/lib/types/dnd-workspace'
import { useWorkflowStore } from '@/stores/workflow-store'

const rolePreview = [
  { label: 'Header', className: 'bg-chrome text-chrome-fg' },
  { label: 'Canvas', className: 'bg-workspace text-foreground' },
  { label: 'Controls', className: 'bg-node text-node-fg border border-border' },
  { label: 'Connectors', className: 'bg-connector text-node-fg' },
] as const

export function HomePage() {
  const theme = useTheme()
  const activePalette = resolvePalette(theme)
  const navigate = useNavigate()
  const createWorkspace = useCreateWorkspace()
  const deleteWorkspace = useDeleteWorkspace()
  const resetWorkspace = useWorkflowStore((state) => state.resetWorkspace)
  const { data: workspaces = [] } = useWorkspaces()
  const [pendingType, setPendingType] = useState<WorkspaceType | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const openCreate = (type: WorkspaceType) => {
    setPendingType(type)
    setNameDraft(type === 'a2a' ? 'A2A Workspace' : 'Executor Workspace')
    setFormError(null)
  }

  const closeCreate = () => {
    if (creating) return
    setPendingType(null)
    setFormError(null)
  }

  const confirmCreate = async () => {
    if (!pendingType) return
    const name = nameDraft.trim()
    if (!name) {
      setFormError('Name is required.')
      return
    }
    if (name.length > 30) {
      setFormError('Name must be 30 characters or fewer.')
      return
    }

    setCreating(true)
    setFormError(null)
    try {
      const created = await createWorkspace.mutateAsync({
        name,
        type: pendingType,
      })
      resetWorkspace(pendingType, created.name)
      useWorkflowStore
        .getState()
        .setWorkflowMeta(created.uuid, created.name, pendingType)
      navigate(`/editor/${created.uuid}`)
    } catch {
      resetWorkspace(pendingType, name)
      navigate('/editor')
    } finally {
      setCreating(false)
      setPendingType(null)
    }
  }

  const handleDelete = async (uuid: string, name: string) => {
    if (!window.confirm(`Delete workspace "${name}"? This cannot be undone.`)) {
      return
    }
    setDeletingId(uuid)
    try {
      await deleteWorkspace.mutateAsync(uuid)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="flex items-center justify-between border-b border-panel-border bg-chrome px-6 py-4 text-chrome-fg">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-node-icon text-sm font-bold text-node-icon-fg">
            V
          </div>
          <div>
            <p className="font-semibold">Valence</p>
            <p className="text-xs text-chrome-muted">AI Workflow Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemePalettePicker />
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {activePalette.name} colors
            </p>
            <div className="flex gap-2">
              {Object.entries(activePalette.colors).map(([name, hex]) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <div
                    className="size-10 rounded-lg border border-border shadow-sm"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Applied to components
            </p>
            <div className="grid grid-cols-2 gap-2">
              {rolePreview.map(({ label, className }) => (
                <div
                  key={label}
                  className={`flex h-12 items-center justify-center rounded-lg text-xs font-medium ${className}`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
          <Workflow className="size-3.5" />
          Two workspace modes
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          Build executors — or wire them into A2A graphs
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Compose Agent Executors from LLM, thread, MCP and card blocks, or
          connect finished executors to each other in an A2A workspace.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            disabled={creating}
            onClick={() => openCreate('agent-executor')}
            className="group rounded-2xl border border-border bg-node/40 p-5 text-left transition hover:border-connector/50 hover:bg-node/70"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-interactive/15 text-interactive">
              <Bot className="size-5" />
            </div>
            <p className="text-base font-semibold">Agent Executor workspace</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag LLM, Thread, MCP, Card and Skills — click an unset executor to
              create it directly.
            </p>
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-interactive">
              Create workspace
              <ArrowRight className="size-3.5" />
            </p>
          </button>

          <button
            type="button"
            disabled={creating}
            onClick={() => openCreate('a2a')}
            className="group rounded-2xl border border-border bg-node/40 p-5 text-left transition hover:border-connector/50 hover:bg-node/70"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-connector/15 text-connector">
              <Network className="size-5" />
            </div>
            <p className="text-base font-semibold">A2A workspace</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Search existing Agent Executors and connect them source → target.
            </p>
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-connector">
              Create workspace
              <ArrowRight className="size-3.5" />
            </p>
          </button>
        </div>

        {workspaces.length > 0 ? (
          <div className="mt-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recent workspaces
            </p>
            <div className="flex flex-wrap gap-2">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.uuid}
                  className="group inline-flex items-center gap-0.5 rounded-lg border border-border bg-background pr-0.5"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-md px-2.5"
                    asChild
                  >
                    <Link to={`/editor/${workspace.uuid}`}>
                      {workspace.name}
                      <span className="ml-1.5 text-[10px] text-muted-foreground">
                        {workspace.type}
                      </span>
                    </Link>
                  </Button>
                  <button
                    type="button"
                    title={`Delete ${workspace.name}`}
                    aria-label={`Delete ${workspace.name}`}
                    disabled={deletingId === workspace.uuid}
                    onClick={() =>
                      void handleDelete(workspace.uuid, workspace.name)
                    }
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8">
          <Button size="lg" variant="outline" asChild>
            <Link to="/prompts">Prompt library</Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Brand roles: {Object.keys(colorRoles).join(', ')}
        </p>
      </section>

      {pendingType ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-panel-border bg-panel p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-panel-fg">
                  Name your workspace
                </h2>
                <p className="mt-1 text-xs text-panel-muted">
                  {pendingType === 'a2a'
                    ? 'A2A — connect agent executors'
                    : 'Agent Executor — compose a runnable agent'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-md p-1 text-panel-muted hover:bg-panel-inspector hover:text-panel-fg"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px]">Workspace name</Label>
              <Input
                autoFocus
                className="h-9 text-sm"
                maxLength={30}
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void confirmCreate()
                }}
                placeholder="My workspace"
              />
              <p className="text-[10px] text-panel-muted">
                {nameDraft.trim().length}/30
              </p>
            </div>

            {formError ? (
              <p className="mt-2 text-xs text-destructive">{formError}</p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeCreate}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void confirmCreate()}
                disabled={creating || !nameDraft.trim()}
                className="bg-interactive text-interactive-fg hover:bg-interactive/90"
              >
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
