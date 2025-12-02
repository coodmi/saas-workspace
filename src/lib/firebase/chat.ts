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
  onSnapshot,
  limit,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Channel, DirectMessage, Message, TypingIndicator } from '@/types';

// Channel Operations
export async function createChannel(
  teamId: string,
  name: string,
  createdBy: string,
  isPrivate: boolean = false,
  description?: string
): Promise<Channel> {
  const channelRef = doc(collection(db, 'channels'));
  const now = new Date();

  const channelData = {
    teamId,
    name,
    description: description || '',
    isPrivate,
    createdBy,
    memberIds: [createdBy],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(channelRef, channelData);

  return {
    id: channelRef.id,
    ...channelData,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getChannel(channelId: string): Promise<Channel | null> {
  const channelRef = doc(db, 'channels', channelId);
  const channelSnap = await getDoc(channelRef);

  if (!channelSnap.exists()) return null;

  const data = channelSnap.data();
  return {
    id: channelSnap.id,
    teamId: data.teamId,
    name: data.name,
    description: data.description,
    isPrivate: data.isPrivate,
    createdBy: data.createdBy,
    memberIds: data.memberIds,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export async function getTeamChannels(teamId: string): Promise<Channel[]> {
  const channelsRef = collection(db, 'channels');
  const q = query(
    channelsRef,
    where('teamId', '==', teamId),
    orderBy('name', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      teamId: data.teamId,
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate,
      createdBy: data.createdBy,
      memberIds: data.memberIds,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  });
}

export async function updateChannel(
  channelId: string,
  updates: Partial<Pick<Channel, 'name' | 'description' | 'isPrivate' | 'memberIds'>>
): Promise<void> {
  const channelRef = doc(db, 'channels', channelId);
  await updateDoc(channelRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteChannel(channelId: string): Promise<void> {
  const channelRef = doc(db, 'channels', channelId);
  await deleteDoc(channelRef);
}

export async function addChannelMember(
  channelId: string,
  userId: string
): Promise<void> {
  const channel = await getChannel(channelId);
  if (!channel) throw new Error('Channel not found');

  if (!channel.memberIds.includes(userId)) {
    await updateChannel(channelId, {
      memberIds: [...channel.memberIds, userId],
    });
  }
}

export async function removeChannelMember(
  channelId: string,
  userId: string
): Promise<void> {
  const channel = await getChannel(channelId);
  if (!channel) throw new Error('Channel not found');

  await updateChannel(channelId, {
    memberIds: channel.memberIds.filter((id) => id !== userId),
  });
}

// Direct Message Operations
export async function getOrCreateDirectMessage(
  userId1: string,
  userId2: string
): Promise<DirectMessage> {
  const dmsRef = collection(db, 'directMessages');
  
  // Check if DM already exists
  const q = query(
    dmsRef,
    where('participants', 'array-contains', userId1)
  );

  const snapshot = await getDocs(q);
  const existingDM = snapshot.docs.find((doc) => {
    const participants = doc.data().participants;
    return participants.includes(userId2);
  });

  if (existingDM) {
    const data = existingDM.data();
    return {
      id: existingDM.id,
      participants: data.participants,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  // Create new DM
  const dmRef = doc(collection(db, 'directMessages'));
  const now = new Date();

  const dmData = {
    participants: [userId1, userId2].sort(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(dmRef, dmData);

  return {
    id: dmRef.id,
    ...dmData,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getUserDirectMessages(
  userId: string
): Promise<DirectMessage[]> {
  const dmsRef = collection(db, 'directMessages');
  const q = query(
    dmsRef,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      participants: data.participants,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  });
}

// Message Operations
export async function sendMessage(
  senderId: string,
  content: string,
  channelId?: string,
  directMessageId?: string,
  attachments: Message['attachments'] = []
): Promise<Message> {
  if (!channelId && !directMessageId) {
    throw new Error('Either channelId or directMessageId must be provided');
  }

  const messagesRef = collection(db, 'messages');
  const messageRef = doc(messagesRef);
  const now = new Date();

  const messageData = {
    channelId: channelId || null,
    directMessageId: directMessageId || null,
    senderId,
    content,
    attachments,
    reactions: [],
    readBy: [senderId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(messageRef, messageData);

  // Update the channel or DM's updatedAt
  if (channelId) {
    await updateDoc(doc(db, 'channels', channelId), {
      updatedAt: serverTimestamp(),
    });
  } else if (directMessageId) {
    await updateDoc(doc(db, 'directMessages', directMessageId), {
      updatedAt: serverTimestamp(),
    });
  }

  return {
    id: messageRef.id,
    ...messageData,
    channelId,
    directMessageId,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getMessages(
  channelId?: string,
  directMessageId?: string,
  messageLimit: number = 50
): Promise<Message[]> {
  const messagesRef = collection(db, 'messages');
  let q;

  if (channelId) {
    q = query(
      messagesRef,
      where('channelId', '==', channelId),
      orderBy('createdAt', 'desc'),
      limit(messageLimit)
    );
  } else if (directMessageId) {
    q = query(
      messagesRef,
      where('directMessageId', '==', directMessageId),
      orderBy('createdAt', 'desc'),
      limit(messageLimit)
    );
  } else {
    return [];
  }

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        channelId: data.channelId,
        directMessageId: data.directMessageId,
        senderId: data.senderId,
        content: data.content,
        attachments: data.attachments || [],
        reactions: data.reactions || [],
        readBy: data.readBy || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    })
    .reverse();
}

export function subscribeToMessages(
  callback: (messages: Message[]) => void,
  channelId?: string,
  directMessageId?: string
) {
  const messagesRef = collection(db, 'messages');
  let q;

  if (channelId) {
    q = query(
      messagesRef,
      where('channelId', '==', channelId),
      orderBy('createdAt', 'asc')
    );
  } else if (directMessageId) {
    q = query(
      messagesRef,
      where('directMessageId', '==', directMessageId),
      orderBy('createdAt', 'asc')
    );
  } else {
    return () => {};
  }

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        channelId: data.channelId,
        directMessageId: data.directMessageId,
        senderId: data.senderId,
        content: data.content,
        attachments: data.attachments || [],
        reactions: data.reactions || [],
        readBy: data.readBy || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
    callback(messages);
  });
}

export async function updateMessage(
  messageId: string,
  content: string
): Promise<void> {
  const messageRef = doc(db, 'messages', messageId);
  await updateDoc(messageRef, {
    content,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMessage(messageId: string): Promise<void> {
  const messageRef = doc(db, 'messages', messageId);
  await deleteDoc(messageRef);
}

export async function addReaction(
  messageId: string,
  emoji: string,
  userId: string
): Promise<void> {
  const messageRef = doc(db, 'messages', messageId);
  const messageSnap = await getDoc(messageRef);

  if (!messageSnap.exists()) throw new Error('Message not found');

  const message = messageSnap.data();
  const reactions = [...(message.reactions || [])];

  const existingReaction = reactions.find((r) => r.emoji === emoji);
  if (existingReaction) {
    if (!existingReaction.userIds.includes(userId)) {
      existingReaction.userIds.push(userId);
    }
  } else {
    reactions.push({ emoji, userIds: [userId] });
  }

  await updateDoc(messageRef, { reactions });
}

export async function removeReaction(
  messageId: string,
  emoji: string,
  userId: string
): Promise<void> {
  const messageRef = doc(db, 'messages', messageId);
  const messageSnap = await getDoc(messageRef);

  if (!messageSnap.exists()) throw new Error('Message not found');

  const message = messageSnap.data();
  const reactions = (message.reactions || [])
    .map((r: { emoji: string; userIds: string[] }) => {
      if (r.emoji !== emoji) return r;
      return { ...r, userIds: r.userIds.filter((id: string) => id !== userId) };
    })
    .filter((r: { emoji: string; userIds: string[] }) => r.userIds.length > 0);

  await updateDoc(messageRef, { reactions });
}

export async function markMessageAsRead(
  messageId: string,
  userId: string
): Promise<void> {
  const messageRef = doc(db, 'messages', messageId);
  const messageSnap = await getDoc(messageRef);

  if (!messageSnap.exists()) return;

  const message = messageSnap.data();
  const readBy = message.readBy || [];

  if (!readBy.includes(userId)) {
    await updateDoc(messageRef, {
      readBy: [...readBy, userId],
    });
  }
}

// Typing Indicators
export async function setTypingIndicator(
  userId: string,
  channelId?: string,
  directMessageId?: string
): Promise<void> {
  const indicatorId = `${userId}_${channelId || directMessageId}`;
  const indicatorRef = doc(db, 'typingIndicators', indicatorId);

  await setDoc(indicatorRef, {
    userId,
    channelId: channelId || null,
    directMessageId: directMessageId || null,
    timestamp: serverTimestamp(),
  });

  // Auto-remove after 3 seconds
  setTimeout(async () => {
    try {
      await deleteDoc(indicatorRef);
    } catch (error) {
      // Ignore errors
    }
  }, 3000);
}

export function subscribeToTypingIndicators(
  callback: (indicators: TypingIndicator[]) => void,
  channelId?: string,
  directMessageId?: string
) {
  const indicatorsRef = collection(db, 'typingIndicators');
  let q;

  if (channelId) {
    q = query(indicatorsRef, where('channelId', '==', channelId));
  } else if (directMessageId) {
    q = query(indicatorsRef, where('directMessageId', '==', directMessageId));
  } else {
    return () => {};
  }

  return onSnapshot(q, (snapshot) => {
    const now = new Date();
    const indicators = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          userId: data.userId,
          channelId: data.channelId,
          directMessageId: data.directMessageId,
          timestamp: data.timestamp?.toDate() || new Date(),
        };
      })
      // Filter out old indicators (> 5 seconds)
      .filter((indicator) => now.getTime() - indicator.timestamp.getTime() < 5000);
    callback(indicators);
  });
}
