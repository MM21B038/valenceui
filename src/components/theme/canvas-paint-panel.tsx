import { Paintbrush, X } from 'lucide-react'

import { ComponentPaintPicker } from '@/components/theme/component-paint-picker'
import { PaintBrushVisual } from '@/components/theme/paint-brush-visual'
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
    isDragging,
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
    <div className="pointer-events-auto absolute top-3 right-3 z-30 w-[min(100vw-1.5rem,380px)]">
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
                Drag color from the wheel to canvas blocks
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setPanelOpen(false)}
            className="size-8 shrink-0 text-panel-muted hover:bg-panel-inspector hover:text-panel-fg"
            aria-label="Close paint panel"
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="space-y-3 px-4 py-3">
          <div
            className={cn(
              'relative overflow-hidden rounded-xl border px-3 py-3 transition-all duration-300',
              isPaintMode
                ? 'border-connector/50 bg-connector/10'
                : 'border-panel-border/60 bg-panel-inspector/40',
            )}
          >
            <div className="flex h-[88px] items-end justify-center gap-2">
              <div
                className={cn(
                  'relative flex size-[4.5rem] shrink-0 items-end justify-center rounded-full border-2 border-white/70 shadow-inner transition-all duration-500',
                  isPaintMode && 'scale-110 shadow-lg ring-2 ring-connector/30',
                )}
                style={
                  armedSwatch
                    ? swatchStyle(armedSwatch)
                    : { backgroundColor: 'var(--panel-border)' }
                }
              >
                {armedSwatch && (
                  <>
                    <div
                      className="absolute inset-x-2 bottom-1 h-2 rounded-full bg-black/10 blur-sm"
                      aria-hidden
                    />
                    {isPaintMode && (
                      <div
                        className="absolute inset-0 animate-ping rounded-full opacity-20"
                        style={swatchStyle(armedSwatch)}
                        aria-hidden
                      />
                    )}
                  </>
                )}
              </div>

              <div
                className={cn(
                  'relative flex h-full w-[5.5rem] items-end justify-center transition-all duration-500',
                  isPaintMode
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-3 opacity-40',
                )}
              >
                <PaintBrushVisual
                  swatch={armedSwatch}
                  size={80}
                  dipping={isPaintMode}
                  wet={isDragging}
                  className={cn(
                    'origin-bottom transition-transform duration-500',
                    isPaintMode && '-translate-x-10 -translate-y-1 rotate-[-24deg]',
                    isDragging && '-translate-x-12 -translate-y-3 scale-95 opacity-60',
                  )}
                />
              </div>
            </div>

            <div className="mt-3 text-center">
              {isDragging ? (
                <>
                  <p className="text-xs font-medium text-panel-fg">
                    Dragging paint…
                  </p>
                  <p className="text-[11px] text-panel-muted">
                    Drop on an LLM or Tool Server block
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-panel-fg">
                    No color loaded
                  </p>
                  <p className="text-[11px] text-panel-muted">
                    Press &amp; hold a swatch below to load the brush
                  </p>
                </>
              )}
            </div>

            {isPaintMode && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={cancelPaintMode}
                className="absolute top-2 right-2 h-7 border-panel-border text-[10px] text-panel-fg"
              >
                Cancel
              </Button>
            )}
          </div>

          <ol className="grid grid-cols-3 gap-1.5 text-[9px] text-panel-muted">
            <li className="flex flex-col items-center gap-1 rounded-lg bg-panel-inspector/30 px-1.5 py-2 text-center">
              <span className="flex size-5 items-center justify-center rounded-full bg-interactive text-[10px] font-bold text-interactive-fg">
                1
              </span>
              Hold swatch
            </li>
            <li className="flex flex-col items-center gap-1 rounded-lg bg-panel-inspector/30 px-1.5 py-2 text-center">
              <span className="flex size-5 items-center justify-center rounded-full bg-interactive text-[10px] font-bold text-interactive-fg">
                2
              </span>
              Drag to block
            </li>
            <li className="flex flex-col items-center gap-1 rounded-lg bg-panel-inspector/30 px-1.5 py-2 text-center">
              <span className="flex size-5 items-center justify-center rounded-full bg-interactive text-[10px] font-bold text-interactive-fg">
                3
              </span>
              Release to paint
            </li>
          </ol>

          <ComponentPaintPicker selectedId={armedSwatchId ?? undefined} />
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-panel-border/80 bg-panel-inspector/20 px-4 py-2.5">
          <p className="text-[10px] text-panel-muted">
            Paints all blocks of the same type
          </p>
          <div className="flex gap-1">
            {componentGradients.llm && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => clearComponentGradient('llm')}
                className="h-6 px-2 text-[10px] text-panel-muted hover:text-panel-fg"
              >
                Reset LLM
              </Button>
            )}
            {componentGradients.toolServer && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => clearComponentGradient('toolServer')}
                className="h-6 px-2 text-[10px] text-panel-muted hover:text-panel-fg"
              >
                Reset MCP
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
