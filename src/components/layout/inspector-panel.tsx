import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

interface InspectorPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  width?: number
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
  width = 260,
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
          'pointer-events-auto absolute top-3 bottom-3 right-3 flex flex-col overflow-hidden rounded-2xl border border-panel-border bg-panel-inspector/95 text-panel-inspector-fg shadow-lg backdrop-blur-sm',
          showBackdrop ? 'z-40' : 'z-[60]',
          'animate-in fade-in slide-in-from-right-4 duration-300 ease-out',
          asideClassName,
        )}
      >
        <div className="border-b border-panel-border px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{title}</p>
              {subtitle ? (
                <p className="truncate text-[10px] text-panel-muted">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-panel-muted transition-colors hover:bg-node hover:text-panel-inspector-fg"
              aria-label="Close"
            >
              <X className="size-3.5" />
            </button>
          </div>
          {headerExtra}
        </div>

        <div className={cn('scrollbar-hidden min-h-0 flex-1 px-2 py-2', bodyClassName)}>
          {children}
        </div>
      </aside>
    </>
  )
}
