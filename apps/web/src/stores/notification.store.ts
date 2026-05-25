import { create } from 'zustand';

interface NotificationState {
  unread: number;
  setUnread: (count: number) => void;
  incrementUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unread: 0,
  setUnread: (unread) => set({ unread }),
  incrementUnread: () => set((s) => ({ unread: s.unread + 1 })),
}));
