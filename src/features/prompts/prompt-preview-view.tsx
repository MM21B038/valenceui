import { Check, Copy, Eye, FileCode2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  normalizeMarkdownHeadings,
  PromptMarkdown,
} from '@/components/markdown/prompt-markdown'
import { Button } from '@/components/ui/button'
import {
  buildAtomContentLookup,
  resolveCompositionContent,
} from '@/lib/prompts/resolve-references'
import type { LabEntityRecord } from '@/lib/prompts/use-lab-entity-cache'
import { isComposedKind, type EntityKind } from '@/lib/types/prompt-entities'
import { cn } from '@/lib/utils'

interface PromptPreviewViewProps {
  kind: EntityKind
  content: string
  records: LabEntityRecord[]
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

type PreviewPane = 'rendered' | 'source'

export function PromptPreviewView({
  kind,
  content,
  records,
}: PromptPreviewViewProps) {
  const [copied, setCopied] = useState(false)
  const [pane, setPane] = useState<PreviewPane>('rendered')
  const composed = isComposedKind(kind)

  const atomLookup = useMemo(() => {
    const prompts = records
      .filter((record) => record.kind === 'prompt')
      .map((record) => ({
        uuid: record.uuid,
        name: record.name,
        content: record.content,
      }))
    const skills = records
      .filter((record) => record.kind === 'skill')
      .map((record) => ({
        uuid: record.uuid,
        name: record.name,
        content: record.content,
      }))
    return buildAtomContentLookup(prompts, skills)
  }, [records])

  const resolved = composed
    ? resolveCompositionContent(content, atomLookup)
    : content

  const sourceContent = normalizeMarkdownHeadings(content)
  const resolvedSource = normalizeMarkdownHeadings(resolved)

  const words = resolvedSource.trim()
    ? resolvedSource.trim().split(/\s+/).length
    : 0
  const chars = resolvedSource.length

  const handleCopy = async () => {
    const success = await copyText(resolvedSource)
    if (success) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-panel-border/80 px-5 py-3.5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-panel-muted">
            {composed ? 'Resolved preview' : 'Markdown preview'}
          </p>
          <p className="mt-0.5 text-xs text-panel-muted">
            {composed
              ? 'Atoms expanded · what the model receives'
              : 'How your atom reads when rendered'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-panel-border/70 bg-background/60 p-0.5">
            <button
              type="button"
              onClick={() => setPane('rendered')}
              className={cn(
                'flex h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium transition-all',
                pane === 'rendered'
                  ? 'bg-connector text-white shadow-sm'
                  : 'text-panel-muted hover:text-foreground',
              )}
            >
              <Eye className="size-3" />
              Rendered
            </button>
            <button
              type="button"
              onClick={() => setPane('source')}
              className={cn(
                'flex h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium transition-all',
                pane === 'source'
                  ? 'bg-connector text-white shadow-sm'
                  : 'text-panel-muted hover:text-foreground',
              )}
            >
              <FileCode2 className="size-3" />
              Source
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 gap-1.5"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-b border-panel-border/50 bg-panel-inspector/15 px-5 py-2 text-[10px] tabular-nums text-panel-muted">
        <span>{words} words</span>
        <span className="opacity-30">·</span>
        <span>{chars} chars</span>
        {composed ? (
          <>
            <span className="opacity-30">·</span>
            <span className="text-connector">composition expanded</span>
          </>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {pane === 'rendered' ? (
          <div className="px-6 py-5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
            <div className="mx-auto max-w-prose">
              <PromptMarkdown content={resolvedSource} />
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-5 animate-in fade-in-0 duration-300">
            {composed ? (
              <section>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-panel-muted">
                  Composition source
                </p>
                <pre className="prompt-lab-mono overflow-x-auto rounded-2xl border border-panel-border/70 bg-node/25 p-4 text-[12px] leading-relaxed whitespace-pre-wrap text-panel-muted">
                  {sourceContent || 'Empty composition'}
                </pre>
              </section>
            ) : null}
            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-panel-muted">
                {composed ? 'Resolved source' : 'Raw markdown'}
              </p>
              <pre className="prompt-lab-mono overflow-x-auto rounded-2xl border border-connector/20 bg-connector/5 p-4 text-[12.5px] leading-relaxed whitespace-pre-wrap text-foreground">
                {resolvedSource || 'Nothing to show yet'}
              </pre>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
