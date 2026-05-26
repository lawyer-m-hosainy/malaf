import { create } from 'zustand';

/* ─── Types ─── */
export interface ChatRoom {
  id: string;
  tenant_id: string;
  name: string;
  type: 'internal' | 'client';
  case_id?: string | null;
  created_by?: string;
  created_at: string;
  // Computed / local state
  lastMessage?: string;
  lastMessageAt?: string;
  online?: boolean;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string | null;
  sender_name?: string;
  content: string;
  attachment_url?: string | null;
  attachment_type?: 'image' | 'pdf' | 'doc' | null;
  is_system: boolean;
  created_at: string;
}

interface ChatStore {
  // State
  activeRoomId: string | null;
  rooms: ChatRoom[];
  messagesCache: Record<string, ChatMessage[]>;
  unreadCounts: Record<string, number>;
  activeVideoCall: string | null;
  onlineUserIds: string[];

  // Actions
  setActiveRoom: (id: string | null) => void;
  setRooms: (rooms: ChatRoom[]) => void;
  setActiveVideoCall: (url: string | null) => void;
  markAsRead: (roomId: string) => void;
  incrementUnread: (roomId: string) => void;
  setOnlineUsers: (ids: string[]) => void;

  // Messages cache
  setMessages: (roomId: string, messages: ChatMessage[]) => void;
  appendMessage: (roomId: string, message: ChatMessage) => void;
  prependMessages: (roomId: string, messages: ChatMessage[]) => void;

  // Room helpers
  updateRoomLastMessage: (roomId: string, content: string, at: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeRoomId: null,
  rooms: [],
  messagesCache: {},
  unreadCounts: {},
  activeVideoCall: null,
  onlineUserIds: [],

  setActiveRoom: (id) => set({ activeRoomId: id }),
  setRooms: (rooms) => set({ rooms }),
  setActiveVideoCall: (url) => set({ activeVideoCall: url }),
  setOnlineUsers: (ids) => set({ onlineUserIds: ids }),

  markAsRead: (roomId) => set((s) => ({
    unreadCounts: { ...s.unreadCounts, [roomId]: 0 }
  })),

  incrementUnread: (roomId) => set((s) => ({
    unreadCounts: { ...s.unreadCounts, [roomId]: (s.unreadCounts[roomId] || 0) + 1 }
  })),

  setMessages: (roomId, messages) => set((s) => ({
    messagesCache: { ...s.messagesCache, [roomId]: messages }
  })),

  appendMessage: (roomId, message) => set((s) => {
    const existing = s.messagesCache[roomId] || [];
    // Avoid duplicates
    if (existing.some((m) => m.id === message.id)) return s;
    return { messagesCache: { ...s.messagesCache, [roomId]: [...existing, message] } };
  }),

  prependMessages: (roomId, messages) => set((s) => {
    const existing = s.messagesCache[roomId] || [];
    return { messagesCache: { ...s.messagesCache, [roomId]: [...messages, ...existing] } };
  }),

  updateRoomLastMessage: (roomId, content, at) => set((s) => ({
    rooms: s.rooms.map((r) =>
      r.id === roomId ? { ...r, lastMessage: content, lastMessageAt: at } : r
    )
  })),
}));
