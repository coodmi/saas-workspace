'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getTeamMembers, shareFileWithUsers } from '@/lib/firebase/teams';
import { FileItem, TeamMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Share2, Search, Users, Check, X } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface ShareFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
  onShare?: (userIds: string[]) => void;
}

export function ShareFileDialog({ open, onOpenChange, file, onShare }: ShareFileDialogProps) {
  const { currentTeam, user } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (open && currentTeam) {
      loadMembers();
    }
  }, [open, currentTeam]);

  useEffect(() => {
    if (file) {
      setSelectedUsers(file.sharedWith || []);
    }
  }, [file]);

  const loadMembers = async () => {
    if (!currentTeam) return;
    setLoading(true);
    try {
      const data = await getTeamMembers(currentTeam.id);
      // Filter out current user
      setMembers(data.filter((m) => m.userId !== user?.id));
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (!file) return;
    setSharing(true);
    try {
      await shareFileWithUsers(file.id, selectedUsers);
      onShare?.(selectedUsers);
      onOpenChange(false);
    } catch (error) {
      console.error('Error sharing file:', error);
    } finally {
      setSharing(false);
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedUsers.length === members.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(members.map((m) => m.userId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Share2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Share File</DialogTitle>
          <DialogDescription className="text-center">
            {file?.name && (
              <span className="font-medium text-foreground">{file.name}</span>
            )}
            <br />
            Select team members who can access this file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} selected
            </span>
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedUsers.length === members.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Members list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No team members to share with</p>
            </div>
          ) : (
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredMembers.map((member) => {
                  const isSelected = selectedUsers.includes(member.userId);
                  return (
                    <div
                      key={member.userId}
                      onClick={() => handleToggleUser(member.userId)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleUser(member.userId)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(member.userId)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.userId}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  );
                })}
                {filteredMembers.length === 0 && searchQuery && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No members found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Selected users preview */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.slice(0, 5).map((userId) => (
                <Badge key={userId} variant="secondary" className="gap-1">
                  {userId}
                  <button
                    onClick={() => handleToggleUser(userId)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedUsers.length > 5 && (
                <Badge variant="outline">+{selectedUsers.length - 5} more</Badge>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sharing}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={sharing}>
            {sharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share with {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
