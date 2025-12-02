'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getTeamActivityLogs } from '@/lib/firebase/teams';
import { TeamActivity } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  UserPlus,
  UserMinus,
  FolderPlus,
  FileUp,
  CheckSquare,
  MessageSquare,
  Settings,
  Shield,
  Loader2,
} from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';

const actionIcons: Record<string, React.ReactNode> = {
  member_joined: <UserPlus className="h-4 w-4 text-green-500" />,
  member_removed: <UserMinus className="h-4 w-4 text-red-500" />,
  member_role_changed: <Shield className="h-4 w-4 text-blue-500" />,
  project_created: <FolderPlus className="h-4 w-4 text-purple-500" />,
  project_updated: <Settings className="h-4 w-4 text-orange-500" />,
  task_created: <CheckSquare className="h-4 w-4 text-blue-500" />,
  task_completed: <CheckSquare className="h-4 w-4 text-green-500" />,
  file_uploaded: <FileUp className="h-4 w-4 text-cyan-500" />,
  comment_added: <MessageSquare className="h-4 w-4 text-yellow-500" />,
  settings_updated: <Settings className="h-4 w-4 text-gray-500" />,
};

const actionLabels: Record<string, string> = {
  member_joined: 'joined the team',
  member_removed: 'was removed from the team',
  member_role_changed: 'role was changed',
  project_created: 'created a project',
  project_updated: 'updated a project',
  task_created: 'created a task',
  task_completed: 'completed a task',
  file_uploaded: 'uploaded a file',
  comment_added: 'added a comment',
  settings_updated: 'updated team settings',
};

export default function ActivityPage() {
  const { currentTeam } = useAuthStore();
  const [logs, setLogs] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (currentTeam) {
      loadActivityLogs();
    }
  }, [currentTeam]);

  const loadActivityLogs = async () => {
    if (!currentTeam) return;
    setLoading(true);
    try {
      const data = await getTeamActivityLogs(currentTeam.id);
      setLogs(data);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter((log) => log.action.includes(filter));

  const groupLogsByDate = (logs: TeamActivity[]) => {
    const groups: { [key: string]: TeamActivity[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    logs.forEach((log) => {
      const date = new Date(log.createdAt);
      date.setHours(0, 0, 0, 0);

      let key: string;
      if (date.getTime() === today.getTime()) {
        key = 'Today';
      } else if (date.getTime() === yesterday.getTime()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(log);
    });

    return groups;
  };

  const groupedLogs = groupLogsByDate(filteredLogs);

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Team Selected</h2>
          <p className="text-muted-foreground">
            Please select a team to view activity logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground">Track all actions and changes in your team</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="member">Team Members</SelectItem>
            <SelectItem value="project">Projects</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="file">Files</SelectItem>
            <SelectItem value="comment">Comments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            A log of all actions performed by team members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(groupedLogs).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              {Object.entries(groupedLogs).map(([date, logs]) => (
                <div key={date} className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">{date}</h3>
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(log.userId)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{log.userId}</span>
                            <span className="text-muted-foreground">
                              {actionLabels[log.action] || log.action}
                            </span>
                            {(log.details as Record<string, string>)?.name && (
                              <Badge variant="secondary" className="font-normal">
                                {(log.details as Record<string, string>).name}
                              </Badge>
                            )}
                          </div>
                          {(log.details as Record<string, string>)?.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {(log.details as Record<string, string>).description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(log.createdAt)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {actionIcons[log.action] || <Activity className="h-4 w-4 text-gray-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
