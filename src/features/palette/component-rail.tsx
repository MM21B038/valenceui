import { useDraggable } from '@dnd-kit/core'
import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  componentBlockChromeStyle,
  componentIconGradientStyle,
} from '@/lib/theme/component-block-styles'
import type { ThemedComponentType } from '@/lib/theme/derive-component-tokens'
import { useWorkflowStore } from '@/stores/workflow-store'
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

function RailTooltip({
  component,
  anchor,
  visible,
}: {
  component: PaletteComponent
  anchor: DOMRect | null
  visible: boolean
}) {
  if (!anchor || typeof document === 'undefined') return null

  const top = anchor.top + anchor.height / 2
  const left = anchor.right + 14

  return createPortal(
    <div
      role="tooltip"
      className={cn(
        'pointer-events-none fixed z-[80] max-w-[220px] -translate-y-1/2 transition-all duration-200 ease-out',
        visible
          ? 'translate-x-0 opacity-100'
          : 'pointer-events-none -translate-x-1 opacity-0',
      )}
      style={{ top, left }}
    >
      <div className="relative rounded-xl border border-panel-border bg-panel/95 px-3 py-2 shadow-xl backdrop-blur-md">
        <span
          aria-hidden
          className="absolute top-1/2 left-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-l border-panel-border bg-panel/95"
        />
        <p className="text-[12px] font-semibold tracking-tight text-panel-fg">
          {component.label}
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-panel-muted">
          {component.description}
        </p>
      </div>
    </div>,
    document.body,
  )
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
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
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

  const setRefs = (node: HTMLButtonElement | null) => {
    buttonRef.current = node
    setNodeRef(node)
  }

  const isActive = isHovered && !isDragging

  useLayoutEffect(() => {
    if (!isActive) {
      setAnchor(null)
      return
    }
    const update = () => {
      if (buttonRef.current) {
        setAnchor(buttonRef.current.getBoundingClientRect())
      }
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [isActive, scale, scrollTop, pointerY])

  const themedStyle = themedType
    ? componentBlockChromeStyle(themedType, {
        hasPaint,
        hovered: isActive,
      })
    : undefined

  return (
    <div className="group/rail-item relative flex h-14 items-center justify-center">
      <button
        ref={setRefs}
        type="button"
        style={{
          transform: `scale(${isDragging ? 1 : scale})`,
          ...themedStyle,
        }}
        className={cn(
          'relative flex size-12 touch-none items-center justify-center rounded-2xl shadow-sm transition-[transform,opacity,box-shadow,border-color,background-color] duration-200 ease-out',
          !themedType && 'border border-panel-border bg-node',
          !themedType && isActive && 'border-connector bg-node-header',
          themedType && !hasPaint && !isActive && 'border',
          'hover:shadow-md',
          'active:cursor-grabbing',
          isDragging ? 'cursor-grabbing opacity-40' : 'cursor-grab',
        )}
        onPointerEnter={() => onHover(component.type)}
        onPointerLeave={() => onHover(null)}
        aria-label={component.label}
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

      <RailTooltip
        component={component}
        anchor={anchor}
        visible={isActive && Boolean(anchor)}
      />
    </div>
  )
}

export function ComponentRail() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const workspaceType = useWorkflowStore((state) => state.workspaceType)
  const {
    pointerY,
    hoveredId,
    setHoveredId,
    onPointerMove,
    onPointerLeave,
  } = useRailMagnification()

  const components =
    workspaceType === 'a2a'
      ? PALETTE_COMPONENTS.filter((item) => item.type === 'agentExecutor')
      : PALETTE_COMPONENTS

  const handleScroll = () => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop)
    }
  }

  return (
    <aside
      className="pointer-events-auto absolute top-8 bottom-8 left-3 z-20 flex w-[68px] flex-col rounded-2xl border border-panel-border bg-panel/95 shadow-lg backdrop-blur-sm"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 [scrollbar-width:thin]"
      >
        {components.map((component, index) => (
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
