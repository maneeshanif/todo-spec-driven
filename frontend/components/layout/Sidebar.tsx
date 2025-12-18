"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  ListTodo, 
  Tag, 
  Settings, 
  Plus, 
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  href: string;
}

interface Category {
  id: number;
  name: string;
  color?: string;
  taskCount?: number;
}

interface SidebarProps {
  categories?: Category[];
  onAddCategory?: () => void;
}

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard', icon: <BarChart3 className="h-4 w-4" />, href: '/dashboard' },
  { title: 'Tasks', icon: <ListTodo className="h-4 w-4" />, href: '/tasks' },
  { title: 'Categories', icon: <Tag className="h-4 w-4" />, href: '/categories' },
  { title: 'Calendar', icon: <Calendar className="h-4 w-4" />, href: '/calendar' },
  { title: 'Settings', icon: <Settings className="h-4 w-4" />, href: '/settings' },
];

export function Sidebar({ categories = [], onAddCategory }: SidebarProps) {
  const pathname = usePathname();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);

  return (
    <div className="hidden border-r md:block w-64 flex-col">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">W</span>
            </div>
            <span className="hidden lg:block">TaskWhisper</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Categories Section */}
          <div className="mt-4 px-2 lg:px-4">
            <Collapsible
              open={isCategoriesOpen}
              onOpenChange={setIsCategoriesOpen}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4" />
                    <span>Categories</span>
                  </div>
                  {isCategoriesOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start px-8 py-1.5 text-xs"
                  onClick={onAddCategory}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add Category
                </Button>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/tasks?category=${category.id}`}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg px-8 py-1.5 text-xs transition-all",
                      pathname.includes('/tasks') && 
                      window.location.search.includes(`category=${category.id}`)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {category.taskCount}
                    </span>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
        <div className="mt-auto p-4 border-t">
          <div className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} TaskWhisper
          </div>
        </div>
      </div>
    </div>
  );
}