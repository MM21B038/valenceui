import { useCallback, useState, type PointerEvent } from 'react'

/** Dock-style scale based on pointer distance from item center. */
export function getRailItemScale(
  itemCenterY: number,
  pointerY: number | null,
): number {
  if (pointerY === null) return 1

  const distance = Math.abs(pointerY - itemCenterY)

  if (distance < 24) return 1.24
  if (distance < 48) return 1.12
  if (distance < 72) return 1.02
  if (distance < 110) return 0.96
  return 0.9
}

export function useRailMagnification() {
  const [pointerY, setPointerY] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setPointerY(event.clientY - rect.top)
  }, [])

  const onPointerLeave = useCallback(() => {
    setPointerY(null)
    setHoveredId(null)
  }, [])

  return {
    pointerY,
    hoveredId,
    setHoveredId,
    onPointerMove,
    onPointerLeave,
  }
}
