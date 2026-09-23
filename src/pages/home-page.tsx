import { ArrowRight, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { brand, colorRoles } from '@/lib/theme/brand'

const rolePreview = [
  { label: 'Header', className: 'bg-chrome text-chrome-fg' },
  { label: 'Canvas', className: 'bg-workspace text-foreground' },
  { label: 'Controls', className: 'bg-node text-node-fg border border-border' },
  { label: 'Connectors', className: 'bg-connector text-node-fg' },
] as const

export function HomePage() {
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
          <ThemeToggle />
          <Button
            className="bg-interactive text-interactive-fg hover:bg-interactive/90"
            asChild
          >
            <Link to="/editor">Open Editor</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Brand colors
            </p>
            <div className="flex gap-2">
              {Object.entries(brand).map(([name, hex]) => (
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
          Canvas-first AI workflow builder
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          Build intelligent workflows with drag-and-drop components
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Four brand colors map to specific UI roles —{' '}
          {Object.keys(colorRoles).join(', ')} — so every surface has a clear
          purpose.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            size="lg"
            className="bg-interactive text-interactive-fg hover:bg-interactive/90"
            asChild
          >
            <Link to="/editor">
              Start building
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="https://reactflow.dev" target="_blank" rel="noreferrer">
              React Flow docs
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}
