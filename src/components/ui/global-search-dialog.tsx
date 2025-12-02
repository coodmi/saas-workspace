'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  FileText,
  FolderKanban,
  MessageSquare,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'file' | 'message' | 'team';
  title: string;
  subtitle?: string;
  path: string;
}

// Mock recent searches - in production, this would come from localStorage or API
const recentSearches: SearchResult[] = [
  {
    id: '1',
    type: 'project',
    title: 'Website Redesign',
    subtitle: 'Marketing Team',
    path: '/dashboard/projects/1',
  },
  {
    id: '2',
    type: 'task',
    title: 'Update landing page hero section',
    subtitle: 'Website Redesign',
    path: '/dashboard/projects/1/tasks/2',
  },
  {
    id: '3',
    type: 'file',
    title: 'Q3 Report.pdf',
    subtitle: 'Documents',
    path: '/dashboard/files?id=3',
  },
];

const typeIcons: Record<string, React.ReactNode> = {
  project: <FolderKanban className="h-4 w-4" />,
  task: <FileText className="h-4 w-4" />,
  file: <FileText className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
};

export function GlobalSearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Open with Ctrl+/ or Cmd+/
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        // Prevent opening if user is typing in an input
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      const items = query ? results : recentSearches;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (items[selectedIndex]) {
            handleSelect(items[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, query, results, selectedIndex]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API search - in production, this would search Firestore
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Mock search results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'project',
        title: `Project matching "${searchQuery}"`,
        subtitle: 'Team workspace',
        path: '/dashboard/projects/1',
      },
      {
        id: '2',
        type: 'task',
        title: `Task with ${searchQuery}`,
        subtitle: 'In progress',
        path: '/dashboard/projects/1/tasks/2',
      },
      {
        id: '3',
        type: 'file',
        title: `${searchQuery}.pdf`,
        subtitle: 'Documents folder',
        path: '/dashboard/files',
      },
    ];
    
    setResults(mockResults);
    setIsSearching(false);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch(query);
    }, 200);

    return () => clearTimeout(debounce);
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.path);
    setOpen(false);
    setQuery('');
  };

  const displayItems = query ? results : recentSearches;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-xl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, tasks, files, and more..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-4"
              autoFocus
            />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {!query && (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Recent Searches
              </div>
            )}

            {isSearching && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}

            {!isSearching && displayItems.length === 0 && query && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {!isSearching &&
              displayItems.map((item, index) => (
                <button
                  key={item.id}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex-shrink-0 text-muted-foreground">
                    {typeIcons[item.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
          </div>
        </ScrollArea>

        <div className="border-t p-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">↑↓</kbd>
            <span>Navigate</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] ml-2">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
