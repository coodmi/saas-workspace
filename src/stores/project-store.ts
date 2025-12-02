import { create } from 'zustand';
import { Project, Task, TaskStatus } from '@/types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  selectedTask: Task | null;
  tasksByStatus: Record<TaskStatus, Task[]>;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
  reset: () => void;
}

const groupTasksByStatus = (tasks: Task[]): Record<TaskStatus, Task[]> => {
  const statuses: TaskStatus[] = ['backlog', 'todo', 'in-progress', 'review', 'done'];
  const grouped = statuses.reduce((acc, status) => {
    acc[status] = tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.order - b.order);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);
  return grouped;
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  tasks: [],
  selectedTask: null,
  tasksByStatus: {
    backlog: [],
    todo: [],
    'in-progress': [],
    review: [],
    done: [],
  },
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setTasks: (tasks) => set({ tasks, tasksByStatus: groupTasksByStatus(tasks) }),
  setSelectedTask: (selectedTask) => set({ selectedTask }),
  addTask: (task) => {
    const tasks = [...get().tasks, task];
    set({ tasks, tasksByStatus: groupTasksByStatus(tasks) });
  },
  updateTask: (taskId, updates) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    );
    set({ tasks, tasksByStatus: groupTasksByStatus(tasks) });
  },
  deleteTask: (taskId) => {
    const tasks = get().tasks.filter((t) => t.id !== taskId);
    set({ tasks, tasksByStatus: groupTasksByStatus(tasks) });
  },
  moveTask: (taskId, newStatus, newOrder) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus, order: newOrder } : t
    );
    set({ tasks, tasksByStatus: groupTasksByStatus(tasks) });
  },
  reset: () =>
    set({
      projects: [],
      currentProject: null,
      tasks: [],
      selectedTask: null,
      tasksByStatus: {
        backlog: [],
        todo: [],
        'in-progress': [],
        review: [],
        done: [],
      },
    }),
}));
