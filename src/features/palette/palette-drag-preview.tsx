import {
  getPaletteComponent,
  type ComponentType,
} from '@/features/palette/component-registry'
import { cn } from '@/lib/utils'

interface PaletteDragPreviewProps {
  type: ComponentType
  className?: string
}

export function PaletteDragPreview({ type, className }: PaletteDragPreviewProps) {
  const component = getPaletteComponent(type)
  const Icon = component.icon

  return (
    <div
      className={cn(
        'pointer-events-none flex size-12 cursor-grabbing items-center justify-center rounded-2xl border-2 border-connector bg-node shadow-xl ring-2 ring-connector/25',
        className,
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-xl bg-node-icon">
        <Icon className="size-4 text-node-icon-fg" />
      </div>
    </div>
  )
}
