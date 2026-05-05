import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notification) => set((state) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    return {
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    };
  }),

  markAsRead: (id) => set((state) => {
    const updatedNotifications = state.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    const unreadCount = updatedNotifications.filter(n => !n.read).length;
    
    return { notifications: updatedNotifications, unreadCount };
  }),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0
  })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
