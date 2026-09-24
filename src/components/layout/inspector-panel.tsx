import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

interface InspectorPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  width?: number | string
  headerExtra?: React.ReactNode
  children: React.ReactNode
  bodyClassName?: string
  showBackdrop?: boolean
  asideClassName?: string
}

export function InspectorPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  width = 'var(--inspector-panel-width)',
  headerExtra,
  children,
  bodyClassName,
  showBackdrop = true,
  asideClassName,
}: InspectorPanelProps) {
  if (!isOpen) return null

  return (
    <>
      {showBackdrop ? (
        <button
          type="button"
          aria-label="Close panel"
          className="absolute inset-0 z-30 bg-black/20 transition-opacity duration-300"
          onClick={onClose}
        />
      ) : null}

      <aside
        style={{ width }}
        className={cn(
          '@container/inspector pointer-events-auto absolute top-3 bottom-3 right-3 flex max-w-[calc(100vw-4.5rem)] flex-col overflow-hidden rounded-2xl border border-panel-border bg-panel-inspector/95 text-panel-inspector-fg shadow-lg backdrop-blur-sm',
          showBackdrop ? 'z-40' : 'z-[60]',
          'animate-in fade-in slide-in-from-right-4 duration-300 ease-out',
          asideClassName,
        )}
      >
        <div className="border-b border-panel-border px-4 py-3 @md/inspector:px-5 @md/inspector:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold @md/inspector:text-base">{title}</p>
              {subtitle ? (
                <p className="truncate text-xs text-panel-muted @md/inspector:text-sm">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-panel-muted transition-colors hover:bg-node hover:text-panel-inspector-fg @md/inspector:size-8"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          {headerExtra}
        </div>

        <div className={cn('scrollbar-hidden min-h-0 flex-1 px-3 py-3 @md/inspector:px-4 @md/inspector:py-4', bodyClassName)}>
          {children}
        </div>
      </aside>
    </>
  )
}
