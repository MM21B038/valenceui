import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-1.5 mt-2 text-[11px] font-bold leading-snug first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1 mt-2 text-[10px] font-bold leading-snug first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-1.5 text-[10px] font-semibold leading-snug first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-1.5 leading-snug last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-1.5 list-disc space-y-0.5 pl-3.5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-1.5 list-decimal space-y-0.5 pl-3.5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-node-fg">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="mb-1.5 border-l-2 border-connector/40 pl-2 text-panel-muted last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-2 border-panel-border" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-connector underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes('language-'))

    if (isBlock) {
      return (
        <code className={cn('font-mono text-[9px]', className)} {...props}>
          {children}
        </code>
      )
    }

    return (
      <code
        className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="scrollbar-hidden mb-1.5 overflow-x-auto rounded-md bg-muted/80 p-2 font-mono text-[9px] leading-relaxed last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="scrollbar-hidden mb-1.5 overflow-x-auto last:mb-0">
      <table className="w-full min-w-full border-collapse text-[9px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-panel-border px-1.5 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-panel-border px-1.5 py-1 align-top">{children}</td>
  ),
}

interface ChatMarkdownProps {
  content: string
  className?: string
}

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return (
    <div className={cn('min-w-0 break-words text-[10px] leading-snug', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
