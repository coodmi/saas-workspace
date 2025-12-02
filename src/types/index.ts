// User Types
export type UserRole = 'admin' | 'member' | 'guest' | 'viewer';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id?: string;
  odId?: string;
  userId: string;
  role: UserRole;
  joinedAt: Date;
  invitedBy: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
  settings: TeamSettings;
}

export interface TeamSettings {
  allowGuestAccess: boolean;
  defaultMemberRole: UserRole;
  notificationsEnabled: boolean;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
}

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

// Project & Task Types
export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  color: string;
  ownerId: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  teamId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  creatorId: string;
  dueDate?: Date;
  tags: string[];
  attachments: TaskAttachment[];
  checklist: ChecklistItem[];
  watchers: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  attachments: TaskAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

// File Manager Types
export interface Folder {
  id: string;
  teamId: string;
  name: string;
  parentId?: string;
  createdBy: string;
  sharedWith: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FileItem {
  id: string;
  teamId: string;
  folderId?: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storagePath: string;
  uploadedBy: string;
  sharedWith: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Chat Types
export interface Channel {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdBy: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DirectMessage {
  id: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  channelId?: string;
  directMessageId?: string;
  senderId: string;
  content: string;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface TypingIndicator {
  channelId?: string;
  directMessageId?: string;
  userId: string;
  timestamp: Date;
}

// Notification Types
export type NotificationType = 
  | 'team_invite'
  | 'task_assigned'
  | 'task_comment'
  | 'task_updated'
  | 'task_due'
  | 'file_shared'
  | 'mention'
  | 'channel_invite'
  | 'project_update';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

// Activity Log type alias for backwards compatibility
export type ActivityLog = TeamActivity;
