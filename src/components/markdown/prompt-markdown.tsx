import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

/** Ensure ATX headings have a space after # so `#Title` still renders as a heading.
 *  Also split accidentally glued headings (`# h1## h2` → `# h1\n## h2`) from the
 *  old contentEditable serializer bug.
 */
export function normalizeMarkdownHeadings(content: string) {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/([^\n])(#{1,6}(?:\s|$))/g, '$1\n$2')
    .replace(/^(#{1,6})(?!#)(?![\s#])/gm, '$1 ')
}

const proseComponents: Components = {
  h1: ({ children }) => (
    <h1 className="prompt-lab-serif mb-3 mt-6 block w-full text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="prompt-lab-serif mb-2.5 mt-5 block w-full text-[1.4rem] font-semibold leading-snug tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="prompt-lab-serif mb-2 mt-4 block w-full text-[1.15rem] font-semibold leading-snug text-foreground first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-1.5 mt-3 block w-full text-sm font-semibold uppercase tracking-wide text-panel-muted first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="prompt-lab-serif mb-2.5 block w-full text-[15px] leading-[1.7] text-foreground/90 last:mb-0">
      {children}
    </p>
  ),
  br: () => <br />,
  ul: ({ children }) => (
    <ul className="prompt-lab-serif mb-3 list-disc space-y-1.5 pl-5 text-[15px] leading-[1.65] marker:text-connector last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="prompt-lab-serif mb-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-[1.65] marker:text-connector last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-foreground/85">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="prompt-lab-serif my-4 block border-l-[3px] border-connector/50 bg-connector/5 py-2 pl-4 pr-3 text-[15px] leading-relaxed text-foreground/80 italic">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-6 block w-full border-0 border-t border-panel-border/80" />
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-connector underline decoration-connector/30 underline-offset-4 transition-colors hover:decoration-connector"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes('language-'))

    if (isBlock) {
      return (
        <code
          className={cn('prompt-lab-mono text-[12px] leading-relaxed', className)}
          {...props}
        >
          {children}
        </code>
      )
    }

    return (
      <code
        className="prompt-lab-mono rounded-md bg-muted px-1.5 py-0.5 text-[12.5px] text-foreground"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="scrollbar-thin mb-4 block overflow-x-auto rounded-xl border border-panel-border/70 bg-node/60 p-4 shadow-inner last:mb-0 dark:bg-node/40">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="scrollbar-thin mb-4 overflow-x-auto rounded-xl border border-panel-border last:mb-0">
      <table className="w-full min-w-full border-collapse text-[13px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/60 text-left">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-panel-border px-3 py-2 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-panel-border/60 px-3 py-2 align-top">
      {children}
    </td>
  ),
}

interface PromptMarkdownProps {
  content: string
  className?: string
}

/** Prose-scale markdown for the Prompt Lab (not the compact chat bubble styles). */
export function PromptMarkdown({ content, className }: PromptMarkdownProps) {
  const normalized = normalizeMarkdownHeadings(content).trim()

  if (!normalized) {
    return (
      <p
        className={cn(
          'prompt-lab-serif text-[15px] italic text-panel-muted',
          className,
        )}
      >
        Nothing to preview yet — start writing.
      </p>
    )
  }

  return (
    <div
      className={cn(
        'prompt-markdown min-w-0 break-words animate-in fade-in-0 duration-300',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={proseComponents}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  )
}
