import { Loader2, Send, Server } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ChatMarkdown } from '@/components/chat/chat-markdown'
import { Button } from '@/components/ui/button'
import { useLlmChat } from '@/lib/api/llm-config'
import { getConnectedMcpServerIds } from '@/lib/canvas/connected-servers'
import type { LlmChatMessage } from '@/lib/types/llm-config'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils'

interface LlmChatProps {
  nodeId: string
  configId: string
  modelName?: string
}

function createMessageId() {
  return `msg_${crypto.randomUUID()}`
}

export function LlmChat({ nodeId, configId, modelName }: LlmChatProps) {
  const chat = useLlmChat()
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
  const [messages, setMessages] = useState<LlmChatMessage[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const connectedServerIds = useMemo(
    () => getConnectedMcpServerIds(nodeId, nodes, edges),
    [nodeId, nodes, edges],
  )

  const connectedServerNames = useMemo(() => {
    return nodes
      .filter(
        (node) =>
          node.type === 'toolServer' &&
          node.data.configId &&
          connectedServerIds.includes(node.data.configId),
      )
      .map((node) => node.data.name ?? 'Tool Server')
  }, [nodes, connectedServerIds])

  useEffect(() => {
    setMessages([])
    setInput('')
    setError(null)
  }, [configId, nodeId])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [messages, chat.isPending])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || chat.isPending) return

    const userMessage: LlmChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmed,
    }

    setMessages((current) => [...current, userMessage])
    setInput('')
    setError(null)

    try {
      const response = await chat.mutateAsync({
        configId,
        message: trimmed,
        servers: connectedServerIds,
      })

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: response.message,
        },
      ])
    } catch {
      setError('Could not reach Valence. Check the API and try again.')
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {connectedServerIds.length > 0 ? (
        <div className="mb-2 flex items-start gap-1.5 rounded-xl border border-panel-border bg-node/80 px-2 py-1.5">
          <Server className="mt-0.5 size-3 shrink-0 text-connector" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-panel-inspector-fg">
              {connectedServerIds.length} MCP server
              {connectedServerIds.length === 1 ? '' : 's'} linked
            </p>
            <p className="truncate text-[9px] text-panel-muted">
              {connectedServerNames.join(', ')}
            </p>
          </div>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="scrollbar-hidden min-h-0 flex-1 space-y-2 overflow-y-auto px-1 py-1"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 px-2 text-center">
            <p className="text-[11px] font-medium text-panel-inspector-fg">
              Chat with Valence
            </p>
            <p className="text-[10px] leading-snug text-panel-muted">
              {modelName
                ? `Using ${modelName}. Ask anything to try this model.`
                : 'Ask anything to try this model.'}
            </p>
            {connectedServerIds.length === 0 ? (
              <p className="text-[9px] leading-snug text-panel-muted">
                Connect a Tool Server block to enable MCP tools.
              </p>
            ) : null}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  'min-w-0 max-w-[92%] rounded-2xl px-2.5 py-1.5 text-[10px] leading-snug break-words',
                  message.role === 'user'
                    ? 'rounded-br-md bg-interactive text-interactive-fg whitespace-pre-wrap'
                    : 'w-full rounded-bl-md border border-panel-border bg-node text-node-fg',
                )}
              >
                {message.role === 'assistant' ? (
                  <>
                    <p className="mb-1 text-[8px] font-semibold uppercase tracking-wider text-connector">
                      Valence
                    </p>
                    <ChatMarkdown content={message.content} />
                  </>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))
        )}

        {chat.isPending ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-panel-border bg-node px-2.5 py-2 text-[10px] text-panel-muted">
              <Loader2 className="size-3 animate-spin" />
              Valence is thinking...
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="px-1 pb-1 text-[10px] leading-snug text-destructive">{error}</p>
      ) : null}

      <div className="mt-2 shrink-0 border-t border-panel-border pt-2">
        <div className="flex items-end gap-1.5">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Valence..."
            rows={2}
            disabled={chat.isPending}
            className="scrollbar-hidden min-h-[52px] flex-1 resize-none rounded-xl border border-input bg-background px-2.5 py-2 text-[10px] leading-snug shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-60 dark:bg-input/30"
          />
          <Button
            type="button"
            size="icon"
            disabled={!input.trim() || chat.isPending}
            onClick={() => void handleSend()}
            className="size-8 shrink-0 bg-interactive text-interactive-fg hover:bg-interactive/90"
            aria-label="Send message"
          >
            {chat.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>
        <p className="mt-1 px-0.5 text-[9px] text-panel-muted">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
