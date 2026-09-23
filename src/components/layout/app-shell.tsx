import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSaveWorkflow } from '@/lib/api/workflows'
import { useWorkflowStore } from '@/stores/workflow-store'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const workflowName = useWorkflowStore((state) => state.workflowName)
  const toWorkflowGraph = useWorkflowStore((state) => state.toWorkflowGraph)
  const saveWorkflow = useSaveWorkflow()

  const handleSave = () => {
    saveWorkflow.mutate(toWorkflowGraph())
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
            <p className="text-sm font-medium">{workflowName}</p>
            <Badge
              variant="outline"
              className="border-connector/40 text-chrome-fg"
            >
              Draft
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
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
            disabled={saveWorkflow.isPending}
          >
            {saveWorkflow.isPending ? 'Saving...' : 'Save'}
          </Button>
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
