import {
  Bold,
  Code2,
  Columns2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  PenLine,
} from 'lucide-react'
import { useCallback, useRef, type RefObject } from 'react'

import { PromptMarkdown } from '@/components/markdown/prompt-markdown'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type AtomEditorMode = 'write' | 'preview' | 'split'

interface AtomMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  mode: AtomEditorMode
  onModeChange: (mode: AtomEditorMode) => void
  maxLength?: number
  placeholder?: string
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string = before,
  placeholder = 'text',
) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end) || placeholder
  const next =
    textarea.value.slice(0, start) +
    before +
    selected +
    after +
    textarea.value.slice(end)
  const cursorStart = start + before.length
  const cursorEnd = cursorStart + selected.length
  return { next, cursorStart, cursorEnd }
}

function selectedLineBlock(textarea: HTMLTextAreaElement) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const lineEndIndex = value.indexOf('\n', end)
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex
  return {
    value,
    lineStart,
    lineEnd,
    block: value.slice(lineStart, lineEnd),
  }
}

/** Prefix list/quote lines; skips lines that already have the prefix. */
function prefixLines(textarea: HTMLTextAreaElement, prefix: string) {
  const { value, lineStart, lineEnd, block } = selectedLineBlock(textarea)
  const nextBlock = block
    .split('\n')
    .map((line) => {
      const bare = line.replace(/^\s+/, '')
      if (bare.startsWith(prefix)) return line
      if (prefix === '- ' && /^[-*+]\s/.test(bare)) return line
      if (prefix === '1. ' && /^\d+\.\s/.test(bare)) return line
      if (prefix === '> ' && /^>\s?/.test(bare)) return line
      return `${prefix}${bare || 'item'}`
    })
    .join('\n')
  return {
    next: value.slice(0, lineStart) + nextBlock + value.slice(lineEnd),
    cursorStart: lineStart,
    cursorEnd: lineStart + nextBlock.length,
  }
}

/**
 * Set ATX heading level on selected lines.
 * Replaces any existing # prefix so you never get `## # Title` or `h1## h2`.
 */
