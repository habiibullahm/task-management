import { create } from 'zustand';
import type { RealtimePayload } from '@/services/realtime';

export interface AppNotification {
  id: string;
  message: string;
  type: string;
  taskId?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  addFromRealtime: (payload: RealtimePayload) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,

  addFromRealtime: (payload) => {
    const item: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message: payload.message,
      type: payload.type,
      taskId: payload.taskId,
      createdAt: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      items: [item, ...state.items].slice(0, 30),
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAllRead: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clear: () => set({ items: [], unreadCount: 0 }),
}));
