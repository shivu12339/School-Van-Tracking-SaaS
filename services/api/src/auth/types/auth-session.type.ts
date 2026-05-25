/** Device session summary returned by GET /auth/sessions */
export interface DeviceSessionSummary {
  id: string;
  deviceId: string;
  platform: string;
  appVersion: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
}
