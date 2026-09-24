import { useDroppable } from '@dnd-kit/core'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import { MentionMenu, type MentionOption } from '@/features/prompts/mention-menu'
import { usePrompts, useSkills } from '@/lib/api/prompt-entities'
import {
  countReferences,
  getMentionTrigger,
  referenceKey,
  type ReferenceSegment,
} from '@/lib/prompts/reference-syntax'
import {
  getSelectionRect,
  handleChipBackspace,
  insertParsedContentAtSelection,
  insertPlainTextAtSelection,
  insertReferenceAtPoint,
  insertReferenceAtSelection,
  REF_CHIP_ATTR,
  REF_CHIP_REMOVE_ATTR,
  removeChipElement,
  renderContentToEditor,
  RICH_COMPOSER_DROP_ID,
  serializeBeforeSelection,
  serializeEditorContent,
  setCaretFromPoint,
} from '@/lib/prompts/rich-composer-dom'
import { cn } from '@/lib/utils'

export interface RichComposerHandle {
  insertReference: (ref: Pick<ReferenceSegment, 'refType' | 'uuid' | 'name'>) => void
  insertReferenceAtPoint: (
    x: number,
    y: number,
    ref: Pick<ReferenceSegment, 'refType' | 'uuid' | 'name'>,
  ) => void
  insertAtSign: () => void
  focus: () => void
}

interface RichReferenceComposerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  isDropActive?: boolean
}

export const RichReferenceComposer = forwardRef<
  RichComposerHandle,
  RichReferenceComposerProps
