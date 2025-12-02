import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Notification, NotificationType } from '@/types';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, unknown> = {}
): Promise<Notification> {
  const notificationRef = doc(collection(db, 'notifications'));
  const now = new Date();

  const notificationData = {
    userId,
    type,
    title,
    message,
    data,
    read: false,
    createdAt: serverTimestamp(),
  };

  await setDoc(notificationRef, notificationData);

  return {
    id: notificationRef.id,
    ...notificationData,
    createdAt: now,
  };
}

export async function getUserNotifications(
  userId: string,
  notificationLimit: number = 50
): Promise<Notification[]> {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(notificationLimit)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      read: data.read,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        read: data.read,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
    callback(notifications);
  });
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const updatePromises = snapshot.docs.map((doc) =>
    updateDoc(doc.ref, { read: true })
  );

  await Promise.all(updatePromises);
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId);
  await deleteDoc(notificationRef);
}

export async function deleteAllNotifications(userId: string): Promise<void> {
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('userId', '==', userId));

  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));

  await Promise.all(deletePromises);
}

// Helper functions to create specific notification types
export async function notifyTeamInvite(
  userId: string,
  teamName: string,
  inviterName: string,
  invitationId: string
): Promise<Notification> {
  return createNotification(
    userId,
    'team_invite',
    'Team Invitation',
    `${inviterName} invited you to join ${teamName}`,
    { invitationId }
  );
}

export async function notifyTaskAssigned(
  userId: string,
  taskTitle: string,
  assignerName: string,
  taskId: string,
  projectId: string
): Promise<Notification> {
  return createNotification(
    userId,
    'task_assigned',
    'Task Assigned',
    `${assignerName} assigned you to "${taskTitle}"`,
    { taskId, projectId }
  );
}

export async function notifyTaskComment(
  userId: string,
  taskTitle: string,
  commenterName: string,
  taskId: string,
  projectId: string
): Promise<Notification> {
  return createNotification(
    userId,
    'task_comment',
    'New Comment',
    `${commenterName} commented on "${taskTitle}"`,
    { taskId, projectId }
  );
}

export async function notifyFileShared(
  userId: string,
  fileName: string,
  sharerName: string,
  fileId: string
): Promise<Notification> {
  return createNotification(
    userId,
    'file_shared',
    'File Shared',
    `${sharerName} shared "${fileName}" with you`,
    { fileId }
  );
}

export async function notifyMention(
  userId: string,
  mentionerName: string,
  context: string,
  channelId?: string,
  messageId?: string
): Promise<Notification> {
  return createNotification(
    userId,
    'mention',
    'You were mentioned',
    `${mentionerName} mentioned you in ${context}`,
    { channelId, messageId }
  );
}
