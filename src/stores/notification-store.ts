import { create } from 'zustand';
import { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  setIsOpen: (isOpen: boolean) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount });
  },
  addNotification: (notification) => {
    const notifications = [notification, ...get().notifications];
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount });
  },
  markAsRead: (notificationId) => {
    const notifications = get().notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount });
  },
  markAllAsRead: () => {
    const notifications = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications, unreadCount: 0 });
  },
  deleteNotification: (notificationId) => {
    const notifications = get().notifications.filter(
      (n) => n.id !== notificationId
    );
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount });
  },
  removeNotification: (notificationId) => {
    const notifications = get().notifications.filter(
      (n) => n.id !== notificationId
    );
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount });
  },
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
  setIsOpen: (isOpen) => set({ isOpen }),
  reset: () => set({ notifications: [], unreadCount: 0, isOpen: false }),
}));
