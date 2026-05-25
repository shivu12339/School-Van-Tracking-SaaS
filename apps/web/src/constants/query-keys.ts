export const queryKeys = {
  auth: { me: ['auth', 'me'] as const },
  schools: {
    all: ['schools'] as const,
    list: (page: number, search: string) => ['schools', page, search] as const,
    analytics: (id: string) => ['school-analytics', id] as const,
    platform: ['platform-analytics'] as const,
  },
  fleet: {
    drivers: (page: number, search: string) => ['drivers', page, search] as const,
    vans: (page: number, search: string) => ['vans', page, search] as const,
    students: (page: number, search: string) => ['students', page, search] as const,
    parents: (page: number, search: string) => ['parents', page, search] as const,
    routes: (page: number, search: string) => ['routes', page, search] as const,
    trips: (page: number, search: string) => ['trips', page, search] as const,
    tripsActive: ['trips', 'active'] as const,
    tripAnalytics: ['trips', 'analytics'] as const,
  },
  notifications: {
    list: (page: number) => ['notifications', page] as const,
    unread: ['notifications', 'unread'] as const,
    analytics: (schoolId?: string) => ['notification-analytics', schoolId] as const,
  },
  tracking: {
    active: ['tracking', 'active'] as const,
    live: (tripId: string) => ['tracking', 'live', tripId] as const,
    playback: (tripId: string) => ['tracking', 'playback', tripId] as const,
  },
} as const;
