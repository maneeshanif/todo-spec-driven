'use client';

/**
 * ConversationItem component - displays a single conversation in the sidebar.
 *
 * Features:
 * - Click to select
 * - Kebab menu with rename/delete
 * - Inline rename editing with Save/Cancel buttons
 * - Delete confirmation dialog
 * - Loading states for async operations
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import type { Conversation } from '@/types/chat';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onRename: (id: number, title: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  /** Hide the date display when conversations are grouped by date */
  hideDate?: boolean;
}

export function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  hideDate = false,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync editTitle with conversation.title when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditTitle(conversation.title || '');
    }
  }, [conversation.title, isEditing]);

  const handleStartEdit = () => {
    console.log('[ConversationItem] Starting edit for:', conversation.id);
    setEditTitle(conversation.title || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (isRenaming) return; // Prevent double-save

    const trimmed = editTitle.trim();
    console.log('[ConversationItem] Saving edit:', {
      id: conversation.id,
      trimmed,
      original: conversation.title,
    });

    // Don't save if empty or unchanged
    if (!trimmed) {
      handleCancelEdit();
      return;
    }

    if (trimmed === conversation.title) {
      setIsEditing(false);
      return;
    }

    setIsRenaming(true);
    try {
      await onRename(conversation.id, trimmed);
      console.log('[ConversationItem] Rename successful');
      setIsEditing(false);
    } catch (error) {
      console.error('[ConversationItem] Rename failed:', error);
      // Keep editing mode open on error so user can retry
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(conversation.title || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // Check if save button should be disabled
  const isSaveDisabled =
    isRenaming || !editTitle.trim() || editTitle.trim() === conversation.title;

  const handleOpenDeleteDialog = () => {
    console.log('[ConversationItem] Opening delete dialog for:', conversation.id);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    console.log('[ConversationItem] Confirming delete for:', conversation.id);
    setIsDeleting(true);
    try {
      await onDelete(conversation.id);
      console.log('[ConversationItem] Delete successful');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('[ConversationItem] Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayTitle = conversation.title || 'New conversation';
  const formattedDate = formatDate(conversation.updated_at);

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-muted',
          isEditing && 'bg-muted ring-1 ring-primary/20'
        )}
        onClick={() => !isEditing && onSelect(conversation.id)}
      >
        <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-1.5">
              <Input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isRenaming}
                className={cn(
                  'h-7 text-sm',
                  isRenaming && 'opacity-50'
                )}
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter conversation title"
              />
              {/* Save/Cancel buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="default"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit();
                  }}
                  disabled={isSaveDisabled}
                >
                  {isRenaming ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                  disabled={isRenaming}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
              {/* Keyboard hint */}
              <p className="text-[10px] text-muted-foreground">
                Press Enter to save, Escape to cancel
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium truncate">{displayTitle}</p>
              {conversation.preview && (
                <p className="text-xs text-muted-foreground truncate max-w-full">
                  {conversation.preview.length > 50
                    ? `${conversation.preview.slice(0, 50)}...`
                    : conversation.preview}
                </p>
              )}
              {!hideDate && !conversation.preview && (
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
              )}
            </>
          )}
        </div>

        {!isEditing && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit();
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDeleteDialog();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{displayTitle}&quot; and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}
