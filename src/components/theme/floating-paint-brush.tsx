import { createPortal } from 'react-dom'

import { PaintBrushVisual } from '@/components/theme/paint-brush-visual'
import { usePaintMode } from '@/components/theme/paint-mode-provider'
import {
  getBrushTransformFromTip,
  getFloatingBrushRotation,
} from '@/lib/theme/paint-brush-geometry'
import { findPaintSwatch, swatchStyle } from '@/lib/theme/paint-palette'

const BRUSH_SIZE = 68

export function FloatingPaintBrush() {
  const { isDragging, hoverTarget, armedSwatchId, brushPosition } =
    usePaintMode()

  const swatch = findPaintSwatch(armedSwatchId ?? undefined)

  if (!isDragging || !brushPosition || !swatch) return null

  const overTarget = Boolean(hoverTarget)
  const rotation = getFloatingBrushRotation(isDragging, overTarget)
  const scale = 1.05
  const brushStyle = getBrushTransformFromTip(
    brushPosition.x,
    brushPosition.y,
    BRUSH_SIZE,
    rotation,
    scale,
  )

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden>
      {overTarget && (
        <div
          className="absolute size-20 animate-ping rounded-full opacity-25"
          style={{
            left: brushPosition.x,
            top: brushPosition.y,
            transform: 'translate(-50%, -50%)',
            ...swatchStyle(swatch),
          }}
        />
      )}

      <div
        className="absolute will-change-transform"
        style={{
          ...brushStyle,
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.28))',
        }}
      >
        <PaintBrushVisual
          swatch={swatch}
          size={BRUSH_SIZE}
          dipping
          wet
        />
      </div>
    </div>,
    document.body,
  )
}
