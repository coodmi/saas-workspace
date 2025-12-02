import { create } from 'zustand';
import { Channel, DirectMessage, Message, TypingIndicator } from '@/types';

interface ChatState {
  channels: Channel[];
  directMessages: DirectMessage[];
  currentChannel: Channel | null;
  currentDM: DirectMessage | null;
  messages: Message[];
  typingIndicators: TypingIndicator[];
  unreadCounts: Record<string, number>;
  setChannels: (channels: Channel[]) => void;
  setDirectMessages: (dms: DirectMessage[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setCurrentDM: (dm: DirectMessage | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  setTypingIndicators: (indicators: TypingIndicator[]) => void;
  addTypingIndicator: (indicator: TypingIndicator) => void;
  removeTypingIndicator: (userId: string, channelId?: string, dmId?: string) => void;
  setUnreadCount: (id: string, count: number) => void;
  incrementUnreadCount: (id: string) => void;
  markAsRead: (id: string) => void;
  addReaction: (messageId: string, emoji: string, userId: string) => void;
  removeReaction: (messageId: string, emoji: string, userId: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [],
  directMessages: [],
  currentChannel: null,
  currentDM: null,
  messages: [],
  typingIndicators: [],
  unreadCounts: {},
  setChannels: (channels) => set({ channels }),
  setDirectMessages: (directMessages) => set({ directMessages }),
  setCurrentChannel: (currentChannel) =>
    set({ currentChannel, currentDM: null }),
  setCurrentDM: (currentDM) => set({ currentDM, currentChannel: null }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set({ messages: [...get().messages, message] }),
  updateMessage: (messageId, updates) => {
    const messages = get().messages.map((m) =>
      m.id === messageId ? { ...m, ...updates } : m
    );
    set({ messages });
  },
  deleteMessage: (messageId) => {
    set({ messages: get().messages.filter((m) => m.id !== messageId) });
  },
  setTypingIndicators: (typingIndicators) => set({ typingIndicators }),
  addTypingIndicator: (indicator) => {
    const { typingIndicators } = get();
    const existing = typingIndicators.find(
      (t) =>
        t.userId === indicator.userId &&
        t.channelId === indicator.channelId &&
        t.directMessageId === indicator.directMessageId
    );
    if (!existing) {
      set({ typingIndicators: [...typingIndicators, indicator] });
    }
  },
  removeTypingIndicator: (userId, channelId, dmId) => {
    set({
      typingIndicators: get().typingIndicators.filter(
        (t) =>
          !(
            t.userId === userId &&
            t.channelId === channelId &&
            t.directMessageId === dmId
          )
      ),
    });
  },
  setUnreadCount: (id, count) =>
    set({ unreadCounts: { ...get().unreadCounts, [id]: count } }),
  incrementUnreadCount: (id) => {
    const { unreadCounts } = get();
    set({ unreadCounts: { ...unreadCounts, [id]: (unreadCounts[id] || 0) + 1 } });
  },
  markAsRead: (id) => {
    const { unreadCounts } = get();
    set({ unreadCounts: { ...unreadCounts, [id]: 0 } });
  },
  addReaction: (messageId, emoji, userId) => {
    const messages = get().messages.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = [...m.reactions];
      const existingReaction = reactions.find((r) => r.emoji === emoji);
      if (existingReaction) {
        if (!existingReaction.userIds.includes(userId)) {
          existingReaction.userIds.push(userId);
        }
      } else {
        reactions.push({ emoji, userIds: [userId] });
      }
      return { ...m, reactions };
    });
    set({ messages });
  },
  removeReaction: (messageId, emoji, userId) => {
    const messages = get().messages.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = m.reactions
        .map((r) => {
          if (r.emoji !== emoji) return r;
          return { ...r, userIds: r.userIds.filter((id) => id !== userId) };
        })
        .filter((r) => r.userIds.length > 0);
      return { ...m, reactions };
    });
    set({ messages });
  },
  reset: () =>
    set({
      channels: [],
      directMessages: [],
      currentChannel: null,
      currentDM: null,
      messages: [],
      typingIndicators: [],
      unreadCounts: {},
    }),
}));
