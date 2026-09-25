import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useTheme } from '@/components/theme/theme-provider'
import type { ComponentColorTarget } from '@/lib/theme/brand'

export interface BrushPosition {
  x: number
  y: number
}

interface PaintModeContextValue {
  isPanelOpen: boolean
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
  armedSwatchId: string | null
  cancelPaintMode: () => void
  isPaintMode: boolean
  isDragging: boolean
  hoverTarget: ComponentColorTarget | null
  brushPosition: BrushPosition | null
  beginDrag: (swatchId: string, x: number, y: number) => void
  updateBrushPosition: (x: number, y: number) => void
  endDrag: (x: number, y: number) => void
  applyToComponent: (target: ComponentColorTarget) => void
}

const PaintModeContext = createContext<PaintModeContextValue | null>(null)

function findPaintTargetAt(x: number, y: number): ComponentColorTarget | null {
  const element = document.elementFromPoint(x, y)
  const target = element?.closest('[data-paint-target]')
  if (!target) return null
  const type = target.getAttribute('data-paint-target')
  if (type === 'llm' || type === 'toolServer') return type
  return null
}

export function PaintModeProvider({ children }: { children: React.ReactNode }) {
  const { setComponentGradient } = useTheme()
  const [isPanelOpen, setPanelOpen] = useState(false)
  const [armedSwatchId, setArmedSwatchId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [brushPosition, setBrushPosition] = useState<BrushPosition | null>(null)
  const [hoverTarget, setHoverTarget] = useState<ComponentColorTarget | null>(null)

  const isDraggingRef = useRef(false)
  const armedRef = useRef<string | null>(null)

  const isPaintMode = isDragging

  const beginDrag = useCallback((swatchId: string, x: number, y: number) => {
    const pos = { x, y }
    armedRef.current = swatchId
    isDraggingRef.current = true
    setArmedSwatchId(swatchId)
    setIsDragging(true)
    setBrushPosition(pos)
  }, [])

  const updateBrushPosition = useCallback((x: number, y: number) => {
    if (!isDraggingRef.current) return
    setBrushPosition({ x, y })
    setHoverTarget(findPaintTargetAt(x, y))
  }, [])

  const cancelPaintMode = useCallback(() => {
    armedRef.current = null
    isDraggingRef.current = false
    setArmedSwatchId(null)
    setIsDragging(false)
    setHoverTarget(null)
    setBrushPosition(null)
  }, [])

  const applyToComponent = useCallback(
    (target: ComponentColorTarget) => {
      if (!armedRef.current) return
      setComponentGradient(target, armedRef.current)
      cancelPaintMode()
    },
    [setComponentGradient, cancelPaintMode],
  )

  const endDrag = useCallback(
    (x: number, y: number) => {
      const paintTarget = findPaintTargetAt(x, y)
      if (paintTarget && armedRef.current) {
        applyToComponent(paintTarget)
        return
      }
      cancelPaintMode()
    },
    [applyToComponent, cancelPaintMode],
  )

  const togglePanel = useCallback(() => {
    setPanelOpen((current) => !current)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('paint-mode-active', isDragging)
    return () => {
      document.body.classList.remove('paint-mode-active')
    }
  }, [isDragging])

  useEffect(() => {
    if (!isDragging) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelPaintMode()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDragging, cancelPaintMode])

  useEffect(() => {
    if (!isDragging) return

    const handlePointerMove = (event: PointerEvent) => {
      updateBrushPosition(event.clientX, event.clientY)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [isDragging, updateBrushPosition])

  return (
    <PaintModeContext.Provider
      value={{
        isPanelOpen,
        setPanelOpen,
        togglePanel,
        armedSwatchId,
        cancelPaintMode,
        isPaintMode,
        isDragging,
        hoverTarget,
        brushPosition,
        beginDrag,
        updateBrushPosition,
        endDrag,
        applyToComponent,
      }}
    >
      {children}
    </PaintModeContext.Provider>
  )
}

export function usePaintMode() {
  const context = useContext(PaintModeContext)
  if (!context) {
    throw new Error('usePaintMode must be used within PaintModeProvider')
  }
  return context
}
