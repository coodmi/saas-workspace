'use client';

import { useRef, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Task, TaskStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, GripVertical, MessageSquare, Paperclip, Calendar } from 'lucide-react';
import { cn, TASK_PRIORITY_COLORS, formatDate } from '@/lib/utils';

interface KanbanBoardProps {
  tasks: Task[];
  onCreateTask: (title: string, status: TaskStatus) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
  onOpenTask: (task: Task) => void;
  onOpenNewTask: (status: TaskStatus) => void;
}

const COLUMNS: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'backlog', title: 'Backlog', color: 'bg-gray-500' },
  { status: 'todo', title: 'To Do', color: 'bg-blue-500' },
  { status: 'in-progress', title: 'In Progress', color: 'bg-yellow-500' },
  { status: 'review', title: 'Review', color: 'bg-purple-500' },
  { status: 'done', title: 'Done', color: 'bg-green-500' },
];

export function KanbanBoard({
  tasks,
  onCreateTask,
  onMoveTask,
  onOpenTask,
  onOpenNewTask,
}: KanbanBoardProps) {
  const getTasksByStatus = (status: TaskStatus) =>
    tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.order - b.order);

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {COLUMNS.map((column) => (
        <KanbanColumn
          key={column.status}
          status={column.status}
          title={column.title}
          color={column.color}
          tasks={getTasksByStatus(column.status)}
          onMoveTask={onMoveTask}
          onOpenTask={onOpenTask}
          onOpenNewTask={onOpenNewTask}
        />
      ))}
    </div>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
  onOpenTask: (task: Task) => void;
  onOpenNewTask: (status: TaskStatus) => void;
}

function KanbanColumn({
  status,
  title,
  color,
  tasks,
  onMoveTask,
  onOpenTask,
  onOpenNewTask,
}: KanbanColumnProps) {
  const dropRef = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { id: string; status: TaskStatus }) => {
      if (item.status !== status) {
        const newOrder = tasks.length > 0 ? tasks[tasks.length - 1].order + 1 : 0;
        onMoveTask(item.id, status, newOrder);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Connect the ref to the drop target
  drop(dropRef);

  return (
    <div
      ref={dropRef}
      className={cn(
        'flex-shrink-0 w-80 flex flex-col bg-muted/50 rounded-lg',
        isOver && 'ring-2 ring-primary'
      )}
    >
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded-full', color)} />
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="secondary" className="ml-1">
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onOpenNewTask(status)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              onOpenTask={onOpenTask}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  index: number;
  onOpenTask: (task: Task) => void;
}

function TaskCard({ task, index, onOpenTask }: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'TASK',
    item: { id: task.id, status: task.status, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Connect refs to drag and preview
  preview(cardRef);
  drag(dragHandleRef);

  return (
    <Card
      ref={cardRef}
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'opacity-50'
      )}
      onClick={() => onOpenTask(task)}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div
            ref={dragHandleRef}
            className="mt-1 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="font-medium text-sm">{task.title}</p>
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.dueDate)}
                </div>
              )}
              {task.attachments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {task.attachments.length}
                </div>
              )}
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                0
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  task.priority === 'urgent' && 'bg-red-100 text-red-800',
                  task.priority === 'high' && 'bg-orange-100 text-orange-800',
                  task.priority === 'medium' && 'bg-blue-100 text-blue-800',
                  task.priority === 'low' && 'bg-gray-100 text-gray-800'
                )}
              >
                {task.priority}
              </Badge>
              {task.assigneeId && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {task.assigneeId[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
