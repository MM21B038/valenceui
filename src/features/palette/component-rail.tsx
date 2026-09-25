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
import { cn } from '@/lib/utils'

const RAIL_ITEM_HEIGHT = 56
const RAIL_PADDING_TOP = 12

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
  const hasPaint = Boolean(componentGradients[component.type])
  const centerY =
    RAIL_PADDING_TOP + index * RAIL_ITEM_HEIGHT + RAIL_ITEM_HEIGHT / 2 - scrollTop
  const scale = getRailItemScale(centerY, pointerY)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${component.type}`,
    data: { type: component.type },
  })

  const isActive = isHovered && !isDragging

  return (
    <div className="group/rail-item relative flex h-14 items-center justify-center">
      <button
        ref={setNodeRef}
        type="button"
        style={{
          transform: `scale(${isDragging ? 1 : scale})`,
          ...(isActive ? componentSurfaceHoverStyle(component.type) : componentSurfaceStyle(component.type)),
          ...(isActive || hasPaint
            ? componentPaintBorderStyle(component.type)
            : componentBorderMutedStyle(component.type)),
        }}
        className={cn(
          'relative flex size-12 touch-none items-center justify-center rounded-2xl shadow-sm transition-[transform,opacity,box-shadow,border-color,background-color] duration-200 ease-out',
          !hasPaint && 'border',
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
          className="flex size-9 items-center justify-center rounded-xl"
          style={componentIconGradientStyle(component.type)}
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
