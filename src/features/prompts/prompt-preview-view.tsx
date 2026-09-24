import { Copy, Check } from 'lucide-react'
import { useMemo, useState } from 'react'

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

export function PromptPreviewView({
  kind,
  content,
  records,
}: PromptPreviewViewProps) {
  const [copied, setCopied] = useState(false)
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

  const resolved = composed ? resolveCompositionContent(content, atomLookup) : content

  const handleCopy = async () => {
    const success = await copyText(resolved)
    if (success) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-panel-border px-5 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
            {composed ? 'Resolved output' : 'Content preview'}
          </p>
          <p className="text-xs text-panel-muted">
            {composed
              ? 'What the model receives after expanding @ references'
              : 'Raw atom content'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8 gap-1.5"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {composed ? (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
                Source composition
              </p>
              <pre
                className={cn(
                  'overflow-x-auto rounded-xl border border-panel-border bg-node/30 p-4 text-xs leading-relaxed whitespace-pre-wrap text-panel-muted',
                )}
              >
                {content || 'Empty composition'}
              </pre>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-panel-muted">
                Resolved
              </p>
              <pre
                className={cn(
                  'overflow-x-auto rounded-xl border border-connector/25 bg-connector/5 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground',
                )}
              >
                {resolved || 'Nothing to resolve yet'}
              </pre>
            </div>
          </div>
        ) : (
          <pre
            className={cn(
              'overflow-x-auto rounded-xl border border-panel-border bg-node/30 p-4 text-sm leading-relaxed whitespace-pre-wrap',
            )}
          >
            {content || 'No content yet'}
          </pre>
        )}
      </div>
    </div>
  )
}
