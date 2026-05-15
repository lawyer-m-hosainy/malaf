import { create } from 'zustand';

interface ChatStore {
  activeRoomId: string | null;
  rooms: any[];
  unreadCounts: Record<string, number>;
  activeVideoCall: string | null;
  setActiveRoom: (id: string | null) => void;
  setRooms: (rooms: any[]) => void;
  setActiveVideoCall: (url: string | null) => void;
  markAsRead: (roomId: string) => void;
  incrementUnread: (roomId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeRoomId: null,
  rooms: [],
  unreadCounts: {},
  activeVideoCall: null,
  setActiveRoom: (id) => set({ activeRoomId: id }),
  setRooms: (rooms) => set({ rooms }),
  setActiveVideoCall: (url) => set({ activeVideoCall: url }),
  markAsRead: (roomId) => set((state) => ({
    unreadCounts: { ...state.unreadCounts, [roomId]: 0 }
  })),
  incrementUnread: (roomId) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [roomId]: (state.unreadCounts[roomId] || 0) + 1
    }
  }))
}));
