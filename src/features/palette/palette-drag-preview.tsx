import {
  getPaletteComponent,
  type ComponentType,
} from '@/features/palette/component-registry'
import { useTheme } from '@/components/theme/theme-provider'
import {
  componentBlockChromeStyle,
  componentIconGradientStyle,
} from '@/lib/theme/component-block-styles'
import type { ThemedComponentType } from '@/lib/theme/derive-component-tokens'
import { cn } from '@/lib/utils'

interface PaletteDragPreviewProps {
  type: ComponentType
  className?: string
}

type PaletteThemedType = Extract<ComponentType, ThemedComponentType>

function isThemedType(type: ComponentType): type is PaletteThemedType {
  return (
    type === 'llm' ||
    type === 'toolServer' ||
    type === 'threadConfig' ||
    type === 'agentSkill' ||
    type === 'agentInterface' ||
    type === 'agentCard' ||
    type === 'agentExecutor'
  )
}

export function PaletteDragPreview({ type, className }: PaletteDragPreviewProps) {
  const component = getPaletteComponent(type)
  const Icon = component.icon
  const { componentGradients } = useTheme()
  const themedType = isThemedType(type) ? type : null
  const hasPaint = themedType
    ? Boolean(componentGradients[themedType])
    : false

  return (
    <div
      className={cn(
        'pointer-events-none flex size-12 cursor-grabbing items-center justify-center rounded-2xl border border-panel-border bg-node shadow-xl',
        className,
      )}
      style={
        themedType
          ? componentBlockChromeStyle(themedType, { hasPaint })
          : undefined
      }
    >
      <div
        className={cn(
          'flex size-9 items-center justify-center rounded-xl',
          !themedType &&
            'bg-gradient-to-br from-interactive/90 to-connector text-node-icon-fg',
        )}
        style={
          themedType ? componentIconGradientStyle(themedType) : undefined
        }
      >
        <Icon className="size-4" />
      </div>
    </div>
  )
}
