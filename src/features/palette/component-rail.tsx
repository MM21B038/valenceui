import { useDraggable } from '@dnd-kit/core'
import { useRef, useState } from 'react'

import { useTheme } from '@/components/theme/theme-provider'
import {
  PALETTE_COMPONENTS,
  type PaletteComponent,
} from '@/features/palette/component-registry'
import {
  getRailItemScale,
  useRailMagnification,
} from '@/features/palette/use-rail-magnification'
import {
  componentBorderMutedStyle,
  componentPaintBorderStyle,
  componentIconGradientStyle,
  componentSurfaceHoverStyle,
  componentSurfaceStyle,
} from '@/lib/theme/component-block-styles'
import type { ThemedComponentType } from '@/lib/theme/derive-component-tokens'
import { cn } from '@/lib/utils'

const RAIL_ITEM_HEIGHT = 56
const RAIL_PADDING_TOP = 12

type PaletteThemedType = Extract<
  PaletteComponent['type'],
  ThemedComponentType
>

function isThemedType(
  type: PaletteComponent['type'],
): type is PaletteThemedType {
  return type === 'llm' || type === 'toolServer' || type === 'threadConfig'
}

function RailItem({
  component,
  index,
  pointerY,
  scrollTop,
  isHovered,
  onHover,
}: {
  component: PaletteComponent
  index: number
  pointerY: number | null
  scrollTop: number
  isHovered: boolean
  onHover: (id: string | null) => void
}) {
  const Icon = component.icon
  const { componentGradients } = useTheme()
  const themedType = isThemedType(component.type) ? component.type : null
  const hasPaint = themedType
    ? Boolean(componentGradients[themedType])
    : false
  const centerY =
    RAIL_PADDING_TOP + index * RAIL_ITEM_HEIGHT + RAIL_ITEM_HEIGHT / 2 - scrollTop
  const scale = getRailItemScale(centerY, pointerY)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${component.type}`,
    data: { type: component.type },
  })

  const isActive = isHovered && !isDragging

  const themedStyle = themedType
    ? {
        ...(isActive
          ? componentSurfaceHoverStyle(themedType)
          : componentSurfaceStyle(themedType)),
        ...(isActive || hasPaint
          ? componentPaintBorderStyle(themedType)
          : componentBorderMutedStyle(themedType)),
      }
    : undefined

  return (
    <div className="group/rail-item relative flex h-14 items-center justify-center">
      <button
        ref={setNodeRef}
        type="button"
        style={{
          transform: `scale(${isDragging ? 1 : scale})`,
          ...themedStyle,
        }}
        className={cn(
          'relative flex size-12 touch-none items-center justify-center rounded-2xl shadow-sm transition-[transform,opacity,box-shadow,border-color,background-color] duration-200 ease-out',
          !themedType && 'border border-panel-border bg-node',
          !themedType && isActive && 'border-connector bg-node-header',
          themedType && !hasPaint && 'border',
          'hover:shadow-md',
          'active:cursor-grabbing',
          isDragging ? 'cursor-grabbing opacity-40' : 'cursor-grab',
        )}
        onPointerEnter={() => onHover(component.type)}
        onPointerLeave={() => onHover(null)}
        {...listeners}
        {...attributes}
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
      </button>

      <div
        className={cn(
          'pointer-events-none absolute left-[calc(100%+12px)] z-30 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md transition-all duration-200',
          isActive ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0',
        )}
      >
        {component.label}
      </div>
    </div>
  )
}

export function ComponentRail() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const {
    pointerY,
    hoveredId,
    setHoveredId,
    onPointerMove,
    onPointerLeave,
  } = useRailMagnification()

  const handleScroll = () => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop)
    }
  }

  return (
    <aside
      className="pointer-events-auto absolute top-3 bottom-3 left-3 z-20 flex w-[68px] flex-col rounded-2xl border border-panel-border bg-panel/95 shadow-lg backdrop-blur-sm"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 [scrollbar-width:thin]"
      >
        {PALETTE_COMPONENTS.map((component, index) => (
          <RailItem
            key={component.type}
            component={component}
            index={index}
            pointerY={pointerY}
            scrollTop={scrollTop}
            isHovered={hoveredId === component.type}
            onHover={setHoveredId}
          />
        ))}
      </div>
    </aside>
  )
}
