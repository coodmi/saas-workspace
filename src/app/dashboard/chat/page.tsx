'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import {
  getTeamChannels,
  getUserDirectMessages,
  createChannel,
} from '@/lib/firebase/chat';
import { Channel, DirectMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Hash, Plus, Lock, MessageSquare, Users, Loader2 } from 'lucide-react';
import { ChatRoom } from '@/components/chat/chat-room';
import { getInitials } from '@/lib/utils';

export default function ChatPage() {
  const { user, currentTeam } = useAuthStore();
  const {
    channels,
    directMessages,
    currentChannel,
    currentDM,
    unreadCounts,
    setChannels,
    setDirectMessages,
    setCurrentChannel,
    setCurrentDM,
  } = useChatStore();

  const [loading, setLoading] = useState(true);
  const [newChannelDialogOpen, setNewChannelDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!currentTeam || !user) return;

      try {
        const [teamChannels, userDMs] = await Promise.all([
          getTeamChannels(currentTeam.id),
          getUserDirectMessages(user.id),
        ]);
        setChannels(teamChannels);
        setDirectMessages(userDMs);

        // Auto-select first channel if none selected
        if (!currentChannel && !currentDM && teamChannels.length > 0) {
          setCurrentChannel(teamChannels[0]);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentTeam, user, currentChannel, currentDM, setChannels, setDirectMessages, setCurrentChannel]);

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !currentTeam || !user) return;

    setCreating(true);
    try {
      const channel = await createChannel(
        currentTeam.id,
        newChannelName,
        user.id,
        newChannelPrivate,
        newChannelDescription
      );
      setChannels([...channels, channel]);
      setCurrentChannel(channel);
      setNewChannelDialogOpen(false);
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelPrivate(false);
    } catch (error) {
      console.error('Error creating channel:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    setCurrentDM(null);
  };

  const handleSelectDM = (dm: DirectMessage) => {
    setCurrentDM(dm);
    setCurrentChannel(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-lg border overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r flex flex-col">
        {/* Channels */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground uppercase">
              Channels
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setNewChannelDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-40">
            <div className="space-y-1">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={currentChannel?.id === channel.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleSelectChannel(channel)}
                >
                  {channel.isPrivate ? (
                    <Lock className="mr-2 h-4 w-4" />
                  ) : (
                    <Hash className="mr-2 h-4 w-4" />
                  )}
                  <span className="truncate">{channel.name}</span>
                  {unreadCounts[channel.id] > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadCounts[channel.id]}
                    </Badge>
                  )}
                </Button>
              ))}
              {channels.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No channels yet
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Direct Messages */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground uppercase">
              Direct Messages
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-full">
            <div className="space-y-1">
              {directMessages.map((dm) => {
                const otherUserId = dm.participants.find((id) => id !== user?.id);
                return (
                  <Button
                    key={dm.id}
                    variant={currentDM?.id === dm.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => handleSelectDM(dm)}
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className="text-xs">
                        {otherUserId ? getInitials(otherUserId) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{otherUserId || 'Unknown'}</span>
                    {unreadCounts[dm.id] > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {unreadCounts[dm.id]}
                      </Badge>
                    )}
                  </Button>
                );
              })}
              {directMessages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No conversations yet
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChannel || currentDM ? (
          <ChatRoom
            channel={currentChannel}
            directMessage={currentDM}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a channel or conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* New Channel Dialog */}
      <Dialog open={newChannelDialogOpen} onOpenChange={setNewChannelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
            <DialogDescription>
              Create a new channel for your team to collaborate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channelName">Channel Name</Label>
              <Input
                id="channelName"
                placeholder="e.g. project-updates"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channelDescription">Description (optional)</Label>
              <Input
                id="channelDescription"
                placeholder="What's this channel about?"
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="private">Private Channel</Label>
                <p className="text-sm text-muted-foreground">
                  Only invited members can see this channel
                </p>
              </div>
              <Switch
                id="private"
                checked={newChannelPrivate}
                onCheckedChange={setNewChannelPrivate}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewChannelDialogOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateChannel} disabled={creating}>
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
