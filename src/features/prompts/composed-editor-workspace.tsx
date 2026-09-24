import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { FileText, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'

import {
  RichReferenceComposer,
  type RichComposerHandle,
} from '@/features/prompts/rich-reference-composer'
import { PromptAtomShelf } from '@/features/prompts/prompt-atom-shelf'
import {
  type ReferencePickerItem,
  REFERENCE_LIBRARY_DRAG_PREFIX,
} from '@/features/prompts/reference-picker'
import { RICH_COMPOSER_DROP_ID } from '@/lib/prompts/rich-composer-dom'

interface ComposedEditorWorkspaceProps {
  content: string
  onChange: (value: string) => void
  composerRef: RefObject<RichComposerHandle | null>
}

export function ComposedEditorWorkspace({
  content,
  onChange,
  composerRef,
}: ComposedEditorWorkspaceProps) {
  const [activeDrag, setActiveDrag] = useState<ReferencePickerItem | null>(null)
  const pointerRef = useRef({ x: 0, y: 0 })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  useEffect(() => {
    if (!activeDrag) return

    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY }
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [activeDrag])

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id)
    if (!id.startsWith(REFERENCE_LIBRARY_DRAG_PREFIX)) return

    const data = event.active.data.current as ReferencePickerItem | undefined
    if (data?.refType && data.uuid) {
      setActiveDrag(data)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as ReferencePickerItem | undefined

    if (
      data?.refType &&
      data.uuid &&
      event.over?.id === RICH_COMPOSER_DROP_ID
    ) {
      composerRef.current?.insertReferenceAtPoint(
        pointerRef.current.x,
        pointerRef.current.y,
        data,
      )
    }

    setActiveDrag(null)
  }

  const handlePickerSelect = (item: ReferencePickerItem) => {
    composerRef.current?.focus()
    composerRef.current?.insertReference(item)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <RichReferenceComposer
            ref={composerRef}
            value={content}
            onChange={onChange}
            isDropActive={Boolean(activeDrag)}
            placeholder="Compose your compound — type @ or drag atoms from the shelf below."
            className="min-h-[200px]"
          />
        </div>
        <PromptAtomShelf onSelect={handlePickerSelect} />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDrag ? (
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-lg ${
              activeDrag.refType === 'skill'
                ? 'border-interactive/40 bg-interactive/10 text-interactive'
                : 'border-connector/40 bg-connector/10 text-connector'
            }`}
          >
            {activeDrag.refType === 'skill' ? (
              <Sparkles className="size-3" />
            ) : (
              <FileText className="size-3" />
            )}
            {activeDrag.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
