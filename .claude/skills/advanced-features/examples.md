# Advanced Features Examples

## Example 1: Task Model with All Advanced Fields

```python
# backend/src/models/task.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum
from typing import Optional
import uuid

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class RecurrenceType(str, Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=255, index=True)
    description: str | None = Field(default=None)
    status: TaskStatus = Field(default=TaskStatus.PENDING, index=True)
    priority: Priority = Field(default=Priority.MEDIUM, index=True)
    due_date: datetime | None = Field(default=None, index=True)

    # Recurrence fields
    recurrence_type: RecurrenceType = Field(default=RecurrenceType.NONE)
    recurrence_interval: int | None = Field(default=None)
    next_occurrence: datetime | None = Field(default=None)
    parent_task_id: uuid.UUID | None = Field(default=None, foreign_key="tasks.id")

    # Metadata
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = Field(default=None)

    # Relationships
    tags: list["TaskTag"] = Relationship(back_populates="task")
    reminders: list["Reminder"] = Relationship(back_populates="task")
    user: "User" = Relationship(back_populates="tasks")
```

## Example 2: Filter and Search API

```python
# backend/src/routers/tasks.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select, or_, and_
from typing import Optional
from datetime import datetime
from uuid import UUID

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("/")
async def list_tasks(
    # Filters
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    priority: Optional[Priority] = Query(None, description="Filter by priority"),
    tag_ids: Optional[list[UUID]] = Query(None, description="Filter by tag IDs"),
    due_before: Optional[datetime] = Query(None, description="Due before date"),
    due_after: Optional[datetime] = Query(None, description="Due after date"),
    has_reminder: Optional[bool] = Query(None, description="Has reminder set"),
    is_recurring: Optional[bool] = Query(None, description="Is recurring task"),

    # Search
    search: Optional[str] = Query(None, min_length=2, description="Search in title/description"),

    # Sorting
    sort_by: str = Query("created_at", regex="^(created_at|due_date|priority|title|updated_at)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),

    # Pagination
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),

    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """List tasks with filtering, search, and sorting."""

    # Base query
    statement = select(Task).where(Task.user_id == user.id)

    # Apply status filter
    if status:
        statement = statement.where(Task.status == status)

    # Apply priority filter
    if priority:
        statement = statement.where(Task.priority == priority)

    # Apply due date range filter
    if due_before:
        statement = statement.where(Task.due_date <= due_before)
    if due_after:
        statement = statement.where(Task.due_date >= due_after)

    # Apply recurring filter
    if is_recurring is not None:
        if is_recurring:
            statement = statement.where(Task.recurrence_type != RecurrenceType.NONE)
        else:
            statement = statement.where(Task.recurrence_type == RecurrenceType.NONE)

    # Apply tag filter (requires subquery)
    if tag_ids:
        from sqlalchemy import exists
        tag_subquery = select(TaskTag.task_id).where(TaskTag.tag_id.in_(tag_ids))
        statement = statement.where(Task.id.in_(tag_subquery))

    # Apply reminder filter
    if has_reminder is not None:
        from sqlalchemy import exists
        reminder_subquery = select(Reminder.task_id).where(Reminder.task_id == Task.id)
        if has_reminder:
            statement = statement.where(exists(reminder_subquery))
        else:
            statement = statement.where(~exists(reminder_subquery))

    # Apply full-text search
    if search:
        search_term = f"%{search}%"
        statement = statement.where(
            or_(
                Task.title.ilike(search_term),
                Task.description.ilike(search_term)
            )
        )

    # Count total before pagination
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # Apply sorting
    sort_column = getattr(Task, sort_by)
    if sort_order == "desc":
        statement = statement.order_by(sort_column.desc())
    else:
        statement = statement.order_by(sort_column.asc())

    # Apply pagination
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    # Execute
    tasks = session.exec(statement).all()

    return {
        "items": tasks,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }
```

## Example 3: Tags CRUD API

