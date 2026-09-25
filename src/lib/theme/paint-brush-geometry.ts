/** Bristle tip in SVG viewBox coords (includes inner −12° group rotation). */
const BRISTLE_TIP_VIEWBOX_X = 31.48
const BRISTLE_TIP_VIEWBOX_Y = 75.22
const VIEWBOX_WIDTH = 48
const VIEWBOX_HEIGHT = 80

export function getBristleTipOffset(size: number) {
  const width = size * 0.55
  return {
    x: (BRISTLE_TIP_VIEWBOX_X / VIEWBOX_WIDTH) * width,
    y: (BRISTLE_TIP_VIEWBOX_Y / VIEWBOX_HEIGHT) * size,
  }
}

export function getBrushTransformFromTip(
  tipX: number,
  tipY: number,
  size: number,
  rotation: number,
  scale = 1,
) {
  const tip = getBristleTipOffset(size)
  return {
    left: tipX,
    top: tipY,
    transform: `translate(-${tip.x * scale}px, -${tip.y * scale}px) rotate(${rotation}deg) scale(${scale})`,
  }
}

export function getFloatingBrushRotation(
  isDragging: boolean,
  overTarget: boolean,
) {
  if (!isDragging) return -20
  return overTarget ? -4 : -10
}
