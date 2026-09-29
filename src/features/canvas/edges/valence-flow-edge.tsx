import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  type ConnectionLineComponentProps,
  type EdgeProps,
} from '@xyflow/react'
import { Scissors } from 'lucide-react'
import { useState, type MouseEvent } from 'react'

import { componentVar } from '@/lib/theme/component-block-styles'
import type { ThemedComponentType } from '@/lib/theme/derive-component-tokens'
import { THEMED_COMPONENT_TYPES } from '@/lib/theme/derive-component-tokens'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

function isThemedType(type: string | undefined): type is ThemedComponentType {
  return (
    !!type &&
    (THEMED_COMPONENT_TYPES as readonly string[]).includes(type)
  )
}

function accentForType(type: string | undefined) {
  if (isThemedType(type)) return componentVar(type, 'border')
  return 'var(--connector)'
}

function FlowGradient({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  from,
  to,
}: {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  from: string
  to: string
}) {
  return (
    <linearGradient
      id={id}
      gradientUnits="userSpaceOnUse"
      x1={sourceX}
      y1={sourceY}
      x2={targetX}
      y2={targetY}
    >
      <stop offset="0%" stopColor={from} />
      <stop offset="28%" stopColor={`color-mix(in oklch, ${from} 78%, ${to})`} />
      <stop
        offset="50%"
        stopColor={`color-mix(in oklch, ${from} 50%, ${to})`}
      />
      <stop offset="72%" stopColor={`color-mix(in oklch, ${to} 78%, ${from})`} />
      <stop offset="100%" stopColor={to} />
    </linearGradient>
  )
}

const CUT_MS = 480

export function ValenceFlowEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange)

  const [hovered, setHovered] = useState(false)
  const [cutting, setCutting] = useState(false)

  const from = accentForType(sourceNode?.type)
  const to = accentForType(targetNode?.type)
  const gradientId = `valence-flow-${id}`

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const showScissors = hovered || selected || cutting

  const handleCut = (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    if (cutting) return

    setCutting(true)
    window.setTimeout(() => {
      onEdgesChange([{ type: 'remove', id }])
    }, CUT_MS)
  }

  return (
    <>
      <defs>
        <FlowGradient
          id={gradientId}
          sourceX={sourceX}
          sourceY={sourceY}
          targetX={targetX}
          targetY={targetY}
          from={from}
          to={to}
        />
      </defs>

      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(cutting && 'valence-flow-edge-cutting')}
      >
        {/* Wide invisible hit target for easier hover */}
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth={28}
          className="react-flow__edge-interaction"
        />

        <BaseEdge
          id={`${id}-glow`}
          path={path}
          className="valence-flow-edge-break"
          style={{
            stroke: `url(#${gradientId})`,
            strokeWidth: selected || hovered ? 5 : 4,
            opacity: cutting ? 0 : selected || hovered ? 0.2 : 0.12,
            pointerEvents: 'none',
            transition: 'opacity 180ms ease',
          }}
        />

        {!cutting ? (
          <BaseEdge
            id={id}
            path={path}
            className="valence-flow-edge-path valence-flow-edge-break"
            style={{
              stroke: `url(#${gradientId})`,
              strokeWidth: selected || hovered ? 2.75 : 2.25,
              strokeLinecap: 'round',
              opacity: 0.95,
            }}
          />
        ) : (
          <>
            <path
              d={path}
              pathLength={1}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={2.5}
              strokeLinecap="round"
              className="valence-flow-edge-retract-source"
            />
            <path
              d={path}
              pathLength={1}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={2.5}
              strokeLinecap="round"
              className="valence-flow-edge-retract-target"
            />
            <path
              d={path}
              pathLength={1}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={7}
              strokeLinecap="round"
              opacity={0.18}
              className="valence-flow-edge-retract-source"
              style={{ pointerEvents: 'none' }}
            />
            <path
              d={path}
              pathLength={1}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={7}
              strokeLinecap="round"
              opacity={0.18}
              className="valence-flow-edge-retract-target"
              style={{ pointerEvents: 'none' }}
            />
          </>
        )}
      </g>

      <EdgeLabelRenderer>
        <div
          className={cn(
            'nodrag nopan pointer-events-auto absolute',
            showScissors ? 'z-20' : 'z-0',
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            type="button"
            aria-label="Cut connection"
            onClick={handleCut}
            className={cn(
              'valence-cut-btn group relative flex size-8 items-center justify-center rounded-full border border-panel-border bg-panel/95 text-panel-muted shadow-lg backdrop-blur-sm transition-all duration-200',
              'hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40',
              cutting && 'valence-cut-btn-snipping pointer-events-none',
              showScissors
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-75 opacity-0',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'valence-cut-flash pointer-events-none absolute inset-0 rounded-full',
                cutting && 'valence-cut-flash-active',
              )}
            />
            <Scissors
              className={cn(
                'size-3.5 transition-transform duration-200',
                'group-hover:rotate-[-18deg]',
                cutting && 'valence-cut-scissors',
              )}
              strokeWidth={2.25}
            />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

/** Live drag preview — same source→cursor color blend. */
export function ValenceFlowConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  fromNode,
}: ConnectionLineComponentProps) {
  const from = accentForType(fromNode?.type)
  const to = 'var(--connector)'
  const gradientId = 'valence-flow-connection-line'

  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    sourcePosition: fromPosition,
    targetPosition: toPosition,
  })

  return (
    <g>
      <defs>
        <FlowGradient
          id={gradientId}
          sourceX={fromX}
          sourceY={fromY}
          targetX={toX}
          targetY={toY}
          from={from}
          to={to}
        />
      </defs>
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={4}
        strokeLinecap="round"
        strokeOpacity={0.14}
        className="valence-flow-edge-break"
      />
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeOpacity={0.95}
        className="valence-flow-edge-break"
      />
    </g>
  )
}
