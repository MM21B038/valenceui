import {
  getPaletteComponent,
  type ComponentType,
} from '@/features/palette/component-registry'
import { useTheme } from '@/components/theme/theme-provider'
import {
  componentIconGradientStyle,
  componentPaintBorderStyle,
  componentSurfaceStyle,
} from '@/lib/theme/component-block-styles'
import { cn } from '@/lib/utils'

interface PaletteDragPreviewProps {
  type: ComponentType
  className?: string
}

export function PaletteDragPreview({ type, className }: PaletteDragPreviewProps) {
  const component = getPaletteComponent(type)
  const Icon = component.icon
  const { componentGradients } = useTheme()
  const hasPaint = Boolean(componentGradients[type])

  return (
    <div
      className={cn(
        'pointer-events-none flex size-12 cursor-grabbing items-center justify-center rounded-2xl shadow-xl',
        className,
      )}
      style={{
        ...componentSurfaceStyle(type),
        ...(hasPaint ? componentPaintBorderStyle(type) : {}),
      }}
    >
      <div
        className="flex size-9 items-center justify-center rounded-xl"
        style={componentIconGradientStyle(type)}
      >
        <Icon className="size-4" />
      </div>
    </div>
  )
}
