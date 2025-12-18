'use client';

/**
 * ChatContainer component - main wrapper for the chat interface.
 *
 * Features:
 * - Message list with auto-scroll
 * - Message input with streaming support
 * - Loading and error states
 * - Hybrid UI support (thinking, tool calls, lifecycle, handoffs)
 * - Verbose lifecycle indicator with full agent lifecycle view
 * - Reasoning display for LLM thinking process
 * - Integrates with conversation store
 * - Responsive design (mobile-friendly padding)
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useConversationStore } from '@/stores/conversation-store';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { StreamingMessage } from './StreamingMessage';
import { StreamingIndicators } from './StreamingIndicators';
import { ChatMessagesSkeleton } from './ChatSkeleton';
import { useVerboseLifecycle } from '@/hooks/use-verbose-lifecycle';
import type { StreamCallbacks } from '@/lib/sse/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, X, Settings2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ChatContainerProps {
  className?: string;
}

export function ChatContainer({ className }: ChatContainerProps) {
  const {
    messages,
    streamingContent,
    streamingToolCalls,
    isThinking,
    thinkingMessage,
    currentAgent,
    isLoading,
    isStreaming,
    isSending,
    error,
    // RunItem state from store
    reasoning,
    isHandingOff,
    handoffFromAgent,
    handoffToAgent,
    // Actions
    sendMessageStreaming,
    clearError,
  } = useConversationStore();

  // Verbose lifecycle state
  const { steps: lifecycleSteps, reset: resetLifecycle, isActive: isLifecycleActive } = useVerboseLifecycle();

  // UI preferences
  const [verboseMode, setVerboseMode] = useState(false);
  const [compactLifecycle, setCompactLifecycle] = useState(true);

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages or streaming content changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, lifecycleSteps]);

  // Reset lifecycle when streaming ends
  useEffect(() => {
    if (!isStreaming && isLifecycleActive) {
      // Keep lifecycle visible for a moment after streaming ends
      const timeout = setTimeout(() => {
        resetLifecycle();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isStreaming, isLifecycleActive, resetLifecycle]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Reset verbose lifecycle before new message
    resetLifecycle();

    // Use streaming by default for better UX
    // The store will reset reasoning/handoff state internally
    await sendMessageStreaming(content);
  }, [sendMessageStreaming, resetLifecycle]);

  // Determine if we should show the streaming indicators
  const showStreamingIndicators = isStreaming && (
    isThinking ||
    streamingToolCalls.length > 0 ||
    reasoning ||
    isHandingOff ||
    (verboseMode && lifecycleSteps.length > 0)
  );

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Messages area - responsive padding */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
        {isLoading ? (
          <ChatMessagesSkeleton />
        ) : (
          <>
            <MessageList 
              messages={messages}
              onSuggestedPrompt={handleSendMessage}
            />

            {/* Streaming indicators (hybrid UI) */}
            {showStreamingIndicators && (
              <div className="mt-4">
                <StreamingIndicators
                  isThinking={isThinking && !streamingContent}
                  thinkingMessage={thinkingMessage}
                  currentAgent={currentAgent}
                  activeToolCalls={streamingToolCalls}
                  isStreaming={isStreaming && streamingContent.length > 0}
                  reasoning={reasoning}
                  isHandingOff={isHandingOff}
                  handoffFromAgent={handoffFromAgent}
                  handoffToAgent={handoffToAgent}
                  lifecycleSteps={verboseMode ? lifecycleSteps : undefined}
                  compactLifecycle={compactLifecycle}
                />
              </div>
            )}

            {/* Streaming message with hybrid UI */}
            {isStreaming && (streamingContent || streamingToolCalls.length > 0 || isThinking) && (
              <div className="mt-4">
                <StreamingMessage
                  content={streamingContent}
                  toolCalls={streamingToolCalls}
                  isThinking={isThinking && !streamingContent && streamingToolCalls.length === 0}
                  thinkingMessage={thinkingMessage}
                  agentName={currentAgent}
                />
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error alert - responsive padding */}
      {error && (
        <div className="px-2 sm:px-4 pb-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-xs sm:text-sm">{error}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={clearError}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Input area - responsive padding */}
      <div className="border-t bg-background p-2 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <MessageInput
              onSend={handleSendMessage}
              disabled={isLoading}
              isLoading={isSending || isStreaming}
              placeholder="Ask me to add, list, complete, or update your tasks..."
            />
          </div>

          {/* Settings popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                title="Chat settings"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Chat Settings</h4>

                {/* Verbose mode toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="verbose-mode" className="text-xs">
                    Verbose Lifecycle
                  </Label>
                  <Switch
                    id="verbose-mode"
                    checked={verboseMode}
                    onCheckedChange={setVerboseMode}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Show detailed agent lifecycle steps during processing
                </p>

                {/* Compact lifecycle toggle */}
                {verboseMode && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="compact-lifecycle" className="text-xs">
                        Compact View
                      </Label>
                      <Switch
                        id="compact-lifecycle"
                        checked={compactLifecycle}
                        onCheckedChange={setCompactLifecycle}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Show lifecycle as icons instead of detailed list
                    </p>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
