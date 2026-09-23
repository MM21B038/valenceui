export const DUPLICATE_OFFSET = { x: 48, y: 48 }

export function offsetPosition(position: { x: number; y: number }) {
  return {
    x: position.x + DUPLICATE_OFFSET.x,
    y: position.y + DUPLICATE_OFFSET.y,
  }
}
