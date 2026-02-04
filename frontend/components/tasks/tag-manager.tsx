'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TagBadge, presetColors, Tag } from './tag-badge';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagManagerProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onAddTag: (name: string, color: string) => Promise<Tag>;
  onRemoveTag: (tagId: number) => void;
  onToggleTag: (tagId: number) => void;
  className?: string;
}

export function TagManager({
  availableTags,
  selectedTags,
  onAddTag,
  onRemoveTag,
  onToggleTag,
  className = '',
}: TagManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(presetColors[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate tag name
    if (!newTagName.trim()) {
      setError('Tag name is required');
      return;
    }

    if (newTagName.trim().length > 50) {
      setError('Tag name must be less than 50 characters');
      return;
    }

    // Check for duplicates
    const exists = availableTags.some(
      (tag) => tag.name.toLowerCase() === newTagName.trim().toLowerCase()
    );

    if (exists) {
      setError('Tag already exists');
      return;
    }

    try {
      setIsAdding(true);
      await onAddTag(newTagName.trim(), selectedColor);
      setNewTagName('');
      setSelectedColor(presetColors[0]);
    } catch (err: any) {
      setError(err.message || 'Failed to create tag');
    } finally {
      setIsAdding(false);
    }
  };

  const isSelected = (tagId: number) => {
    return selectedTags.some((tag) => tag.id === tagId);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Add new tag */}
      <form onSubmit={handleAddTag} className="flex gap-2 items-start">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name"
              disabled={isAdding}
              maxLength={50}
              aria-label="New tag name"
              className="flex-1"
            />

            {/* Color picker button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={isAdding}
              className="w-10 h-10"
              style={{ backgroundColor: selectedColor }}
              aria-label="Select tag color"
              title="Select tag color"
            >
              <div className="w-4 h-4 rounded-full bg-current" />
            </Button>
          </div>

          {/* Color picker popover */}
          {showColorPicker && (
            <div className="flex gap-1 flex-wrap p-2 bg-popover border rounded-md">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color);
                    setShowColorPicker(false);
                  }}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                    selectedColor === color ? 'border-ring scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                  title={color}
                />
              ))}
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={isAdding || !newTagName.trim()}
          aria-label="Add tag"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Available tags */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <div key={tag.id} className="relative">
              <TagBadge
                tag={tag}
                onRemove={() => onRemoveTag(tag.id)}
              />
              {/* Selection indicator */}
              <button
                type="button"
                onClick={() => onToggleTag(tag.id)}
                className={cn(
                  'absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs font-bold',
                  isSelected(tag.id)
                    ? 'bg-primary text-primary-foreground border-background'
                    : 'bg-background text-muted-foreground border-primary'
                )}
                aria-label={
                  isSelected(tag.id)
                    ? `Deselect ${tag.name}`
                    : `Select ${tag.name}`
                }
              >
                {isSelected(tag.id) ? <X className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {availableTags.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">
          No tags yet. Create your first tag above.
        </p>
      )}
    </div>
  );
}
