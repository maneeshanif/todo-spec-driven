'use client';

/**
 * NewChatButton component - starts a new conversation.
 */

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface NewChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function NewChatButton({ onClick, disabled = false }: NewChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="w-full justify-start gap-2"
      variant="outline"
    >
      <Plus className="h-4 w-4" />
      New Chat
    </Button>
  );
}
