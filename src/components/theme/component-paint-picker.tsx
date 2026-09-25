import { useState } from 'react'

import { usePaintMode } from '@/components/theme/paint-mode-provider'
import {
  getPaintRings,
  type PaintSwatch,
  type PaintSwatchFilter,
  swatchStyle,
} from '@/lib/theme/paint-palette'
import { cn } from '@/lib/utils'

const DISC_SIZE = 300
const CENTER = DISC_SIZE / 2

const FILTERS: { id: PaintSwatchFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'solid', label: 'Solids' },
  { id: 'gradient', label: 'Gradients' },
]

interface ComponentPaintPickerProps {
  selectedId?: string
  className?: string
}

function PaintSwatchButton({
  swatch,
  size,
  x,
  y,
  selected,
}: {
  swatch: PaintSwatch
  size: number
  x: number
  y: number
  selected: boolean
}) {
  const { beginDrag, endDrag, updateBrushPosition } = usePaintMode()

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    beginDrag(swatch.id, event.clientX, event.clientY)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.buttons === 0) return
    updateBrushPosition(event.clientX, event.clientY)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    endDrag(event.clientX, event.clientY)
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    endDrag(event.clientX, event.clientY)
  }

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      aria-label={`Paint color ${swatch.id}`}
      aria-pressed={selected}
      title="Press & drag to paint"
      className={cn(
        'absolute touch-none rounded-full border-2 border-white/90 shadow-sm transition-transform hover:z-10 hover:scale-125 active:scale-110',
        selected && 'z-20 scale-125 ring-2 ring-foreground ring-offset-1 ring-offset-popover',
      )}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        ...swatchStyle(swatch),
      }}
    />
  )
}

export function ComponentPaintPicker({
  selectedId,
  className,
}: ComponentPaintPickerProps) {
  const [filter, setFilter] = useState<PaintSwatchFilter>('all')
  const rings = getPaintRings(filter)
  const visibleCount = rings.reduce(
    (total, ring) => total + ring.swatches.length,
    0,
  )

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              'flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
              filter === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-center text-[9px] text-muted-foreground">
        Press a swatch and drag to a block — release elsewhere to cancel
      </p>

      <div
        className="relative mx-auto rounded-full border border-border/60 bg-muted/30"
        style={{ width: DISC_SIZE, height: DISC_SIZE }}
        role="listbox"
        aria-label="Paint colors and gradients"
      >
        {[52, 96, 140].map((inset) => (
          <div
            key={inset}
            className="pointer-events-none absolute rounded-full border border-border/25"
            style={{ inset: `${inset / 6}%` }}
            aria-hidden
          />
        ))}

        {rings.map((ring) =>
          ring.swatches.map((swatch, index) => {
            const angle = (index / ring.swatches.length) * Math.PI * 2 - Math.PI / 2
            const x = CENTER + Math.cos(angle) * ring.radius - ring.swatchSize / 2
            const y = CENTER + Math.sin(angle) * ring.radius - ring.swatchSize / 2

            return (
              <PaintSwatchButton
                key={swatch.id}
                swatch={swatch}
                size={ring.swatchSize}
                x={x}
                y={y}
                selected={selectedId === swatch.id}
              />
            )
          }),
        )}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[10px] font-semibold text-foreground">
              {visibleCount}
            </p>
            <p className="text-[8px] text-muted-foreground">colors</p>
          </div>
        </div>
      </div>
    </div>
  )
}
