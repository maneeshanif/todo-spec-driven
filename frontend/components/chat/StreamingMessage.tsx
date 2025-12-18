'use client';

/**
 * StreamingMessage component - displays a message being streamed from the AI.
 *
 * Features:
 * - Animated cursor while streaming
 * - Tool call indicators with emojis during execution
 * - Thinking indicator with agent name
 * - Tool result display
 * - Smooth text appearance
 * - Responsive design (mobile-friendly sizing)
 */

import { cn } from '@/lib/utils';
import { Bot, Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import type { ToolCall, ActiveToolCall } from '@/types/chat';
import { getToolEmoji, getToolDescription } from '@/lib/sse/client';

interface StreamingMessageProps {
  content: string;
  toolCalls?: ActiveToolCall[];
  isThinking?: boolean;
  thinkingMessage?: string;
  agentName?: string;
  className?: string;
}

export function StreamingMessage({
  content,
  toolCalls = [],
  isThinking = false,
  thinkingMessage = 'Processing your request...',
  agentName = 'TodoBot',
  className,
}: StreamingMessageProps) {
  const hasContent = content.length > 0;
  const hasToolCalls = toolCalls.length > 0;

  return (
    <div className={cn('flex gap-2 sm:gap-3', className)}>
      {/* Bot avatar */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 relative">
        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        {/* Online indicator when processing */}
        {(isThinking || hasToolCalls) && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </div>

      <div className="flex-1 max-w-[90%] sm:max-w-[80%] space-y-2">
        {/* Agent name badge when thinking */}
        {isThinking && !hasContent && !hasToolCalls && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Sparkles className="h-3 w-3" />
            <span>{agentName}</span>
          </div>
        )}

        {/* Thinking indicator */}
        {isThinking && !hasContent && !hasToolCalls && (
          <ThinkingIndicator message={thinkingMessage} />
        )}

        {/* Tool calls in progress */}
        {hasToolCalls && (
          <div className="space-y-1.5">
            {toolCalls.map((toolCall, index) => (
              <ToolCallIndicator
                key={toolCall.callId || index}
                toolCall={toolCall}
              />
            ))}
          </div>
        )}

        {/* Streaming content */}
        {hasContent && (
          <div className="bg-muted rounded-lg px-3 py-2 sm:px-4 sm:py-3">
            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
              {content}
              {/* Animated cursor */}
              <span className="inline-block w-1.5 h-3.5 sm:w-2 sm:h-4 bg-primary/50 animate-pulse ml-0.5 align-middle" />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ThinkingIndicatorProps {
  message: string;
}

function ThinkingIndicator({ message }: ThinkingIndicatorProps) {
  return (
    <div className="bg-muted rounded-lg px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>{message}</span>
      </div>
    </div>
  );
}

interface ToolCallIndicatorProps {
  toolCall: ActiveToolCall;
}

function ToolCallIndicator({ toolCall }: ToolCallIndicatorProps) {
  const emoji = getToolEmoji(toolCall.tool);
  const description = getToolDescription(toolCall.tool);
  const isExecuting = toolCall.status === 'pending' || toolCall.status === 'executing';
  const isCompleted = toolCall.status === 'completed';
  const isError = toolCall.status === 'error';

  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-background border rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm transition-all duration-200',
        isExecuting && 'border-primary/40 bg-primary/5',
        isCompleted && 'border-green-500/30 bg-green-500/5',
        isError && 'border-red-500/30 bg-red-500/5'
      )}
    >
      {/* Tool emoji */}
      <span className="text-base sm:text-lg shrink-0">{emoji}</span>

      {/* Tool info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{description}</span>
          {isExecuting && (
            <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin text-primary shrink-0" />
          )}
          {isCompleted && (
            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500 shrink-0" />
          )}
          {isError && (
            <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500 shrink-0" />
          )}
        </div>

        {/* Show args if pending */}
        {isExecuting && Object.keys(toolCall.args).length > 0 && (
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
            {formatArgs(toolCall.args)}
          </div>
        )}

        {/* Show result summary if completed */}
        {isCompleted && toolCall.result !== undefined && (
          <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 mt-0.5 truncate">
            {formatResult(toolCall.result)}
          </div>
        )}

        {/* Show error if failed */}
        {isError && toolCall.result !== undefined && (
          <div className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 mt-0.5 truncate">
            {String(toolCall.result)}
          </div>
        )}
      </div>
    </div>
  );
}

function formatArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return '';

  return entries
    .slice(0, 2)
    .map(([key, value]) => {
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      const truncated = strValue.length > 20 ? strValue.slice(0, 20) + '...' : strValue;
      return `${key}: ${truncated}`;
    })
    .join(', ');
}

function formatResult(result: unknown): string {
  if (typeof result === 'string') {
    return result.length > 50 ? result.slice(0, 50) + '...' : result;
  }

  if (typeof result === 'object' && result !== null) {
    const obj = result as Record<string, unknown>;

    // Common result patterns
    if (obj.status === 'created' && obj.title) {
      return `Created: "${obj.title}"`;
    }
    if (obj.status === 'completed' && obj.title) {
      return `Completed: "${obj.title}"`;
    }
    if (obj.status === 'deleted') {
      return 'Task deleted';
    }
    if (obj.status === 'updated' && obj.title) {
      return `Updated: "${obj.title}"`;
    }
    if (Array.isArray(obj.tasks)) {
      return `Found ${obj.tasks.length} task(s)`;
    }
    if (obj.count !== undefined) {
      return `${obj.count} task(s)`;
    }

    return 'Done';
  }

  return String(result);
}
