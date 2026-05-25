export const SUPER_ADMIN_NAV = [
  { href: '/super-admin', label: 'Overview', icon: 'LayoutDashboard' },
  { href: '/super-admin/schools', label: 'Schools', icon: 'Building2' },
  { href: '/super-admin/subscriptions', label: 'Subscriptions', icon: 'CreditCard' },
  { href: '/super-admin/analytics', label: 'Analytics', icon: 'BarChart3' },
  { href: '/super-admin/health', label: 'Platform Health', icon: 'Activity' },
  { href: '/super-admin/settings', label: 'Settings', icon: 'FileBarChart' },
] as const;

export const SCHOOL_ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/tracking', label: 'Live Tracking', icon: 'Map' },
  { href: '/admin/drivers', label: 'Drivers', icon: 'UserCog' },
  { href: '/admin/vans', label: 'Vans', icon: 'Bus' },
  { href: '/admin/students', label: 'Students', icon: 'GraduationCap' },
  { href: '/admin/parents', label: 'Parents', icon: 'Users' },
  { href: '/admin/routes', label: 'Routes', icon: 'Route' },
  { href: '/admin/trips', label: 'Trips', icon: 'CalendarClock' },
  { href: '/admin/notifications', label: 'Notifications', icon: 'Bell' },
  { href: '/admin/reports', label: 'Reports', icon: 'FileBarChart' },
  { href: '/admin/settings', label: 'Settings', icon: 'FileBarChart' },
] as const;
