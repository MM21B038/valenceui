import type { LucideIcon } from 'lucide-react'

import { usePaintMode } from '@/components/theme/paint-mode-provider'
import { useTheme } from '@/components/theme/theme-provider'
import { NodeHoverActions } from '@/features/canvas/nodes/node-hover-actions'
import { NodePorts } from '@/features/canvas/nodes/node-ports'
import type { ThemedComponentType } from '@/lib/theme/derive-component-tokens'
import {
  componentBlockChromeStyle,
  componentHexRingStyle,
  componentIconGradientStyle,
  componentSurfaceStyle,
  componentVar,
} from '@/lib/theme/component-block-styles'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

interface AgentBlockNodeProps {
  id: string
  selected?: boolean
  themeType: ThemedComponentType
  title: string
  Icon: LucideIcon
  primary?: string
  secondary?: string
  hasConfig: boolean
  onOpen: () => void
  shape?: 'circle' | 'rounded' | 'hex'
}

export function AgentBlockNode({
  id,
  selected,
  themeType,
  title,
  Icon,
  primary,
  secondary,
  hasConfig,
  onOpen,
  shape = 'rounded',
}: AgentBlockNodeProps) {
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode)
  const removeNode = useWorkflowStore((state) => state.removeNode)
  const { componentGradients } = useTheme()
  const { isPaintMode, hoverTarget, applyToComponent } = usePaintMode()
  const hasPaint = Boolean(componentGradients[themeType])

  const handleOpen = () => {
    if (isPaintMode) {
      applyToComponent(themeType)
      return
    }
    onOpen()
  }

  const chromeStyle = componentBlockChromeStyle(themeType, {
    selected: Boolean(selected),
    hasPaint,
  })

  return (
    <div
      className={cn(
        'group/node relative',
        shape === 'circle'
          ? 'size-[120px]'
          : shape === 'hex'
            ? 'h-[112px] w-[132px]'
            : 'h-[112px] w-[132px]',
      )}
    >
      <div className="absolute -inset-8 z-0" aria-hidden />
      <NodePorts nodeId={id} />
      <NodeHoverActions
        onDuplicate={(event) => {
          event.stopPropagation()
          duplicateNode(id)
        }}
        onRemove={(event) => {
          event.stopPropagation()
          removeNode(id)
        }}
      />
      <div
        role="button"
        tabIndex={0}
        data-paint-target={themeType}
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleOpen()
          }
        }}
        style={shape === 'hex' ? undefined : chromeStyle}
        className={cn(
          'paint-mode-target relative z-10 flex size-full flex-col items-center justify-center gap-1.5 p-2.5 text-center transition-all duration-150',
          shape === 'circle' && 'rounded-full shadow-md',
          shape === 'rounded' && 'rounded-2xl shadow-md',
          shape !== 'hex' && !hasPaint && !selected && 'border-2',
          shape !== 'hex' && !selected && 'hover:opacity-95',
          isPaintMode && 'paint-mode-armed',
          hoverTarget === themeType && 'paint-drop-target',
        )}
      >
        {shape === 'hex' ? (
          <>
            <div
              className="absolute inset-0 node-shape-hex transition-all duration-150"
              style={componentHexRingStyle(themeType, {
                selected: Boolean(selected),
                hasPaint,
              })}
              aria-hidden
            />
            <div
              className="absolute inset-[2.5px] node-shape-hex shadow-md transition-all duration-150"
              style={componentSurfaceStyle(themeType)}
              aria-hidden
            />
          </>
        ) : null}

        <div className="relative z-10 flex flex-col items-center gap-1.5">
          <div
            className={cn(
              'flex size-10 items-center justify-center shadow-sm',
              shape === 'circle' ? 'rounded-full' : 'rounded-lg',
            )}
            style={componentIconGradientStyle(themeType)}
          >
            <Icon className="size-[18px]" />
          </div>
          <div className="w-full min-w-0 px-2">
            {hasConfig ? (
              <>
                <p
                  className="truncate text-[11px] font-semibold leading-tight"
                  style={{ color: componentVar(themeType, 'foreground') }}
                >
                  {primary}
                </p>
                {secondary ? (
                  <p
                    className="mt-0.5 truncate text-[9px]"
                    style={{ color: componentVar(themeType, 'muted') }}
                  >
                    {secondary}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p
                  className="truncate text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: componentVar(themeType, 'label') }}
                >
                  {title}
                </p>
                <p
                  className="mt-0.5 text-[8px] leading-tight"
                  style={{ color: componentVar(themeType, 'muted') }}
                >
                  {isPaintMode ? 'Drop to paint' : 'Tap to configure'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
