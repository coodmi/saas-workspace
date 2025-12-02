import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  addDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Project, Task, TaskComment, TaskStatus, TaskPriority } from '@/types';

// Project CRUD Operations
export async function createProject(
  teamId: string,
  name: string,
  description: string,
  color: string,
  ownerId: string
): Promise<Project> {
  const projectRef = doc(collection(db, 'projects'));
  const now = new Date();

  const projectData = {
    teamId,
    name,
    description,
    color,
    ownerId,
    memberIds: [ownerId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(projectRef, projectData);

  return {
    id: projectRef.id,
    ...projectData,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getProject(projectId: string): Promise<Project | null> {
  const projectRef = doc(db, 'projects', projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) return null;

  const data = projectSnap.data();
  return {
    id: projectSnap.id,
    teamId: data.teamId,
    name: data.name,
    description: data.description,
    color: data.color,
    ownerId: data.ownerId,
    memberIds: data.memberIds,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export async function getTeamProjects(teamId: string): Promise<Project[]> {
  const projectsRef = collection(db, 'projects');
  try {
    const q = query(
      projectsRef,
      where('teamId', '==', teamId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        teamId: data.teamId,
        name: data.name,
        description: data.description,
        color: data.color,
        ownerId: data.ownerId,
        memberIds: data.memberIds,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    const needsIndex =
      error.code === 'failed-precondition' ||
      (typeof error.message === 'string' && error.message.includes('index'));

    if (needsIndex) {
      console.warn('Firestore index missing for team projects query. Falling back without ordering.');
      // Try without orderBy and sort client-side to avoid blocking the UI
      const fallbackQ = query(projectsRef, where('teamId', '==', teamId));
      const snapshot = await getDocs(fallbackQ);
      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          teamId: data.teamId,
          name: data.name,
          description: data.description,
          color: data.color,
          ownerId: data.ownerId,
          memberIds: data.memberIds,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Project;
      });
      // Sort by createdAt desc on client
      items.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));

      // If Firebase provided a direct index creation link, surface it for admins/developers
      if (error.message && error.message.includes('create it here')) {
        const match = error.message.match(/https?:\/\/[^\s)]+/);
        if (match) {
          console.warn('Create the required composite index here:', match[0]);
        }
      }

      return items;
    }

    // Re-throw unknown errors
    throw err;
  }
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'description' | 'color' | 'memberIds'>>
): Promise<void> {
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  const projectRef = doc(db, 'projects', projectId);
  
  // Also delete all tasks in the project
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  batch.delete(projectRef);
  
  await batch.commit();
}

// Task CRUD Operations
export async function createTask(
  projectId: string,
  teamId: string,
  title: string,
  creatorId: string,
  options?: Partial<Pick<Task, 'description' | 'status' | 'priority' | 'assigneeId' | 'dueDate' | 'tags'>>
): Promise<Task> {
  const taskRef = doc(collection(db, 'tasks'));
  const now = new Date();

  // Get the max order for the status column
  const tasksRef = collection(db, 'tasks');
  let maxOrder = 0;
  try {
    const q = query(
      tasksRef,
      where('projectId', '==', projectId),
      where('status', '==', options?.status || 'todo'),
      orderBy('order', 'desc')
    );
    const snapshot = await getDocs(q);
    maxOrder = snapshot.docs.length > 0 ? snapshot.docs[0].data().order : 0;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    const needsIndex = error.code === 'failed-precondition' || (error.message || '').includes('index');
    if (needsIndex) {
      console.warn('Missing index for tasks order query. Falling back to manual scan.');
      const fallbackQ = query(
        tasksRef,
        where('projectId', '==', projectId),
        where('status', '==', options?.status || 'todo')
      );
      const snapshot = await getDocs(fallbackQ);
      snapshot.docs.forEach((d) => {
        const v = d.data().order;
        if (typeof v === 'number' && v > maxOrder) maxOrder = v;
      });
    } else {
      throw err;
    }
  }

  const taskData = {
    projectId,
    teamId,
    title,
    description: options?.description || '',
    status: options?.status || 'todo' as TaskStatus,
    priority: options?.priority || 'medium' as TaskPriority,
    assigneeId: options?.assigneeId || undefined,
    creatorId,
    dueDate: options?.dueDate ? Timestamp.fromDate(options.dueDate) : null,
    tags: options?.tags || [],
    attachments: [],
    checklist: [],
    watchers: [creatorId],
    order: maxOrder + 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(taskRef, taskData);

  return {
    id: taskRef.id,
    ...taskData,
    assigneeId: options?.assigneeId || undefined,
    dueDate: options?.dueDate || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getTask(taskId: string): Promise<Task | null> {
  const taskRef = doc(db, 'tasks', taskId);
  const taskSnap = await getDoc(taskRef);

  if (!taskSnap.exists()) return null;

  const data = taskSnap.data();
  return {
    id: taskSnap.id,
    projectId: data.projectId,
    teamId: data.teamId,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    assigneeId: data.assigneeId,
    creatorId: data.creatorId,
    dueDate: data.dueDate?.toDate(),
    tags: data.tags,
    attachments: data.attachments,
    checklist: data.checklist,
    watchers: data.watchers,
    order: data.order,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('projectId', '==', projectId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      projectId: data.projectId,
      teamId: data.teamId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId,
      creatorId: data.creatorId,
      dueDate: data.dueDate?.toDate(),
      tags: data.tags,
      attachments: data.attachments || [],
      checklist: data.checklist || [],
      watchers: data.watchers || [],
      order: data.order,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  });
}

export function subscribeToProjectTasks(
  projectId: string,
  callback: (tasks: Task[]) => void
) {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('projectId', '==', projectId));

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        projectId: data.projectId,
        teamId: data.teamId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId,
        creatorId: data.creatorId,
        dueDate: data.dueDate?.toDate(),
        tags: data.tags,
        attachments: data.attachments || [],
        checklist: data.checklist || [],
        watchers: data.watchers || [],
        order: data.order,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
    callback(tasks);
  });
}

export async function updateTask(
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'projectId' | 'teamId' | 'creatorId' | 'createdAt'>>
): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if (updates.dueDate) {
    updateData.dueDate = Timestamp.fromDate(updates.dueDate);
  }

  await updateDoc(taskRef, updateData);
}

export async function deleteTask(taskId: string): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);
}

