'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/firebase/notifications';
import { Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  MoreVertical,
  UserPlus,
  MessageSquare,
  FileText,
  ClipboardList,
  AlertCircle,
  Info,
  Settings,
  Users,
} from 'lucide-react';
import { formatRelativeTime, cn } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { notifications, setNotifications, markAsRead, markAllAsRead, removeNotification } =
    useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.id, setNotifications);

    return () => unsubscribe();
  }, [user, setNotifications]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) return;

    await markNotificationAsRead(notification.id);
    markAsRead(notification.id);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    await markAllNotificationsAsRead(user.id);
    markAllAsRead();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
    removeNotification(notificationId);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <ClipboardList className="h-5 w-5 text-blue-500" />;
      case 'task_comment':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'task_due':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'file_shared':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'team_invite':
        return <UserPlus className="h-5 w-5 text-indigo-500" />;
      case 'mention':
        return <MessageSquare className="h-5 w-5 text-pink-500" />;
      case 'project_update':
        return <Info className="h-5 w-5 text-cyan-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification): string | null => {
    const { type, data } = notification;

    switch (type) {
      case 'task_assigned':
      case 'task_comment':
      case 'task_due':
        return data?.projectId ? `/dashboard/projects/${data.projectId}` : null;
      case 'file_shared':
        return '/dashboard/files';
      case 'team_invite':
        return '/dashboard/team';
      case 'mention':
        return data?.channelId ? '/dashboard/chat' : null;
      case 'project_update':
        return data?.projectId ? `/dashboard/projects/${data.projectId}` : null;
      default:
        return null;
    }
  };

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const groupNotificationsByDate = (notifs: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    notifs.forEach((notification) => {
      const date = new Date(notification.createdAt);
      date.setHours(0, 0, 0, 0);

      let key: string;
      if (date.getTime() === today.getTime()) {
        key = 'Today';
      } else if (date.getTime() === yesterday.getTime()) {
        key = 'Yesterday';
      } else if (date >= thisWeek) {
        key = 'This Week';
      } else {
        key = 'Older';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-2">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <Card>
            <CardContent className="p-0">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-muted-foreground">
                    {filter === 'unread'
                      ? "You're all caught up! No unread notifications."
                      : "You don't have any notifications yet."}
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  {Object.entries(groupedNotifications).map(([date, notifs]) => (
                    <div key={date}>
                      <div className="px-4 py-2 bg-muted/50 text-sm font-medium text-muted-foreground sticky top-0">
                        {date}
                      </div>
                      {notifs.map((notification) => {
                        const link = getNotificationLink(notification);
                        const NotificationContent = (
                          <div
                            className={cn(
                              'flex items-start gap-4 p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer',
                              !notification.read && 'bg-primary/5'
                            )}
                            onClick={() => handleMarkAsRead(notification)}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p
                                    className={cn(
                                      'text-sm',
                                      !notification.read && 'font-semibold'
                                    )}
                                  >
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {notification.message}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatRelativeTime(notification.createdAt)}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.read && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification);
                                    }}
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Mark as read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notification.id);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );

                        return link ? (
                          <Link key={notification.id} href={link}>
                            {NotificationContent}
                          </Link>
                        ) : (
                          <div key={notification.id}>{NotificationContent}</div>
                        );
                      })}
                    </div>
                  ))}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
