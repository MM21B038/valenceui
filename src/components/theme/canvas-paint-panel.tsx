import { Paintbrush, X } from 'lucide-react'

import { ComponentPaintPicker } from '@/components/theme/component-paint-picker'
import { usePaintMode } from '@/components/theme/paint-mode-provider'
import { useTheme } from '@/components/theme/theme-provider'
import { Button } from '@/components/ui/button'
import {
  findPaintSwatch,
  swatchStyle,
} from '@/lib/theme/paint-palette'
import { cn } from '@/lib/utils'

export function CanvasPaintPanel() {
  const {
    isPanelOpen,
    setPanelOpen,
    armedSwatchId,
    cancelPaintMode,
    isPaintMode,
  } = usePaintMode()
  const { componentGradients, clearComponentGradient } = useTheme()

  const armedSwatch = findPaintSwatch(armedSwatchId ?? undefined)

  if (!isPanelOpen) {
    return (
      <div className="pointer-events-auto absolute top-3 right-3 z-30">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setPanelOpen(true)}
          className={cn(
            'size-10 rounded-xl border-panel-border bg-panel/95 text-panel-fg shadow-lg backdrop-blur-sm hover:bg-panel hover:text-panel-fg',
            isPaintMode && 'border-connector ring-2 ring-connector/30',
          )}
          aria-label="Open paint panel"
        >
          <Paintbrush className="size-4" />
          {isPaintMode && armedSwatch && (
            <span
              className="absolute -top-0.5 -right-0.5 size-3 rounded-full ring-2 ring-panel"
              style={swatchStyle(armedSwatch)}
            />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="pointer-events-auto absolute top-3 right-3 z-30 w-[min(100vw-1.5rem,500px)]">
      <div className="overflow-hidden rounded-2xl border border-panel-border bg-panel/95 shadow-2xl backdrop-blur-md">
        <header className="flex items-start justify-between gap-3 border-b border-panel-border/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-interactive text-interactive-fg">
              <Paintbrush className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-panel-fg">
                Component Paint
              </h2>
              <p className="text-[11px] text-panel-muted">
                Hold a swatch and drag onto a canvas block
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {isPaintMode ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={cancelPaintMode}
                className="h-8 border-panel-border px-2 text-[10px] text-panel-fg"
              >
                Cancel
              </Button>
            ) : null}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setPanelOpen(false)}
              className="size-8 text-panel-muted hover:bg-panel-inspector hover:text-panel-fg"
              aria-label="Close paint panel"
            >
              <X className="size-4" />
            </Button>
          </div>
        </header>

        <div className="px-3 py-3">
          <ComponentPaintPicker selectedId={armedSwatchId ?? undefined} />
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-panel-border/80 bg-panel-inspector/20 px-4 py-2.5">
          <p className="text-[10px] text-panel-muted">
            Paints all blocks of the same type
          </p>
          <div className="flex max-w-[60%] flex-wrap justify-end gap-1">
            {(
              [
                ['llm', 'Reset LLM'],
                ['toolServer', 'Reset MCP'],
                ['threadConfig', 'Reset Thread'],
                ['serverStack', 'Reset Stack'],
                ['agentSkill', 'Reset Skill'],
                ['agentInterface', 'Reset Interface'],
                ['agentCard', 'Reset Card'],
                ['agentExecutor', 'Reset Executor'],
                ['skillStack', 'Reset Skill Stack'],
                ['interfaceStack', 'Reset Iface Stack'],
              ] as const
            )
              .filter(([key]) => componentGradients[key])
              .map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => clearComponentGradient(key)}
                  className="h-6 px-2 text-[10px] text-panel-muted hover:text-panel-fg"
                >
                  {label}
                </Button>
              ))}
          </div>
        </footer>
      </div>
    </div>
  )
}