function applyHeadingLevel(textarea: HTMLTextAreaElement, level: 1 | 2 | 3) {
  const { value, lineStart, lineEnd, block } = selectedLineBlock(textarea)
  const marks = '#'.repeat(level)
  const nextBlock = block
    .split('\n')
    .map((line) => {
      const bare = line.replace(/^\s+/, '').replace(/^#{1,6}\s*/, '')
      return `${marks} ${bare || 'Heading'}`
    })
    .join('\n')
  return {
    next: value.slice(0, lineStart) + nextBlock + value.slice(lineEnd),
    cursorStart: lineStart,
    cursorEnd: lineStart + nextBlock.length,
  }
}

function applyEdit(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  onChange: (value: string) => void,
  maxLength: number,
  edit: { next: string; cursorStart: number; cursorEnd: number },
) {
  const clipped = edit.next.slice(0, maxLength)
  onChange(clipped)
  requestAnimationFrame(() => {
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(
      Math.min(edit.cursorStart, clipped.length),
      Math.min(edit.cursorEnd, clipped.length),
    )
  })
}

const MODES: { id: AtomEditorMode; label: string; icon: typeof PenLine }[] = [
  { id: 'write', label: 'Write', icon: PenLine },
  { id: 'split', label: 'Split', icon: Columns2 },
  { id: 'preview', label: 'Preview', icon: Eye },
]

export function AtomMarkdownEditor({
  value,
  onChange,
  mode,
  onModeChange,
  maxLength = 3000,
  placeholder = `# Title
## Section
### Subsection

Write each heading on its own line. One Enter = new line.`,
}: AtomMarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const runWrap = useCallback(
    (before: string, after?: string, ph?: string) => {
      const el = textareaRef.current
      if (!el) return
      applyEdit(
        textareaRef,
        onChange,
        maxLength,
        wrapSelection(el, before, after, ph),
      )
    },
    [maxLength, onChange],
  )

  const runPrefix = useCallback(
    (prefix: string) => {
      const el = textareaRef.current
      if (!el) return
      applyEdit(textareaRef, onChange, maxLength, prefixLines(el, prefix))
    },
    [maxLength, onChange],
  )

  const runHeading = useCallback(
    (level: 1 | 2 | 3) => {
      const el = textareaRef.current
      if (!el) return
      applyEdit(textareaRef, onChange, maxLength, applyHeadingLevel(el, level))
    },
    [maxLength, onChange],
  )

  const showWrite = mode === 'write' || mode === 'split'
  const showPreview = mode === 'preview' || mode === 'split'
  const words = value.trim() ? value.trim().split(/\s+/).length : 0
  const lines = value ? value.split('\n').length : 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-panel-border/80 bg-panel-inspector/20 px-3 py-2">
        <div className="mr-1 flex items-center rounded-lg border border-panel-border/70 bg-background/70 p-0.5">
          {MODES.map((item) => {
            const Icon = item.icon
            const active = mode === item.id
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => onModeChange(item.id)}
                className={cn(
                  'flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-all duration-200',
                  active
                    ? 'bg-connector text-white shadow-sm'
                    : 'text-panel-muted hover:bg-node hover:text-foreground',
                )}
              >
                <Icon className="size-3" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            )
          })}
        </div>

        {showWrite ? (
          <>
            <div className="mx-1 hidden h-5 w-px bg-panel-border sm:block" />
            <ToolbarButton
              title="Heading 1  (# Title)"
              onClick={() => runHeading(1)}
              icon={Heading1}
            />
            <ToolbarButton
              title="Heading 2  (## Section)"
              onClick={() => runHeading(2)}
              icon={Heading2}
            />
            <ToolbarButton
              title="Heading 3  (### Subsection)"
              onClick={() => runHeading(3)}
              icon={Heading3}
            />
            <ToolbarButton
              title="Bold"
              onClick={() => runWrap('**')}
              icon={Bold}
            />
            <ToolbarButton
              title="Italic"
              onClick={() => runWrap('_')}
              icon={Italic}
            />
            <ToolbarButton
              title="Inline code"
              onClick={() => runWrap('`')}
              icon={Code2}
            />
            <ToolbarButton
              title="Bullet list"
              onClick={() => runPrefix('- ')}
              icon={List}
            />
            <ToolbarButton
              title="Numbered list"
              onClick={() => runPrefix('1. ')}
              icon={ListOrdered}
            />
            <ToolbarButton
              title="Quote"
              onClick={() => runPrefix('> ')}
              icon={Quote}
            />
          </>
        ) : null}

        <div className="ml-auto flex items-center gap-2 text-[10px] tabular-nums text-panel-muted">
          <span>{words} words</span>
          <span className="opacity-40">·</span>
          <span>{lines} lines</span>
          <span className="opacity-40">·</span>
          <span>
            {value.length}/{maxLength}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'min-h-0 flex-1',
          mode === 'split'
            ? 'grid grid-cols-1 md:grid-cols-2'
            : 'flex flex-col',
        )}
      >
        {showWrite ? (
          <div
            className={cn(
              'relative flex min-h-0 flex-col',
              mode === 'split' &&
                'border-b border-panel-border md:border-b-0 md:border-r',
            )}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) =>
                onChange(event.target.value.slice(0, maxLength))
              }
              maxLength={maxLength}
              spellCheck
              placeholder={placeholder}
              className={cn(
                'prompt-lab-mono min-h-0 flex-1 resize-none bg-transparent px-5 py-4 text-[13px] leading-[1.7] text-foreground outline-none',
                'placeholder:text-panel-muted/70',
                'selection:bg-connector/25',
              )}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background/80 to-transparent"
            />
          </div>
        ) : null}

        {showPreview ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-connector/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-connector">
                Markdown
              </span>
              <span className="text-[10px] text-panel-muted">Live render</span>
            </div>
            <PromptMarkdown content={value} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ToolbarButton({
  title,
  onClick,
  icon: Icon,
}: {
  title: string
  onClick: () => void
  icon: typeof Bold
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      onClick={onClick}
      className="size-7 p-0 text-panel-muted hover:bg-node hover:text-foreground"
    >
      <Icon className="size-3.5" />
    </Button>
  )
}
