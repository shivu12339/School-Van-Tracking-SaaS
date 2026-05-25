import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  isImpersonating: boolean;
  setUser: (user: AuthUser | null) => void;
  setImpersonating: (value: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isImpersonating: false,
  setUser: (user) => set({ user }),
  setImpersonating: (isImpersonating) => set({ isImpersonating }),
  reset: () => set({ user: null, isImpersonating: false }),
}));