```python
# backend/src/routers/tags.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID
from pydantic import BaseModel

router = APIRouter(prefix="/api/tags", tags=["tags"])

class TagCreate(BaseModel):
    name: str
    color: str = "#6B7280"

class TagUpdate(BaseModel):
    name: str | None = None
    color: str | None = None

@router.get("/")
async def list_tags(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """List all tags for current user."""
    statement = select(Tag).where(Tag.user_id == user.id).order_by(Tag.name)
    return session.exec(statement).all()

@router.post("/", status_code=201)
async def create_tag(
    tag_data: TagCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """Create a new tag."""
    # Check for duplicate
    existing = session.exec(
        select(Tag).where(Tag.user_id == user.id, Tag.name == tag_data.name)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag already exists")

    tag = Tag(**tag_data.model_dump(), user_id=user.id)
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag

@router.patch("/{tag_id}")
async def update_tag(
    tag_id: UUID,
    tag_data: TagUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """Update a tag."""
    tag = session.get(Tag, tag_id)
    if not tag or tag.user_id != user.id:
        raise HTTPException(status_code=404, detail="Tag not found")

    update_data = tag_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tag, key, value)

    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag

@router.delete("/{tag_id}", status_code=204)
async def delete_tag(
    tag_id: UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """Delete a tag."""
    tag = session.get(Tag, tag_id)
    if not tag or tag.user_id != user.id:
        raise HTTPException(status_code=404, detail="Tag not found")

    session.delete(tag)
    session.commit()

# Task-Tag association
@router.post("/tasks/{task_id}/tags/{tag_id}")
async def add_tag_to_task(
    task_id: UUID,
    tag_id: UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """Add a tag to a task."""
    task = session.get(Task, task_id)
    tag = session.get(Tag, tag_id)

    if not task or task.user_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    if not tag or tag.user_id != user.id:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Check if already tagged
    existing = session.exec(
        select(TaskTag).where(TaskTag.task_id == task_id, TaskTag.tag_id == tag_id)
    ).first()
    if existing:
        return {"status": "already_tagged"}

    task_tag = TaskTag(task_id=task_id, tag_id=tag_id)
    session.add(task_tag)
    session.commit()
    return {"status": "added"}

@router.delete("/tasks/{task_id}/tags/{tag_id}")
async def remove_tag_from_task(
    task_id: UUID,
    tag_id: UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """Remove a tag from a task."""
    task_tag = session.exec(
        select(TaskTag).where(TaskTag.task_id == task_id, TaskTag.tag_id == tag_id)
    ).first()

    if task_tag:
        session.delete(task_tag)
        session.commit()
    return {"status": "removed"}
```

## Example 4: Reminder Service

```python
# backend/src/services/reminder_service.py
from sqlmodel import Session, select
from datetime import datetime, timedelta
from uuid import UUID
from dapr.clients import DaprClient
import json

class ReminderService:
    """Service for managing task reminders."""

    def __init__(self, session: Session):
        self.session = session

    async def create_reminder(
        self,
        task_id: UUID,
        remind_at: datetime,
        message: str | None = None
    ) -> Reminder:
        """Create a reminder for a task."""
        reminder = Reminder(
            task_id=task_id,
            remind_at=remind_at,
            message=message
        )
        self.session.add(reminder)
        self.session.commit()
        self.session.refresh(reminder)

        # Schedule reminder via Dapr
        await self._schedule_reminder(reminder)
        return reminder

    async def _schedule_reminder(self, reminder: Reminder):
        """Schedule reminder notification via Dapr Jobs API."""
        with DaprClient() as client:
            # Calculate delay
            delay = (reminder.remind_at - datetime.utcnow()).total_seconds()
            if delay > 0:
                client.publish_event(
                    pubsub_name="taskpubsub",
                    topic_name="reminder-events",
                    data=json.dumps({
                        "event_type": "reminder.scheduled",
                        "reminder_id": str(reminder.id),
                        "task_id": str(reminder.task_id),
                        "remind_at": reminder.remind_at.isoformat(),
                        "message": reminder.message
                    })
                )

    async def get_pending_reminders(self) -> list[Reminder]:
        """Get all pending reminders that should fire now."""
        statement = select(Reminder).where(
            Reminder.is_sent == False,
            Reminder.remind_at <= datetime.utcnow()
        )
        return self.session.exec(statement).all()

    async def mark_as_sent(self, reminder_id: UUID):
        """Mark a reminder as sent."""
        reminder = self.session.get(Reminder, reminder_id)
        if reminder:
            reminder.is_sent = True
            self.session.add(reminder)
            self.session.commit()
```

