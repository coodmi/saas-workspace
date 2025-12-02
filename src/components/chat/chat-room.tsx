'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import {
  subscribeToMessages,
  sendMessage,
  addReaction,
  removeReaction,
  setTypingIndicator,
  subscribeToTypingIndicators,
  markMessageAsRead,
} from '@/lib/firebase/chat';
import { Channel, DirectMessage, Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Hash,
  Lock,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Reply,
  Edit,
  Trash2,
  Users,
  Settings,
} from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';

interface ChatRoomProps {
  channel: Channel | null;
  directMessage: DirectMessage | null;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀'];

export function ChatRoom({ channel, directMessage }: ChatRoomProps) {
  const { user } = useAuthStore();
  const { messages, setMessages, typingIndicators, setTypingIndicators, markAsRead } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!channel && !directMessage) return;

    const unsubMessages = subscribeToMessages(
      setMessages,
      channel?.id,
      directMessage?.id
    );

    const unsubTyping = subscribeToTypingIndicators(
      setTypingIndicators,
      channel?.id,
      directMessage?.id
    );

    // Mark as read
    if (channel) {
      markAsRead(channel.id);
    } else if (directMessage) {
      markAsRead(directMessage.id);
    }

    return () => {
      unsubMessages();
      unsubTyping();
    };
  }, [channel, directMessage, setMessages, setTypingIndicators, markAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user) return;

    setSending(true);
    try {
      await sendMessage(
        user.id,
        messageInput.trim(),
        channel?.id,
        directMessage?.id
      );
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Send typing indicator
    if (user) {
      setTypingIndicator(user.id, channel?.id, directMessage?.id);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const existingReaction = message.reactions.find((r) => r.emoji === emoji);
    const hasReacted = existingReaction?.userIds.includes(user.id);

    if (hasReacted) {
      await removeReaction(messageId, emoji, user.id);
    } else {
      await addReaction(messageId, emoji, user.id);
    }
  };

  const otherTypingUsers = typingIndicators.filter(
    (indicator) => indicator.userId !== user?.id
  );

  const roomTitle = channel?.name || 'Direct Message';
  const roomDescription = channel?.description || '';

  return (
    <>
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {channel?.isPrivate ? (
            <Lock className="h-5 w-5 text-muted-foreground" />
          ) : channel ? (
            <Hash className="h-5 w-5 text-muted-foreground" />
          ) : null}
          <div>
            <h2 className="font-semibold">{roomTitle}</h2>
            {roomDescription && (
              <p className="text-xs text-muted-foreground">{roomDescription}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {channel && (
            <Button variant="ghost" size="icon">
              <Users className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showAvatar =
                index === 0 ||
                messages[index - 1].senderId !== message.senderId;
              const showTimestamp =
                index === 0 ||
                new Date(message.createdAt).getTime() -
                  new Date(messages[index - 1].createdAt).getTime() >
                  300000; // 5 minutes

              return (
                <div key={message.id} className="group">
                  {showTimestamp && (
                    <div className="flex items-center gap-4 my-4">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(message.createdAt)}
                      </span>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  <div className="flex gap-3 hover:bg-muted/30 rounded-lg p-2 -mx-2">
                    {showAvatar ? (
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(message.senderId)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10" />
                    )}
                    <div className="flex-1">
                      {showAvatar && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {message.senderId}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                      {/* Reactions */}
                      {message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.reactions.map((reaction) => (
                            <button
                              key={reaction.emoji}
                              onClick={() =>
                                handleReaction(message.id, reaction.emoji)
                              }
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                                reaction.userIds.includes(user?.id || '')
                                  ? 'bg-primary/10 border-primary'
                                  : 'bg-muted border-transparent'
                              }`}
                            >
                              <span>{reaction.emoji}</span>
                              <span>{reaction.userIds.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Message Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Smile className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" side="top">
                          <div className="flex gap-1">
                            {EMOJI_LIST.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() =>
                                  handleReaction(message.id, emoji)
                                }
                                className="p-1 hover:bg-muted rounded"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Reply className="mr-2 h-4 w-4" />
                            Reply
                          </DropdownMenuItem>
                          {message.senderId === user?.id && (
                            <>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Typing Indicator */}
      {otherTypingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-muted-foreground">
          <span className="animate-pulse">
            {otherTypingUsers.length === 1
              ? `${otherTypingUsers[0].userId} is typing...`
              : `${otherTypingUsers.length} people are typing...`}
          </span>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            placeholder={`Message ${channel ? `#${channel.name}` : ''}`}
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side="top">
              <div className="flex gap-1">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setMessageInput((prev) => prev + emoji)}
                    className="p-1 hover:bg-muted rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={handleSendMessage} disabled={sending || !messageInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