>(function RichReferenceComposer(
  { value, onChange, placeholder, className, isDropActive = false },
  ref,
) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastEmittedRef = useRef(value)
  const isFocusedRef = useRef(false)

  const { data: prompts = [] } = usePrompts()
  const { data: skills = [] } = useSkills()

  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionChars, setMentionChars] = useState(0)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [dropCaretRect, setDropCaretRect] = useState<DOMRect | null>(null)

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: RICH_COMPOSER_DROP_ID,
  })

  const nameLookup = useMemo(() => {
    const map = new Map<string, { refType: 'prompt' | 'skill'; name: string }>()
    for (const prompt of prompts) {
      map.set(referenceKey('prompt', prompt.uuid), {
        refType: 'prompt',
        name: prompt.name,
      })
    }
    for (const skill of skills) {
      map.set(referenceKey('skill', skill.uuid), {
        refType: 'skill',
        name: skill.name,
      })
    }
    return map
  }, [prompts, skills])

  const mentionOptions = useMemo<MentionOption[]>(
    () => [
      ...prompts.map((prompt) => ({
        refType: 'prompt' as const,
        uuid: prompt.uuid,
        name: prompt.name,
      })),
      ...skills.map((skill) => ({
        refType: 'skill' as const,
        uuid: skill.uuid,
        name: skill.name,
      })),
    ],
    [prompts, skills],
  )

  useEffect(() => {
    const root = editorRef.current
    if (!root || isFocusedRef.current) return
    const needsRender =
      value !== lastEmittedRef.current || root.childNodes.length === 0
    if (!needsRender) return
    renderContentToEditor(root, value, nameLookup)
    lastEmittedRef.current = value
  }, [value, nameLookup])

  useEffect(() => {
    if (!isDropActive) {
      setDropCaretRect(null)
    }
  }, [isDropActive])

  const emitChange = () => {
    const root = editorRef.current
    if (!root) return
    const serialized = serializeEditorContent(root)
    lastEmittedRef.current = serialized
    onChange(serialized)
    return serialized
  }

  const updateMentionState = () => {
    const root = editorRef.current
    if (!root) return

    const textBefore = serializeBeforeSelection(root)
    const trigger = getMentionTrigger(textBefore, textBefore.length)

    if (trigger) {
      setMentionQuery(trigger.query)
      setMentionChars(trigger.end - trigger.start)
      setAnchorRect(getSelectionRect())
    } else {
      setMentionQuery(null)
      setMentionChars(0)
      setAnchorRect(null)
    }
  }

  const insertReference = (
    data: Pick<ReferenceSegment, 'refType' | 'uuid' | 'name'>,
    removeMentionChars = mentionChars,
  ) => {
    const root = editorRef.current
    if (!root) return

    insertReferenceAtSelection(root, data, removeMentionChars)
    setMentionQuery(null)
    setMentionChars(0)
    setAnchorRect(null)
    emitChange()
  }

  useImperativeHandle(ref, () => ({
    insertReference: (data) => insertReference(data, 0),
    insertReferenceAtPoint: (x, y, data) => {
      const root = editorRef.current
      if (!root) return
      insertReferenceAtPoint(root, x, y, data)
      setDropCaretRect(null)
      emitChange()
    },
    insertAtSign: () => {
      const root = editorRef.current
      if (!root) return
      root.focus()
      insertPlainTextAtSelection(root, '@')
      emitChange()
      updateMentionState()
    },
    focus: () => editorRef.current?.focus(),
  }))

  const handleInput = () => {
    emitChange()
    updateMentionState()
  }

  const handleChipRemove = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const removeButton = target.closest(`[${REF_CHIP_REMOVE_ATTR}]`)
    if (!removeButton) return

    event.preventDefault()
    event.stopPropagation()

    const chip = removeButton.closest(`[${REF_CHIP_ATTR}]`)
    if (chip instanceof HTMLElement) {
      removeChipElement(chip)
      emitChange()
      updateMentionState()
      editorRef.current?.focus()
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDropActive) return

    const root = editorRef.current
    if (!root) return

    if (setCaretFromPoint(root, event.clientX, event.clientY)) {
      setDropCaretRect(getSelectionRect())
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const root = editorRef.current
    if (!root) return

    if (
      mentionQuery !== null &&
      (event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === 'Tab')
    ) {
      return
    }

    if (handleChipBackspace(root, event.nativeEvent)) {
      emitChange()
      updateMentionState()
      return
    }

    if (event.key === 'Escape' && mentionQuery !== null) {
      event.preventDefault()
      setMentionQuery(null)
      setMentionChars(0)
      setAnchorRect(null)
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const root = editorRef.current
    if (!root) return

    const text = event.clipboardData.getData('text/plain')
    if (!text) return

    insertParsedContentAtSelection(root, text, nameLookup)
    emitChange()
    updateMentionState()
  }

  const referenceCount = countReferences(value)
  const isEmpty = !value.trim()

  const setEditorRef = (node: HTMLDivElement | null) => {
    editorRef.current = node
    setDropRef(node)
  }

  return (
    <div className={cn('relative', className)}>
      {isEmpty ? (
        <p className="pointer-events-none absolute top-4 left-4 text-sm text-panel-muted">
          {placeholder}
        </p>
      ) : null}

      {isDropActive && isOver ? (
        <p className="pointer-events-none absolute top-2 right-3 rounded-full bg-connector/10 px-2 py-0.5 text-[10px] font-medium text-connector">
          Drop to place reference
        </p>
      ) : null}

      {isDropActive && dropCaretRect ? (
        <span
          className="pointer-events-none fixed z-50 w-0.5 rounded-full bg-connector"
          style={{
            top: dropCaretRect.top,
            left: dropCaretRect.left,
            height: Math.max(dropCaretRect.height, 16),
          }}
        />
      ) : null}

      <div
        ref={setEditorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Composed prompt content"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onMouseDown={handleChipRemove}
        onPointerMove={handlePointerMove}
        onFocus={() => {
          isFocusedRef.current = true
          updateMentionState()
        }}
        onBlur={() => {
          isFocusedRef.current = false
          setMentionQuery(null)
          setAnchorRect(null)
          setDropCaretRect(null)
        }}
        onClick={updateMentionState}
        onKeyUp={updateMentionState}
        className={cn(
          'min-h-[360px] w-full rounded-xl border bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors focus:ring-2 focus:ring-connector/15',
          isDropActive && isOver
            ? 'border-connector ring-2 ring-connector/20'
            : 'border-panel-border focus:border-connector/60',
        )}
      />

      {mentionQuery !== null ? (
        <MentionMenu
          options={mentionOptions}
          query={mentionQuery}
          anchorRect={anchorRect}
          onSelect={(option) => insertReference(option, mentionChars)}
          onClose={() => {
            setMentionQuery(null)
            setMentionChars(0)
            setAnchorRect(null)
          }}
        />
      ) : null}

      <p className="mt-2 text-[10px] text-panel-muted">
        {referenceCount > 0
          ? `${referenceCount} embedded reference${referenceCount === 1 ? '' : 's'} · `
          : ''}
        Type <span className="font-mono">@</span> or drag from the panel · hover a tag to
        remove
      </p>
    </div>
  )
})
