'use client';

import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Tag {
  id: number;
  name: string;
  color: string;
}

interface TagBadgeProps {
  tag: Tag;
  onRemove?: (tagId: number) => void;
  className?: string;
  removable?: boolean;
  'aria-label'?: string;
}

const presetColors = [
  '#6B7280', // gray
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
];

export function TagBadge({
  tag,
  onRemove,
  className = '',
  removable = true,
  'aria-label': ariaLabel,
}: TagBadgeProps) {
  const handleRemove = () => {
    if (onRemove) {
      onRemove(tag.id);
    }
  };

  // Check if tag color is in contrast range, add text color class if needed
  const isDarkColor = tag.color === '#6B7280' || tag.color.startsWith('#000') || tag.color.startsWith('#1');
  const textColor = isDarkColor ? 'text-white' : 'text-white';

  return (
    <Badge
      className={cn(
        'flex items-center gap-1 border-0',
        textColor,
        className
      )}
      style={{ backgroundColor: tag.color }}
      aria-label={ariaLabel || tag.name}
    >
      <span className="text-xs font-medium">{tag.name}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${tag.name} tag`}
          title="Remove tag"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

export { presetColors };
