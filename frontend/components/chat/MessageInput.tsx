'use client';

/**
 * MessageInput component for sending messages to the AI chatbot.
 *
 * Features:
 * - Textarea with auto-resize
 * - Enter to send (Shift+Enter for newline)
 * - Send button
 * - Disabled state during sending
 * - Responsive design (mobile-friendly sizing)
 */

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [content]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (trimmed && !disabled && !isLoading) {
      onSend(trimmed);
      setContent('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || isLoading;
  const canSend = content.trim().length > 0 && !isDisabled;

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Waiting for response...' : placeholder}
          disabled={isDisabled}
          className="min-h-[44px] sm:min-h-[52px] max-h-[150px] sm:max-h-[200px] resize-none pr-2 text-sm sm:text-base"
          rows={1}
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={!canSend}
        size="icon"
        className="h-[44px] w-[44px] sm:h-[52px] sm:w-[52px] shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
        ) : (
          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </Button>
    </div>
  );
}
