import { useId } from 'react'

import type { PaintSwatch } from '@/lib/theme/paint-palette'
import { isSolidSwatch, swatchStyle } from '@/lib/theme/paint-palette'
import { cn } from '@/lib/utils'

interface PaintBrushVisualProps {
  swatch?: PaintSwatch
  size?: number
  dipping?: boolean
  wet?: boolean
  className?: string
}

export function PaintBrushVisual({
  swatch,
  size = 56,
  dipping = false,
  wet = false,
  className,
}: PaintBrushVisualProps) {
  const uid = useId().replace(/:/g, '')
  const colorFrom = swatch?.from ?? '#94a3b8'
  const colorTo = swatch?.to ?? colorFrom
  const isSolid = swatch ? isSolidSwatch(swatch) : true
  const bristleId = `brush-bristle-${uid}`
  const handleId = `brush-handle-${uid}`

  return (
    <div
      className={cn(
        'relative transition-transform duration-500 ease-out',
        dipping && 'translate-y-1 scale-105',
        wet && 'animate-[brush-wiggle_0.35s_ease-in-out_infinite]',
        className,
      )}
      style={{ width: size * 0.55, height: size }}
    >
      <svg
        viewBox="0 0 48 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full drop-shadow-md"
        aria-hidden
      >
        <defs>
          <linearGradient id={bristleId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
          <linearGradient id={handleId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c4a882" />
            <stop offset="100%" stopColor="#8b6914" />
          </linearGradient>
        </defs>

        <g transform="rotate(-12 24 40)">
          <rect x="20" y="4" width="8" height="36" rx="3" fill={`url(#${handleId})`} />
          <rect x="18" y="38" width="12" height="5" rx="1" fill="#b8b8b8" />
          <path
            d="M14 43 C14 43, 16 72, 24 76 C32 72, 34 43, 34 43 Z"
            fill={`url(#${bristleId})`}
          />
          {!isSolid && (
            <path
              d="M16 50 C18 58, 22 64, 24 66 C26 64, 30 58, 32 50"
              stroke={colorTo}
              strokeWidth="1.5"
              strokeOpacity="0.5"
              fill="none"
            />
          )}
        </g>
      </svg>

      {dipping && swatch && (
        <div
          className="absolute -bottom-1 left-1/2 size-3 -translate-x-1/2 animate-ping rounded-full opacity-60"
          style={swatchStyle(swatch)}
        />
      )}
    </div>
  )
}
