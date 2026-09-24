import {
  parseComposerContent,
  REFERENCE_PATTERN,
  type ReferenceLookupEntry,
  type ReferenceSegment,
} from '@/lib/prompts/reference-syntax'
import type { ReferenceType } from '@/lib/types/prompt-entities'

export const REF_CHIP_ATTR = 'data-reference-chip'
export const REF_TYPE_ATTR = 'data-ref-type'
export const REF_UUID_ATTR = 'data-ref-uuid'
export const REF_CHIP_REMOVE_ATTR = 'data-chip-remove'
export const RICH_COMPOSER_DROP_ID = 'rich-composer-drop'

const CHIP_CLASS =
  'group/chip mx-0.5 inline-flex max-w-[220px] cursor-default select-none items-center gap-0.5 rounded-md border py-0 pr-0.5 pl-1.5 align-baseline text-[11px] font-medium leading-[1.4]'

const CHIP_LABEL_CLASS = 'min-w-0 truncate'

const CHIP_REMOVE_CLASS =
  'inline-flex size-3.5 shrink-0 items-center justify-center rounded text-[10px] leading-none opacity-0 transition-opacity group-hover/chip:opacity-100 hover:bg-black/10'

export function isReferenceChip(node: Node | null | undefined): boolean {
  return (
    node instanceof HTMLElement &&
    node.getAttribute(REF_CHIP_ATTR) === 'true'
  )
}

export function createReferenceChipElement(
  ref: Pick<ReferenceSegment, 'refType' | 'uuid' | 'name'>,
): HTMLSpanElement {
  const span = document.createElement('span')
  span.contentEditable = 'false'
  span.setAttribute(REF_CHIP_ATTR, 'true')
  span.setAttribute(REF_TYPE_ATTR, ref.refType)
  span.setAttribute(REF_UUID_ATTR, ref.uuid)
  span.className =
    ref.refType === 'skill'
      ? `${CHIP_CLASS} border-interactive/30 bg-interactive/10 text-interactive`
      : `${CHIP_CLASS} border-connector/30 bg-connector/10 text-connector`

  const label = document.createElement('span')
  label.className = CHIP_LABEL_CLASS
  label.textContent = `@${ref.name ?? ref.refType}`

  const removeButton = document.createElement('button')
  removeButton.type = 'button'
  removeButton.setAttribute(REF_CHIP_REMOVE_ATTR, 'true')
  removeButton.contentEditable = 'false'
  removeButton.className = CHIP_REMOVE_CLASS
  removeButton.setAttribute('aria-label', 'Remove reference')
  removeButton.textContent = '×'

  span.append(label, removeButton)
  return span
}

function appendTextWithBreaks(parent: Node, value: string) {
  const parts = value.split('\n')
  parts.forEach((part, index) => {
    if (part) parent.appendChild(document.createTextNode(part))
    if (index < parts.length - 1) parent.appendChild(document.createElement('br'))
  })
}

export function renderContentToEditor(
  root: HTMLElement,
  content: string,
  nameLookup?: Map<string, ReferenceLookupEntry>,
) {
  root.innerHTML = ''
  const segments = parseComposerContent(content, nameLookup, false)

  for (const segment of segments) {
    if (segment.type === 'text') {
      appendTextWithBreaks(root, segment.value)
      continue
    }
    root.appendChild(createReferenceChipElement(segment))
  }

  if (!root.childNodes.length) {
    root.appendChild(document.createTextNode(''))
  }
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const element = node as HTMLElement

  if (isReferenceChip(element)) {
    const refType = element.getAttribute(REF_TYPE_ATTR) as ReferenceType | null
    const uuid = element.getAttribute(REF_UUID_ATTR)
    if (refType && uuid) return `[${refType}](${uuid})`
    return ''
  }

  if (element.tagName === 'BR') return '\n'

  if (element.tagName === 'DIV' || element.tagName === 'P') {
    const inner = Array.from(element.childNodes).map(serializeNode).join('')
    return inner.endsWith('\n') ? inner : `${inner}\n`
  }

  return Array.from(element.childNodes).map(serializeNode).join('')
}

export function serializeEditorContent(root: HTMLElement): string {
  return Array.from(root.childNodes).map(serializeNode).join('')
}

export function serializeBeforeSelection(root: HTMLElement): string {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return serializeEditorContent(root)

  const range = selection.getRangeAt(0)
  const preRange = document.createRange()
  preRange.selectNodeContents(root)
  preRange.setEnd(range.endContainer, range.endOffset)

  const container = document.createElement('div')
  container.appendChild(preRange.cloneContents())
  return serializeEditorContent(container)
}

export function insertReferenceAtSelection(
  root: HTMLElement,
  ref: Pick<ReferenceSegment, 'refType' | 'uuid' | 'name'>,
  mentionCharsToRemove = 0,
) {
  root.focus()
  const selection = window.getSelection()
  if (!selection) return

  let range: Range
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0)
  } else {
    range = document.createRange()
    range.selectNodeContents(root)
    range.collapse(false)
  }

  if (!root.contains(range.commonAncestorContainer)) {
    range = document.createRange()
    range.selectNodeContents(root)
    range.collapse(false)
  }

  if (mentionCharsToRemove > 0) {
    const endContainer = range.endContainer
    const endOffset = range.endOffset

    if (endContainer.nodeType === Node.TEXT_NODE) {
      const text = endContainer.textContent ?? ''
      const start = Math.max(0, endOffset - mentionCharsToRemove)
      endContainer.textContent = text.slice(0, start) + text.slice(endOffset)
      range.setEnd(endContainer, start)
      range.collapse(true)
    }
  }

  const chip = createReferenceChipElement(ref)
  range.deleteContents()
  range.insertNode(chip)

  const spacer = document.createTextNode('\u200B')
  chip.after(spacer)

  const afterRange = document.createRange()
  afterRange.setStart(spacer, 1)
  afterRange.collapse(true)
  selection.removeAllRanges()
  selection.addRange(afterRange)
}

