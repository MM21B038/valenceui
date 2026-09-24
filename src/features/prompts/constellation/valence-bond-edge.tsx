import {
  BaseEdge,
  type EdgeProps,
  getBezierPath,
} from '@xyflow/react'

export function ValenceBondEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const highlighted = Boolean(data?.highlighted)

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: highlighted ? 'var(--interactive)' : 'var(--connector)',
          strokeWidth: highlighted ? 2.5 : 1.5,
          strokeDasharray: highlighted ? undefined : '6 4',
          opacity: highlighted ? 0.95 : 0.45,
        }}
      />
      {highlighted ? (
        <BaseEdge
          id={`${id}-glow`}
          path={path}
          style={{
            stroke: 'var(--connector)',
            strokeWidth: 6,
            opacity: 0.12,
          }}
        />
      ) : null}
    </>
  )
}
