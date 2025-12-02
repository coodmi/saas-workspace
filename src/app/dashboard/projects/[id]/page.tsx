'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectStore } from '@/stores/project-store';
import {
  getProject,
  subscribeToProjectTasks,
  createTask,
  updateTask,
  moveTask,
} from '@/lib/firebase/projects';
import { KanbanBoard } from '@/components/projects/kanban-board';
import { TaskDialog } from '@/components/projects/task-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, LayoutGrid, List, Loader2 } from 'lucide-react';
import { Task, TaskStatus } from '@/types';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuthStore();
  const {
    currentProject,
    setCurrentProject,
    tasks,
    setTasks,
    selectedTask,
    setSelectedTask,
  } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');

  useEffect(() => {
    const loadProject = async () => {
      const project = await getProject(projectId);
      setCurrentProject(project);
      setLoading(false);
    };
    loadProject();

    const unsubscribe = subscribeToProjectTasks(projectId, (projectTasks) => {
      setTasks(projectTasks);
    });

    return () => {
      unsubscribe();
      setCurrentProject(null);
      setTasks([]);
    };
  }, [projectId, setCurrentProject, setTasks]);

  const handleCreateTask = async (title: string, status: TaskStatus) => {
    if (!user || !currentProject) return;

    await createTask(projectId, currentProject.teamId, title, user.id, { status });
  };

  const handleMoveTask = async (
    taskId: string,
    newStatus: TaskStatus,
    newOrder: number
  ) => {
    await moveTask(taskId, newStatus, newOrder);
  };

  const handleOpenNewTask = (status: TaskStatus) => {
    setNewTaskStatus(status);
    setSelectedTask(null);
    setIsTaskDialogOpen(true);
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col space-y-4">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: currentProject.color + '20' }}
            >
              <span
                className="text-lg font-bold"
                style={{ color: currentProject.color }}
              >
                {currentProject.name[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{currentProject.name}</h1>
              <p className="text-muted-foreground">
                {currentProject.description || 'No description'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <Tabs defaultValue="board" className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="board">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Board
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="flex-1 mt-4">
            <KanbanBoard
              tasks={filteredTasks}
              onCreateTask={handleCreateTask}
              onMoveTask={handleMoveTask}
              onOpenTask={handleOpenTask}
              onOpenNewTask={handleOpenNewTask}
            />
          </TabsContent>

          <TabsContent value="list" className="flex-1 mt-4">
            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                  <div className="col-span-5">Task</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Priority</div>
                  <div className="col-span-2">Due Date</div>
                  <div className="col-span-1">Assignee</div>
                </div>
              </div>
              <div className="divide-y">
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No tasks found
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleOpenTask(task)}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 font-medium">{task.title}</div>
                        <div className="col-span-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'done'
                                ? 'bg-green-100 text-green-800'
                                : task.status === 'in-progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : task.status === 'review'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              task.priority === 'urgent'
                                ? 'bg-red-100 text-red-800'
                                : task.priority === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : task.priority === 'medium'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : '-'}
                        </div>
                        <div className="col-span-1">
                          {task.assigneeId ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {task.assigneeId[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Task Dialog */}
        <TaskDialog
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          task={selectedTask}
          defaultStatus={newTaskStatus}
          projectId={projectId}
          teamId={currentProject.teamId}
        />
      </div>
    </DndProvider>
  );
}