export function insertParsedContentAtSelection(
  root: HTMLElement,
  text: string,
  nameLookup?: Map<string, ReferenceLookupEntry>,
) {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return

  const range = selection.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return

  range.deleteContents()

  const hasReferences = REFERENCE_PATTERN.test(text)
  REFERENCE_PATTERN.lastIndex = 0

  if (!hasReferences) {
    insertPlainTextAtSelection(root, text)
    return
  }

  const segments = parseComposerContent(text, nameLookup, false)
  const fragment = document.createDocumentFragment()

  for (const segment of segments) {
    if (segment.type === 'text') {
      appendTextWithBreaks(fragment, segment.value)
      continue
    }
    fragment.appendChild(createReferenceChipElement(segment))
  }

  range.insertNode(fragment)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

export function insertPlainTextAtSelection(root: HTMLElement, text: string) {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return

  const range = selection.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return

  range.deleteContents()

  const fragment = document.createDocumentFragment()
  appendTextWithBreaks(fragment, text)
  range.insertNode(fragment)

  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

export function handleChipBackspace(root: HTMLElement, event: KeyboardEvent) {
  if (event.key !== 'Backspace' && event.key !== 'Delete') return false

  const selection = window.getSelection()
  if (!selection?.rangeCount || !selection.isCollapsed) return false

  const range = selection.getRangeAt(0)
  const { startContainer, startOffset } = range

  if (event.key === 'Backspace') {
    if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
      const prev = startContainer.previousSibling
      if (prev instanceof HTMLElement && isReferenceChip(prev)) {
        event.preventDefault()
        prev.remove()
        return true
      }
    }

    if (startContainer === root && startOffset > 0) {
      const prev = root.childNodes[startOffset - 1]
      if (prev instanceof HTMLElement && isReferenceChip(prev)) {
        event.preventDefault()
        prev.remove()
        return true
      }
    }

    if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 1) {
      const text = startContainer.textContent ?? ''
      if (text[0] === '\u200B') {
        const prev = startContainer.previousSibling
        if (prev instanceof HTMLElement && isReferenceChip(prev)) {
          event.preventDefault()
          prev.remove()
          startContainer.textContent = text.slice(1)
          return true
        }
      }
    }
  }

  if (event.key === 'Delete') {
    if (startContainer.nodeType === Node.TEXT_NODE) {
      const text = startContainer.textContent ?? ''
      if (startOffset === text.length || (startOffset === text.length - 1 && text.endsWith('\u200B'))) {
        const next = startContainer.nextSibling
        if (next instanceof HTMLElement && isReferenceChip(next)) {
          event.preventDefault()
          next.remove()
          if (text.endsWith('\u200B')) {
            startContainer.textContent = text.slice(0, -1)
          }
          return true
        }
      }
    }

    if (startContainer === root && startOffset < root.childNodes.length) {
      const next = root.childNodes[startOffset]
      if (next instanceof HTMLElement && isReferenceChip(next)) {
        event.preventDefault()
        next.remove()
        return true
      }
    }
  }

  return false
}

export function setCaretFromPoint(
  root: HTMLElement,
  clientX: number,
  clientY: number,
): boolean {
  const selection = window.getSelection()
  if (!selection) return false

  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null
  }

  if (typeof doc.caretRangeFromPoint === 'function') {
    const range = doc.caretRangeFromPoint(clientX, clientY)
    if (range && root.contains(range.startContainer)) {
      selection.removeAllRanges()
      selection.addRange(range)
      return true
    }
  }

  if (typeof doc.caretPositionFromPoint === 'function') {
    const position = doc.caretPositionFromPoint(clientX, clientY)
    if (position && root.contains(position.offsetNode)) {
      const range = document.createRange()
      range.setStart(position.offsetNode, position.offset)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      return true
    }
  }

  return false
}

export function insertReferenceAtPoint(
  root: HTMLElement,
  clientX: number,
  clientY: number,
  ref: Pick<ReferenceSegment, 'refType' | 'uuid' | 'name'>,
) {
  root.focus()

  if (!setCaretFromPoint(root, clientX, clientY)) {
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(root)
    range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  insertReferenceAtSelection(root, ref, 0)
}

export function removeChipElement(chip: HTMLElement) {
  const spacer = chip.nextSibling
  if (
    spacer?.nodeType === Node.TEXT_NODE &&
    spacer.textContent === '\u200B'
  ) {
    spacer.remove()
  }
  chip.remove()
}

export function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return null
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) {
    const marker = document.createElement('span')
    marker.textContent = '\u200B'
    range.insertNode(marker)
    const markerRect = marker.getBoundingClientRect()
    marker.remove()
    return markerRect
  }
  return rect
}
