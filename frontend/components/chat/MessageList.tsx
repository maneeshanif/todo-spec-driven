'use client';

/**
 * MessageList component displays a list of chat messages.
 *
 * Features:
 * - User and assistant message styling
 * - Tool call display
 * - Timestamps
 * - Empty state
 * - Dark mode support
 * - Responsive design (mobile-friendly max-width and spacing)
 */

import { useRef, useEffect, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import type { Message, ToolCall } from '@/types/chat';
import { Bot, User, Wrench, CheckCircle, XCircle } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  streamingContent?: string;
  className?: string;
}

export function MessageList({
  messages,
  streamingContent,
  className,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !streamingContent) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full text-muted-foreground px-4', className)}>
        <Bot className="h-10 w-10 sm:h-12 sm:w-12 mb-4 opacity-50" />
        <p className="text-base sm:text-lg font-medium text-center">Start a conversation</p>
        <p className="text-xs sm:text-sm text-center">Ask me to help manage your tasks!</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3 sm:gap-4', className)}>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {/* Streaming message indicator */}
      {streamingContent && (
        <div className="flex gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          </div>
          <div className="flex-1 bg-muted rounded-lg px-3 py-2 sm:px-4 sm:py-3 max-w-[90%] sm:max-w-[80%]">
            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{streamingContent}</p>
            <span className="inline-block w-1.5 h-3.5 sm:w-2 sm:h-4 bg-primary/50 animate-pulse ml-1" />
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}

interface MessageItemProps {
  message: Message;
}

function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex gap-2 sm:gap-3',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0',
          isUser ? 'bg-primary' : 'bg-primary/10'
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 max-w-[90%] sm:max-w-[80%]',
          isUser && 'flex flex-col items-end'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-3 py-2 sm:px-4 sm:py-3',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          {isUser ? (
            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        {/* Tool calls */}
        {isAssistant && message.tool_calls && message.tool_calls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.tool_calls.map((toolCall, index) => (
              <ToolCallBadge key={toolCall.id || index} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

interface ToolCallBadgeProps {
  toolCall: ToolCall;
}

function ToolCallBadge({ toolCall }: ToolCallBadgeProps) {
  const hasResult = !!toolCall.result;
  const isError = toolCall.result?.error;

  return (
    <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-background border rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs">
      <Wrench className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
      <span className="font-medium truncate max-w-[80px] sm:max-w-none">{formatToolName(toolCall.tool)}</span>
      {hasResult && (
        isError ? (
          <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-destructive" />
        ) : (
          <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 dark:text-green-500" />
        )
      )}
    </div>
  );
}

function formatToolName(tool: string): string {
  // Convert snake_case to Title Case
  return tool
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * MarkdownContent component renders markdown with appropriate styling.
 * Memoized to prevent unnecessary re-renders during streaming.
 */
const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="text-xs sm:text-sm prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          // Code blocks
          pre: ({ children }) => (
            <pre className="bg-background/50 dark:bg-background/80 rounded-md p-2 sm:p-3 overflow-x-auto my-2 border text-[10px] sm:text-xs">
              {children}
            </pre>
          ),
          // Inline code
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="bg-background/50 dark:bg-background/80 px-1 py-0.5 rounded text-[10px] sm:text-xs font-mono border"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("text-[10px] sm:text-xs font-mono", className)} {...props}>
                {children}
              </code>
            );
          },
          // Unordered lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
          ),
          // Ordered lists
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
          ),
          // List items
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          // Links - open in new tab
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
          // Strong/bold text
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          // Emphasis/italic text
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 pl-2 sm:pl-3 my-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // Horizontal rules
          hr: () => (
            <hr className="my-3 border-border" />
          ),
          // Headings
          h1: ({ children }) => (
            <h1 className="text-sm sm:text-base font-bold mt-3 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs sm:text-sm font-bold mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-semibold mt-2 mb-1">{children}</h3>
          ),
          // Tables
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-[10px] sm:text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50 dark:bg-muted/30">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left font-semibold text-foreground border-b border-border whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-muted-foreground">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