## Example 5: Filter Bar Component (React)

```tsx
// frontend/components/tasks/filter-bar.tsx
"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface TaskFilters {
  status?: string;
  priority?: string;
  tagIds?: string[];
  dueBefore?: Date;
  dueAfter?: Date;
  search?: string;
}

interface FilterBarProps {
  tags: Tag[];
  onFilterChange: (filters: TaskFilters) => void;
}

export function FilterBar({ tags, onFilterChange }: FilterBarProps) {
  const t = useTranslations("tasks");
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchInput, setSearchInput] = useState("");

  const updateFilter = useCallback(
    (key: keyof TaskFilters, value: any) => {
      const newFilters = { ...filters, [key]: value || undefined };
      setFilters(newFilters);
      onFilterChange(newFilters);
    },
    [filters, onFilterChange]
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchInput("");
    onFilterChange({});
  }, [onFilterChange]);

  const handleSearch = useCallback(() => {
    updateFilter("search", searchInput || undefined);
  }, [searchInput, updateFilter]);

  const toggleTag = useCallback(
    (tagId: string) => {
      const currentTags = filters.tagIds || [];
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter((id) => id !== tagId)
        : [...currentTags, tagId];
      updateFilter("tagIds", newTags.length > 0 ? newTags : undefined);
    },
    [filters.tagIds, updateFilter]
  );

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  );

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="secondary">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />

        {/* Status filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={(v) => updateFilter("status", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="pending">{t("statuses.pending")}</SelectItem>
            <SelectItem value="in_progress">{t("statuses.inProgress")}</SelectItem>
            <SelectItem value="completed">{t("statuses.completed")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select
          value={filters.priority || "all"}
          onValueChange={(v) => updateFilter("priority", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={t("priority")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allPriorities")}</SelectItem>
            <SelectItem value="high">{t("priorities.high")}</SelectItem>
            <SelectItem value="medium">{t("priorities.medium")}</SelectItem>
            <SelectItem value="low">{t("priorities.low")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Due date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[130px]">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {filters.dueBefore ? format(filters.dueBefore, "MMM d") : t("dueDate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dueBefore}
              onSelect={(date) => updateFilter("dueBefore", date)}
            />
          </PopoverContent>
        </Popover>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            {t("clearFilters")}
          </Button>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            variant={filters.tagIds?.includes(tag.id) ? "default" : "outline"}
            className="cursor-pointer"
            style={{
              backgroundColor: filters.tagIds?.includes(tag.id) ? tag.color : undefined,
            }}
            onClick={() => toggleTag(tag.id)}
          >
            {tag.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
```

## Example 6: Due Date Picker Component

```tsx
// frontend/components/tasks/due-date-picker.tsx
"use client";

import { useState } from "react";
import { format, addDays, addWeeks, startOfDay, endOfDay } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DueDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
}

export function DueDatePicker({ value, onChange }: DueDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quickOptions = [
    { label: "Today", date: endOfDay(new Date()) },
    { label: "Tomorrow", date: endOfDay(addDays(new Date(), 1)) },
    { label: "Next week", date: endOfDay(addWeeks(new Date(), 1)) },
    { label: "No due date", date: undefined },
  ];

  const timeOptions = [
    "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00",
    "17:00", "18:00", "19:00", "20:00"
  ];

  const handleQuickSelect = (date: Date | undefined) => {
    onChange(date);
    setIsOpen(false);
  };

  const handleTimeChange = (time: string) => {
    if (value) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(value);
      newDate.setHours(hours, minutes, 0, 0);
      onChange(newDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP p") : "Set due date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2 border-b">
          <div className="flex flex-wrap gap-2">
            {quickOptions.map((option) => (
              <Button
                key={option.label}
                variant="ghost"
                size="sm"
                onClick={() => handleQuickSelect(option.date)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => onChange(date)}
          initialFocus
        />
        {value && (
          <div className="p-2 border-t flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select
              value={format(value, "HH:mm")}
              onValueChange={handleTimeChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```
