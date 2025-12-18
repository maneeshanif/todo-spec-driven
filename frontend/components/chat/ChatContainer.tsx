'use client';

/**
 * ChatContainer component - main wrapper for the chat interface.
 *
 * Features:
 * - Message list with auto-scroll
 * - Message input
 * - Loading and error states
 * - Hybrid UI support (thinking, tool calls, etc.)
 * - Integrates with conversation store
 * - Responsive design (mobile-friendly padding)
 */

import { useConversationStore } from '@/stores/conversation-store';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { StreamingMessage } from './StreamingMessage';
import { ChatMessagesSkeleton } from './ChatSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';

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
    sendMessageStreaming,
    clearError,
  } = useConversationStore();

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    // Use streaming by default for better UX
    await sendMessageStreaming(content);
  };

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Messages area - responsive padding */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
        {isLoading ? (
          <ChatMessagesSkeleton />
        ) : (
          <>
            <MessageList messages={messages} />

            {/* Streaming message with hybrid UI */}
            {isStreaming && (
              <div className="mt-4">
                <StreamingMessage
                  content={streamingContent}
                  toolCalls={streamingToolCalls}
                  isThinking={isThinking}
                  thinkingMessage={thinkingMessage}
                  agentName={currentAgent}
                />
              </div>
            )}
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
        <MessageInput
          onSend={handleSendMessage}
          disabled={isLoading}
          isLoading={isSending || isStreaming}
          placeholder="Ask me to add, list, complete, or update your tasks..."
        />
        <p className="text-xs text-muted-foreground mt-2 text-center hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
