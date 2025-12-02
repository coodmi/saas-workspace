'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  Flag,
  Tag,
  SortAsc,
  SortDesc,
} from 'lucide-react';

export interface TaskFilters {
  search: string;
  status: string[];
  priority: string[];
  assignee: string[];
  dueDate: 'all' | 'overdue' | 'today' | 'week' | 'month';
  sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  teamMembers?: { userId: string; displayName?: string }[];
}

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
];

const dueDateOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

export function TaskFiltersBar({ filters, onFiltersChange, teamMembers = [] }: TaskFiltersProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = [
    filters.status.length > 0,
    filters.priority.length > 0,
    filters.assignee.length > 0,
    filters.dueDate !== 'all',
  ].filter(Boolean).length;

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const handlePriorityToggle = (priority: string) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ ...filters, priority: newPriorities });
  };

  const handleAssigneeToggle = (assignee: string) => {
    const newAssignees = filters.assignee.includes(assignee)
      ? filters.assignee.filter((a) => a !== assignee)
      : [...filters.assignee, assignee];
    onFiltersChange({ ...filters, assignee: newAssignees });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      priority: [],
      assignee: [],
      dueDate: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Filter Popover */}
      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>

            <Separator />

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Status
              </Label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <Badge
                    key={status.value}
                    variant={filters.status.includes(status.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleStatusToggle(status.value)}
                  >
                    {status.label}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Priority
              </Label>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((priority) => (
                  <Badge
                    key={priority.value}
                    variant={filters.priority.includes(priority.value) ? 'default' : 'outline'}
                    className="cursor-pointer gap-1"
                    onClick={() => handlePriorityToggle(priority.value)}
                  >
                    <span className={`h-2 w-2 rounded-full ${priority.color}`} />
                    {priority.label}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Due Date Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </Label>
              <Select
                value={filters.dueDate}
                onValueChange={(value: TaskFilters['dueDate']) =>
                  onFiltersChange({ ...filters, dueDate: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dueDateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee Filter */}
            {teamMembers.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assignee
                  </Label>
                  <div className="max-h-32 overflow-auto space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.userId} className="flex items-center gap-2">
                        <Checkbox
                          id={`assignee-${member.userId}`}
                          checked={filters.assignee.includes(member.userId)}
                          onCheckedChange={() => handleAssigneeToggle(member.userId)}
                        />
                        <Label
                          htmlFor={`assignee-${member.userId}`}
                          className="text-sm cursor-pointer"
                        >
                          {member.displayName || member.userId}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Sort */}
      <Select
        value={filters.sortBy}
        onValueChange={(value: TaskFilters['sortBy']) =>
          onFiltersChange({ ...filters, sortBy: value })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">Created Date</SelectItem>
          <SelectItem value="dueDate">Due Date</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="title">Title</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          onFiltersChange({
            ...filters,
            sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
          })
        }
      >
        {filters.sortOrder === 'asc' ? (
          <SortAsc className="h-4 w-4" />
        ) : (
          <SortDesc className="h-4 w-4" />
        )}
      </Button>

      {/* Active Filters Display */}
      {(filters.search || activeFilterCount > 0) && (
        <div className="flex items-center gap-2 ml-auto">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, search: '' })}
              />
            </Badge>
          )}
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to filter tasks based on filters
export function filterTasks<T extends {
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignees: string[];
  dueDate?: Date | null;
  createdAt: Date;
}>(tasks: T[], filters: TaskFilters): T[] {
  let filtered = [...tasks];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (task) =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
    );
  }

  // Status filter
  if (filters.status.length > 0) {
    filtered = filtered.filter((task) => filters.status.includes(task.status));
  }

  // Priority filter
  if (filters.priority.length > 0) {
    filtered = filtered.filter((task) => filters.priority.includes(task.priority));
  }

  // Assignee filter
  if (filters.assignee.length > 0) {
    filtered = filtered.filter((task) =>
      task.assignees.some((a) => filters.assignee.includes(a))
    );
  }

  // Due date filter
  if (filters.dueDate !== 'all') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    filtered = filtered.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);

      switch (filters.dueDate) {
        case 'overdue':
          return dueDate < today;
        case 'today':
          return (
            dueDate >= today &&
            dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
          );
        case 'week':
          return dueDate >= today && dueDate <= weekEnd;
        case 'month':
          return dueDate >= today && dueDate <= monthEnd;
        default:
          return true;
      }
    });
  }

  // Sort
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

  filtered.sort((a, b) => {
    let comparison = 0;

    switch (filters.sortBy) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'dueDate':
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = aDate - bDate;
        break;
      case 'priority':
        comparison =
          (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
          (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }

    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
}
