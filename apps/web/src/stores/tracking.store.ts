import { create } from 'zustand';
import type { VanLocation } from '@/services/tracking.service';

interface TrackingState {
  liveVans: Record<string, VanLocation>;
  onlineDrivers: Record<string, boolean>;
  sosAlerts: { id: string; tripId: string; description?: string; createdAt: string }[];
  setVanLocation: (location: VanLocation) => void;
  setDriverOnline: (driverId: string, online: boolean) => void;
  addSosAlert: (alert: TrackingState['sosAlerts'][number]) => void;
  clear: () => void;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  liveVans: {},
  onlineDrivers: {},
  sosAlerts: [],
  setVanLocation: (location) =>
    set((s) => ({ liveVans: { ...s.liveVans, [location.tripId]: location } })),
  setDriverOnline: (driverId, online) =>
    set((s) => ({ onlineDrivers: { ...s.onlineDrivers, [driverId]: online } })),
  addSosAlert: (alert) => set((s) => ({ sosAlerts: [alert, ...s.sosAlerts].slice(0, 20) })),
  clear: () => set({ liveVans: {}, onlineDrivers: {}, sosAlerts: [] }),
}));