export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number
): Promise<void> {
  await updateTask(taskId, { status: newStatus, order: newOrder });
}

// Task Comments
export async function addTaskComment(
  taskId: string,
  userId: string,
  content: string
): Promise<TaskComment> {
  const commentRef = doc(collection(db, 'tasks', taskId, 'comments'));
  const now = new Date();

  const commentData = {
    taskId,
    userId,
    content,
    attachments: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(commentRef, commentData);

  return {
    id: commentRef.id,
    ...commentData,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const commentsRef = collection(db, 'tasks', taskId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      taskId: data.taskId,
      userId: data.userId,
      content: data.content,
      attachments: data.attachments || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  });
}

export function subscribeToTaskComments(
  taskId: string,
  callback: (comments: TaskComment[]) => void
) {
  const commentsRef = collection(db, 'tasks', taskId, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        taskId: data.taskId,
        userId: data.userId,
        content: data.content,
        attachments: data.attachments || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
    callback(comments);
  });
}

// Task Watchers
export async function addTaskWatcher(
  taskId: string,
  userId: string
): Promise<void> {
  const task = await getTask(taskId);
  if (!task) throw new Error('Task not found');

  if (!task.watchers.includes(userId)) {
    await updateTask(taskId, { watchers: [...task.watchers, userId] });
  }
}

export async function removeTaskWatcher(
  taskId: string,
  userId: string
): Promise<void> {
  const task = await getTask(taskId);
  if (!task) throw new Error('Task not found');

  await updateTask(taskId, {
    watchers: task.watchers.filter((id) => id !== userId),
  });
}
